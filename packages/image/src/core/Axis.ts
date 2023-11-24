import EventEmitter from 'eventemitter3';
import type { BBox } from 'rbush';
import RBush from 'rbush';

import type { AxisPoint } from '../graphics/Point';
import { Cursor } from '../graphics/Cursor';
import { Ticker } from './Ticker';
import type { Annotator } from '../ImageAnnotator';
import type { ToolName } from '../tools/interface';
import { EInternalEvent } from '../enums';

const SCALE_FACTOR = 1.1;

export interface RBushItem extends BBox {
  type: ToolName;
  id: string;
}

function validateAnnotator(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const _this = this as Axis;

    if (!_this.annotator) {
      throw new Error('Error: annotator is not defined.');
    }

    return originalMethod.apply(this, args);
  };
}

/**
 * 画布坐标系 Axis，用于管理画布的移动、缩放等操作
 */
export class Axis {
  static MIN_SCALE = 0.1;

  static MAX_SCALE = 20;

  private _annotator: Annotator | null = null;

  /** 画布相对左上角原点偏移的 x 距离 */
  private _x: number = 0;

  /** 画布相对左上角原点偏移的 y 距离 */
  private _y: number = 0;

  private _rect: DOMRect | null = null;

  /** 缩放比例 */
  private _scale: number = 1;

  /**
   * 移动时的起始点
   */
  private _startPoint: AxisPoint | null = null;

  private _distanceX: number = 0;

  private _distanceY: number = 0;

  private _cursor: Cursor | null = null;

  private _ticker: Ticker | null = null;

  /**
   * 用于内部模块通信
   *
   * @description
   *
   * axis贯穿于各个模块中，适合在axis中挂载事件。
   *
   * NOTE: 如果挂载在annotator上，增加Tool下子类对Annotator的引用就会变复杂，所以尽量保持Tool子类纯粹。
   */
  private _event: EventEmitter = new EventEmitter();

  /**
   * 以鼠标为中心缩放时的坐标
   */
  private _scaleCenter: AxisPoint = {
    x: 0,
    y: 0,
  };

  /**
   * 以 R-Tree 为基础的空间索引
   * 使用 rbush，用于吸附和高亮等交互
   *
   * @see https://github.com/mourner/rbush#readme
   */
  private _rbush: RBush<RBushItem> = new RBush();

  constructor(annotator: Annotator) {
    const { cursor } = annotator!.config;

    this._annotator = annotator;
    this._rect = annotator.renderer!.canvas.getBoundingClientRect();

    this._createTicker();
    this._bindEvents();
    this._cursor = new Cursor({ x: 0, y: 0, ...cursor });
    // NOTE: debug
    this._renderRBushTree();
  }

  private _bindEvents() {
    const { canvas } = this._annotator!.renderer!;

    /**
     * NOTE: 画布元素的事件监听都应该在这里绑定，而不是在分散具体的工具中绑定
     */
    canvas.addEventListener('contextmenu', this._handleMoveStart.bind(this), false);
    canvas.addEventListener('mousemove', this._handleMoving.bind(this), false);
    canvas.addEventListener('mouseup', this._handleMoveEnd.bind(this), false);
    canvas.addEventListener('wheel', this._handleScroll.bind(this), false);
    canvas.addEventListener('click', this._handleClick.bind(this), false);
  }

  private _offEvents() {
    const { canvas } = this._annotator!.renderer!;

    canvas.removeEventListener('contextmenu', this._handleMoveStart.bind(this));
    canvas.removeEventListener('mousemove', this._handleMoving.bind(this));
    canvas.removeEventListener('mouseup', this._handleMoveEnd.bind(this));
    canvas.removeEventListener('wheel', this._handleScroll.bind(this));
    canvas.removeEventListener('click', this._handleClick.bind(this));
  }

  @validateAnnotator
  private _handleClick(e: MouseEvent) {
    const mouseCoord = {
      x: e.offsetX,
      y: e.offsetY,
    };
    const rbushItems = this._scanCanvasObject(mouseCoord);

    this.emit(EInternalEvent.Click, e, rbushItems, mouseCoord);
  }

