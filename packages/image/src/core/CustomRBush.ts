import type { BBox } from 'rbush';
import RBush from 'rbush';
import { v4 as uuid } from 'uuid';

import type { AxisPoint, Shape } from '../shapes';
import { Point } from '../shapes';
import type { Group } from '../shapes/Group';
import { axis, eventEmitter } from '../singletons';
import { EInternalEvent } from '../enums';
import { getDistanceToLine, getLatestPointOnLine } from '../shapes/math.util';

export interface RBushItem extends BBox {
  id: string;
  _shape?: Shape<any>;
  _group?: Group<Shape<any>, any>;
  /** 标注顺序，目前只在group当中有这个值 */
  _order?: number;
}

export class CustomRBush extends RBush<RBushItem> {
  private _nearestPoint: Point | null = null;

  constructor() {
    super();

    eventEmitter.on(EInternalEvent.Render, this._onRender);
  }

  private _onRender = () => {
    const { _nearestPoint } = this;

    if (!axis || !axis.renderer) {
      return;
    }

    if (_nearestPoint) {
      // NOTE: rbush是在创建画布前就已创建的一个全局实例，需要在clear画布后再渲染
      Promise.resolve().then(() => {
        _nearestPoint.render(axis!.renderer!.ctx);
      });
    }
  };

  /**
   * 扫描给定坐标点附近的图形元素
   *
   * @param coordinate 坐标点
   * @param threshold 阈值
   */
  public scanCanvasObject(coordinate: AxisPoint, threshold = 0) {
    return this.search({
      minX: coordinate.x - threshold,
      minY: coordinate.y - threshold,
      maxX: coordinate.x + threshold,
      maxY: coordinate.y + threshold,
    });
  }

  /**
   * 扫描多边形并设置最近的点
   *
   * @description 目前仅多边形需要支持吸附
   *
   * @param dynamicCoordinate 动态坐标
   * @param threshold 阈值
   * @param excludeGroupIds 排除的组id
   * @returns 最近的点
   */
  public scanPolygonsAndSetNearestPoint(
    dynamicCoordinate: AxisPoint,
    threshold: number,
    excludeGroupIds: string[] | undefined = [],
  ) {
    if (threshold === 0) {
      console.warn('threshold is 0');
    }

    if (!threshold) {
      return;
    }

    const { _nearestPoint } = this;

    let nearestPoint;
    const rbushItems = this.scanCanvasObject(dynamicCoordinate, threshold);
    const groups =
      rbushItems
        ?.filter((item) => item._group && !excludeGroupIds.includes(item._group.id))
        .map((item) => item._group) ?? [];

    // 找到距离最近的那条边
    for (const group of groups) {
      if (!group) {
        continue;
      }

      const points = group.shapes[0].dynamicCoordinate;
      const fullPoints = [...points, points[0]];

      for (let i = 1; i < fullPoints.length; i++) {
        const distance = getDistanceToLine(dynamicCoordinate, fullPoints[i - 1], fullPoints[i]);

        if (distance < threshold) {
          nearestPoint = getLatestPointOnLine(dynamicCoordinate, fullPoints[i - 1], fullPoints[i]);
          break;
        }
      }
    }

    // 创建预设点
    if (nearestPoint) {
      const latestPointUnscaled = axis!.getOriginalCoord(nearestPoint);

      if (_nearestPoint) {
        _nearestPoint.coordinate[0].x = latestPointUnscaled.x;
        _nearestPoint.coordinate[0].y = latestPointUnscaled.y;
      } else {
        this._nearestPoint = new Point({
          id: uuid(),
          style: { fill: '#fff', radius: 3, strokeWidth: 0, stroke: '#000' },
          coordinate: latestPointUnscaled,
        });
      }
    } else {
      this._nearestPoint?.destroy();
      this._nearestPoint = null;
    }

    return this._nearestPoint?.coordinate[0];
  }

  public get nearestPoint() {
    return this._nearestPoint;
  }

  public destroy() {
    eventEmitter.off(EInternalEvent.Render, this._onRender);
  }
}
