import { v4 as uuid } from 'uuid';
import cloneDeep from 'lodash.clonedeep';
import type { BBox } from 'rbush';

import type { RectStyle } from '../shapes/Rect.shape';
import type { RectData } from '../annotation';
import type { AxisPoint, LineCoordinate, PointStyle, Point } from '../shapes';
import { axis } from '../singletons';
import type { AnnotationParams } from '../annotation/Annotation';
import { Annotation } from '../annotation/Annotation';
import { ControllerPoint } from './ControllerPoint';
import { DraftObserverMixin } from './DraftObserver';
import { ControllerEdge } from './ControllerEdge';

type ControllerPosition = 'nw' | 'ne' | 'se' | 'sw';

type EdgePosition = 'top' | 'right' | 'bottom' | 'left';

export class DraftRect extends DraftObserverMixin(
  Annotation<RectData, ControllerEdge | Point, RectStyle | PointStyle>,
) {
  private _isControllerPicked: boolean = false;

  private _preBBox: BBox | null = null;

  private _previousDynamicCoordinates: AxisPoint[][] | null = null;

  private _controllerPositionMapping: Map<ControllerPosition, ControllerPoint> = new Map();

  private _edgePositionMapping: Map<EdgePosition, ControllerEdge> = new Map();

  constructor(params: AnnotationParams<RectData, RectStyle>) {
    super(params);

    this._setupShapes();
    this.onMouseDown(this._onMouseDown);
    this.onMove(this._onMouseMove);
    this.onMouseUp(this._onMouseUp);
  }

  /**
   * 设置图形
   */
  private _setupShapes() {
    const { data, group, style } = this;

    const lineCoordinates: {
      name: EdgePosition;
      coordinate: LineCoordinate;
    }[] = [
      // Top
      {
        name: 'top',
        coordinate: [
          { x: data.x, y: data.y },
          { x: data.x + data.width, y: data.y },
        ],
      },
      // Right
      {
        name: 'right',
        coordinate: [
          { x: data.x + data.width, y: data.y },
          { x: data.x + data.width, y: data.y + data.height },
        ],
      },
      // Bottom
      {
        name: 'bottom',
        coordinate: [
          { x: data.x + data.width, y: data.y + data.height },
          { x: data.x, y: data.y + data.height },
        ],
      },
      // Left
      {
        name: 'left',
        coordinate: [
          { x: data.x, y: data.y + data.height },
          { x: data.x, y: data.y },
        ],
      },
    ];

    for (let i = 0; i < lineCoordinates.length; i++) {
      const edge = new ControllerEdge({
        id: uuid(),
        name: lineCoordinates[i].name,
        coordinate: lineCoordinates[i].coordinate,
        style: { ...style, strokeWidth: 5 },
      });

      this._edgePositionMapping.set(lineCoordinates[i].name as EdgePosition, edge);

      group.add(edge);
    }

    const points = [
      {
        // 左上角
        name: 'nw',
        x: data.x,
        y: data.y,
      },
      {
        // 右上角
        name: 'ne',
        x: data.x + data.width,
        y: data.y,
      },
      {
        // 右下角
        name: 'se',
        x: data.x + data.width,
        y: data.y + data.height,
      },
      {
        // 左下角
        name: 'sw',
        x: data.x,
        y: data.y + data.height,
      },
    ];

    // 点要覆盖在线上
    for (let i = 0; i < points.length; i++) {
      const point = new ControllerPoint({
        id: uuid(),
        name: points[i].name,
        coordinate: points[i],
        style: { ...style, radius: 8, stroke: 'transparent', fill: 'blue' },
      });

      this._controllerPositionMapping.set(points[i].name as ControllerPosition, point);

      point.onMouseDown(this._onControllerPointDown);
      point.onMove(this._onControllerPointMove);
      point.onMouseUp(this._onControllerPointUp);

      group.add(point);
    }
  }

  // ========================== 选中的标注草稿 ==========================

  /**
   * 选中草稿
   */
  private _onMouseDown = () => {
    const { _isControllerPicked } = this;

    // 选中控制点时，不需要选中草稿
    if (_isControllerPicked) {
      return;
    }

    this._isControllerPicked = false;
    this.isPicked = true;
    this._previousDynamicCoordinates = this.getDynamicCoordinates();
  };

  /**
   * 移动草稿
   */
  private _onMouseMove = () => {
    const { isPicked, _previousDynamicCoordinates, group } = this;

    if (!isPicked || !_previousDynamicCoordinates) {
      return;
    }

    // 更新草稿坐标
    group.each((shape, index) => {
      if (shape instanceof ControllerPoint) {
        shape.coordinate = [
          axis!.getOriginalCoord({
            x: _previousDynamicCoordinates[index][0].x + axis!.distance.x,
            y: _previousDynamicCoordinates[index][0].y + axis!.distance.y,
          }),
        ];
      } else {
        shape.coordinate = [
          axis!.getOriginalCoord({
            x: _previousDynamicCoordinates[index][0].x + axis!.distance.x,
            y: _previousDynamicCoordinates[index][0].y + axis!.distance.y,
          }),
          axis!.getOriginalCoord({
            x: _previousDynamicCoordinates[index][1].x + axis!.distance.x,
            y: _previousDynamicCoordinates[index][1].y + axis!.distance.y,
          }),
        ];
      }
    });

    // 手动更新组合的包围盒
    this.group.update();
    // 手动将坐标同步到数据
    this.syncCoordToData();
  };

  private _onMouseUp = () => {
    this.isPicked = false;
    this._previousDynamicCoordinates = null;
  };

  // ========================== 控制点 ==========================
  /**
   * 按下控制点
   * @param point
   * @description 按下控制点时，记录受影响的线段
   */
  private _onControllerPointDown = () => {
    this._isControllerPicked = true;
    this._preBBox = this.getBBoxWithoutControllerPoint();
  };

  /**
   * 移动控制点
   * @param ControllerPoint
   * @description 控制点移动时，更新线段的端点
   */
  private _onControllerPointMove = (controllerPoint: ControllerPoint) => {
    const { _controllerPositionMapping, _edgePositionMapping, _preBBox } = this;

    if (!_preBBox) {
      return;
    }

    const { name: selectedPointName } = controllerPoint;
    const nwPoint = _controllerPositionMapping.get('nw')!;
    const nePoint = _controllerPositionMapping.get('ne')!;
    const sePoint = _controllerPositionMapping.get('se')!;
    const swPoint = _controllerPositionMapping.get('sw')!;

    const topEdge = _edgePositionMapping.get('top')!;
    const rightEdge = _edgePositionMapping.get('right')!;
    const bottomEdge = _edgePositionMapping.get('bottom')!;
    const leftEdge = _edgePositionMapping.get('left')!;

    // 更新端点坐标
    if (selectedPointName === 'nw') {
      swPoint.coordinate[0].x = controllerPoint.coordinate[0].x;
      nePoint.coordinate[0].y = controllerPoint.coordinate[0].y;

      // 更新Top线段坐标
      topEdge.coordinate[0].x = controllerPoint.coordinate[0].x;
      topEdge.coordinate[0].y = controllerPoint.coordinate[0].y;
      topEdge.coordinate[1].y = controllerPoint.coordinate[0].y;
      // 更新Left线段坐标
      leftEdge.coordinate[1].x = controllerPoint.coordinate[0].x;
      leftEdge.coordinate[1].y = controllerPoint.coordinate[0].y;
      leftEdge.coordinate[0].x = controllerPoint.coordinate[0].x;
      // 更新Bottom线段坐标
      bottomEdge.coordinate[1].x = controllerPoint.coordinate[0].x;
      // 更新Right线段坐标
      rightEdge.coordinate[0].y = controllerPoint.coordinate[0].y;
    } else if (selectedPointName === 'ne') {
      sePoint.coordinate[0].x = controllerPoint.coordinate[0].x;
      nwPoint.coordinate[0].y = controllerPoint.coordinate[0].y;

      // 更新Top线段坐标
      topEdge.coordinate[1].x = controllerPoint.coordinate[0].x;
      topEdge.coordinate[1].y = controllerPoint.coordinate[0].y;
      topEdge.coordinate[0].y = controllerPoint.coordinate[0].y;
      // 更新Right线段坐标
      rightEdge.coordinate[0].x = controllerPoint.coordinate[0].x;
      rightEdge.coordinate[0].y = controllerPoint.coordinate[0].y;
      rightEdge.coordinate[1].x = controllerPoint.coordinate[0].x;
      // 更新Bottom线段坐标
      bottomEdge.coordinate[0].x = controllerPoint.coordinate[0].x;
      // 更新Left线段坐标
      leftEdge.coordinate[1].y = controllerPoint.coordinate[0].y;
    } else if (selectedPointName === 'se') {
      nePoint.coordinate[0].x = controllerPoint.coordinate[0].x;
      swPoint.coordinate[0].y = controllerPoint.coordinate[0].y;

      // 更新Right线段坐标
      rightEdge.coordinate[1].x = controllerPoint.coordinate[0].x;
      rightEdge.coordinate[1].y = controllerPoint.coordinate[0].y;
      rightEdge.coordinate[0].x = controllerPoint.coordinate[0].x;
      // 更新Bottom线段坐标
      bottomEdge.coordinate[0].x = controllerPoint.coordinate[0].x;
      bottomEdge.coordinate[0].y = controllerPoint.coordinate[0].y;
      bottomEdge.coordinate[1].y = controllerPoint.coordinate[0].y;
      // 更新Left线段坐标
      leftEdge.coordinate[0].y = controllerPoint.coordinate[0].y;
      // 更新Top线段坐标
      topEdge.coordinate[1].x = controllerPoint.coordinate[0].x;
    } else if (selectedPointName === 'sw') {
      nwPoint.coordinate[0].x = controllerPoint.coordinate[0].x;
      sePoint.coordinate[0].y = controllerPoint.coordinate[0].y;

      // 更新Left线段坐标
      leftEdge.coordinate[0].x = controllerPoint.coordinate[0].x;
      leftEdge.coordinate[0].y = controllerPoint.coordinate[0].y;
      leftEdge.coordinate[1].x = controllerPoint.coordinate[0].x;
      // 更新Bottom线段坐标
      bottomEdge.coordinate[1].x = controllerPoint.coordinate[0].x;
      bottomEdge.coordinate[1].y = controllerPoint.coordinate[0].y;
      bottomEdge.coordinate[0].y = controllerPoint.coordinate[0].y;
      // 更新Top线段坐标
      topEdge.coordinate[0].x = controllerPoint.coordinate[0].x;
      // 更新Right线段坐标
      rightEdge.coordinate[1].y = controllerPoint.coordinate[0].y;
    }

    // 手动更新组合的包围盒
    this.group.update();

    this.syncCoordToData();
  };

  /**
   * 释放控制点
   */
  private _onControllerPointUp = () => {
    this._preBBox = this.getBBoxWithoutControllerPoint();
    this._isControllerPicked = false;
  };

  protected getDynamicCoordinates() {
    return this.group.shapes.map((shape) => cloneDeep(shape.dynamicCoordinate));
  }

  public get isControllerPicked() {
    return this._isControllerPicked;
  }

  public syncCoordToData() {
    const { data } = this;

    const bbox = this.getBBoxWithoutControllerPoint();

    data.x = axis!.getOriginalX(bbox.minX);
    data.y = axis!.getOriginalY(bbox.minY);
    data.width = axis!.getOriginalX(bbox.maxX) - data.x;
    data.height = axis!.getOriginalY(bbox.maxY) - data.y;
  }

  public isRectAndControllersUnderCursor(mouseCoord: AxisPoint) {
    const { group } = this;

    if (this.isUnderCursor(mouseCoord)) {
      return true;
    }

    for (let i = 0; i < group.shapes.length; i++) {
      const shape = group.shapes[i];

      if (shape instanceof ControllerPoint) {
        if (shape.isUnderCursor(mouseCoord)) {
          return true;
        }
      }
    }

    return false;
  }
}