  @validateAnnotator
  private _handleMoveStart(e: MouseEvent) {
    e.preventDefault();
    const { container } = this._annotator!.config!;

    if (!container) {
      return;
    }

    this._isMoving = false;

    // 起始点：鼠标点击位置：在画布内的真实坐标
    this._startPoint = this._getCoordInCanvas({
      x: e.offsetX,
      y: e.offsetY,
    });

    this.emit(EInternalEvent.PanStart, e);
  }

  @validateAnnotator
  private _pan(e: MouseEvent) {
    const { _startPoint, _annotator } = this;
    const point = this._getCoordInCanvas({
      x: e.offsetX,
      y: e.offsetY,
    });

    this._x = this._x + point.x - _startPoint!.x;
    this._y = this._y + point.y - _startPoint!.y;

    _annotator!.renderer!.canvas.style.cursor = 'grabbing';

    this.emit(EInternalEvent.Pan, e);
  }

  private _handleMoving(e: MouseEvent) {
    e.preventDefault();

    if (this._startPoint) {
      this._pan(e);
      // 移动画布时隐藏鼠标指针，移动时始终在画布外面
      this._cursor!.updateCoordinate(Math.min(-this._x - 1, -1), Math.min(-this._y - 1, -1));
    } else {
      const mouseCoord = {
        x: e.offsetX,
        y: e.offsetY,
      };
      this._cursor!.updateCoordinate(mouseCoord.x, mouseCoord.y);
      // 鼠标移动时，需要实时检查在是否有图形元素在鼠标位置
      const rbushItems = this._scanCanvasObject(mouseCoord);

      // 向订阅了move事件的图形工具发送事件，由每个工具自行实现鼠标经过的逻辑。
      this.emit(EInternalEvent.Move, e, rbushItems, mouseCoord);
    }

    // 只要鼠标在画布内移动，触发画布更新
    this._ticker?.requestUpdate();
  }

  @validateAnnotator
  private _handleMoveEnd(e: MouseEvent) {
    e.preventDefault();
    const { _annotator } = this;

    _annotator!.renderer!.canvas.style.cursor = 'none';

    this._x = this._x + this._distanceX;
    this._y = this._y + this._distanceY;
    this._startPoint = null;
    this.emit(EInternalEvent.MoveEnd, e);
  }

  private _handleScroll(e: WheelEvent) {
    e.preventDefault();

    // 当前鼠标所在画布屏幕上的坐标（不是在画布坐标系里面）
    const point = this.getCoordRelativeToCanvas(e as MouseEvent);

    const scaleFactor = e.deltaY < 0 ? SCALE_FACTOR : 1 / SCALE_FACTOR;

    if (this._scale * scaleFactor < Axis.MIN_SCALE || this._scale * scaleFactor > Axis.MAX_SCALE) {
      return;
    }

    // 画布坐标原点距离画布左上角的新的偏移量
    const newX = point.x - (point.x - this._x) * scaleFactor;
    const newY = point.y - (point.y - this._y) * scaleFactor;

    this._scaleCenter = point;

    this._x = newX;
    this._y = newY;
    this._scale *= scaleFactor;

    this._ticker?.requestUpdate();

    this.emit(EInternalEvent.Zoom, e);
  }

  /**
   * 扫描鼠标经过画布内的图形元素，触发move事件
   *
   * @description
   *
   * 1. 首先通过鼠标坐标，从 R-Tree 中搜索出所有可能的图形元素
   * 2. 从id中取得映射的图形元素
   * 3. 根据图形类别，判断鼠标是否真实落在图形上
   * @param e
   */
  private _scanCanvasObject(mouseCoord: AxisPoint) {
    return this._rbush.search({
      minX: mouseCoord.x,
      minY: mouseCoord.y,
      maxX: mouseCoord.x,
      maxY: mouseCoord.y,
    });
  }

  /**
   * 获取鼠标相对于画布的坐标
   */
  @validateAnnotator
  private getCoordRelativeToCanvas(e: MouseEvent) {
    const { _rect } = this;

    return {
      x: e.clientX - _rect!.left,
      y: e.clientY - _rect!.top,
    };
  }

