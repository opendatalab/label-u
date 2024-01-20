import cloneDeep from 'lodash.clonedeep';

import { Shape } from './Shape';
import type { AxisPoint } from './Point.shape';
import { getDistanceToLine } from './math.util';
import { DEFAULT_LABEL_COLOR } from '../constant';

export interface LineStyle {
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export type LineCoordinate = [
  /** 起始点 */
  AxisPoint,
  /** 结束点 */
  AxisPoint,
];

export interface LineParams {
  id: string;
  coordinate: LineCoordinate;
  style?: LineStyle;
}

export class Line extends Shape<LineStyle> {
  /**
   * Rbush 碰撞检测阈值
   */
  static DISTANCE_THRESHOLD = 2 as const;

  static DEFAULT_STYLE: Required<LineStyle> = {
    stroke: DEFAULT_LABEL_COLOR,
    strokeWidth: 2,
    opacity: 1,
  };

  public style: Required<LineStyle> = Line.DEFAULT_STYLE;

  constructor({ id, coordinate, style }: LineParams) {
    super(id, coordinate);

    if (style) {
      this.style = { ...this.style, ...style };
    }
  }

  public serialize() {
    const { id, style, plainCoordinate, dynamicCoordinate } = this;

    return {
      id,
      coordinate: cloneDeep(plainCoordinate),
      dynamicCoordinate: cloneDeep(dynamicCoordinate),
      style,
    };
  }

  /**
   * 是否在鼠标指针下
   *
   * @param mouseCoord 鼠标坐标
   */
  public isUnderCursor(mouseCoord: AxisPoint) {
    const { style, dynamicCoordinate } = this;

    const distance = getDistanceToLine(mouseCoord, dynamicCoordinate[0], dynamicCoordinate[1]);

    if (distance < Line.DISTANCE_THRESHOLD + (style.strokeWidth ?? 0) / 2) {
      return true;
    }

    return false;
  }

  public render(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) {
      throw Error('No context specific!');
    }

    const { style, dynamicCoordinate } = this;
    const { stroke, strokeWidth, opacity } = style;
    const [start, end] = dynamicCoordinate;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);

    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