  private _getCoordInCanvas(p: AxisPoint) {
    if (!p) {
      throw new Error('Error: p is not defined.');
    }

    const { _x, _y } = this;

    return {
      x: p.x - _x,
      y: p.y - _y,
    };
  }

  @validateAnnotator
  private _rerender() {
    const { _cursor, _annotator } = this;
    const { renderer } = _annotator!;

    this.emit(EInternalEvent.Render, renderer!.ctx);
    _cursor!.render(renderer!.ctx);
    // debug
    this._renderRBushTree();
  }

  /**
   * Debug使用，渲染R-Tree
   */
  private _renderRBushTree() {
    const { ctx } = this._annotator!.renderer!;

    ctx!.save();
    ctx!.strokeStyle = '#000';
    ctx!.globalAlpha = 1;
    ctx!.lineDashOffset = 2;
    ctx!.setLineDash([2, 2]);
    ctx!.lineWidth = 1;

    this._rbush.all().forEach((item) => {
      const { minX, minY, maxX, maxY } = item;

      ctx!.strokeRect(minX, minY, maxX - minX, maxY - minY);
    });

    ctx!.globalAlpha = 1;
    ctx!.restore();
  }

  /**
   * 创建更新器
   * @returns
   */
  private _createTicker() {
    this._ticker = new Ticker(() => {
      this._rerender();
    });

    this._ticker.start();
  }

  public get scale() {
    return this._scale;
  }

  public get rbush() {
    return this._rbush;
  }

  public get annotator() {
    return this._annotator;
  }

  /**
   * 获取缩放后的坐标
   *
   * @description
   *
   * 以线段为例，首先定义以下变量：
   * (x1, y1) 和 (x2, y2)：线段的起点和终点坐标
   * (cx, cy)：缩放中心点的坐标
   * scale：缩放比例
   * _x 和 _y：偏移量
   *
   * new_x1 = _x + (cx + (x1 - cx) * scale)
   *                     └-----------------┘  ┐
   * new_y1 = _y + (cy + (y1 - cy) * scale)    → 是根据缩放中心(cx, cy)，将线段起点(x1,y1)进行缩放后的新坐标。
   *                     └-----------------┘  ┘
   * new_x2 = _x + (cx + (x2 - cx) * scale)
   *               └-----------------------┘  ┐
   * new_y2 = _y + (cy + (y2 - cy) * scale)    → 是将缩放后的坐标重新平移到原来的位置。因为初始的缩放是以(cx,cy)为原点，所以要加上cx和cy将缩放后的坐标平移到正确的位置。
   *               └-----------------------┘  ┘
   *         └----------------↓------------┘
   *         这是最终偏移量后的坐标。由于画布可能有一定的偏移量（_x 和 _y），所以需要把这个偏移量也考虑进去。
   *
   * @param originCoord 原始坐标
   * @returns 缩放后的坐标
   */
  public getScaledCoord(originCoord: AxisPoint): AxisPoint {
    const { x, y } = originCoord;

    return {
      x: this.getScaledX(x),
      y: this.getScaledY(y),
    };
  }

  public getScaledX(x: number) {
    const { _x, _scaleCenter, _scale } = this;

    return _x + (_scaleCenter.x + (x - _scaleCenter.x)) * _scale;
  }

  public getScaledY(y: number) {
    const { _y, _scaleCenter, _scale } = this;

    return _y + (_scaleCenter.y + (y - _scaleCenter.y)) * _scale;
  }

  public destroy() {
    this._offEvents();
    this._event.removeAllListeners();
    this._ticker?.stop();
    this._ticker = null;
  }

  // ================= 增加event代理 =================
  public on(eventName: string, listener: (...args: any[]) => void) {
    return this._event.on(eventName, listener);
  }

  public once(eventName: string, listener: (...args: any[]) => void) {
    return this._event.once(eventName, listener);
  }

  public off(eventName: string, listener: (...args: any[]) => void) {
    return this._event.off(eventName, listener);
  }

  public emit(eventName: string, ...args: any[]) {
    return this._event.emit(eventName, ...args);
  }
}
