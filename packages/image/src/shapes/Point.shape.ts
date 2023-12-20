import { Shape } from './Shape';
import { getDistance } from './math.util';

export interface AxisPoint {
  x: number;
  y: number;
}

export interface PointStyle {
  /**
   * 点边框颜色
   *
   * @default #000
   */
  stroke?: string;

  /**
   * 点边框宽度
   *
   * @default 0
   */
  strokeWidth?: number;

  /**
   * 点填充颜色
   *
   * @default #000
   */
  fill?: string;

  /**
   * 点半径
   *
   * @default 2
   */
  radius?: number;

  /**
   * 点透明度
   *
   * @default 1
   */
  opacity?: number;

  /**
   * 点起始角度
   *
   * @default 0
   */
  startAngle?: number;

  /**
   * 点结束角度
   *
   * @default Math.PI * 2
   */
  endAngle?: number;
}

export interface PointParams {
  id: string;
  name?: string;
  coordinate: AxisPoint;
  style?: PointStyle;
}

/**
 * 基础图形点
 */
export class Point extends Shape<PointStyle> {
  /**
   * Rbush 碰撞检测阈值
   */
  static DISTANCE_THRESHOLD = 0 as const;

  static DEFAULT_STYLE: Required<PointStyle> = {
    stroke: 'transparent',
    strokeWidth: 0,
    fill: '#000',
    radius: 3,
    opacity: 1,
    startAngle: 0,
    endAngle: Math.PI * 2,
  };

  public style: Required<PointStyle> = Point.DEFAULT_STYLE;

  name?: string;

  constructor({ id, name, coordinate, style }: PointParams) {
    super(id, coordinate);

    this.name = name;

    if (style) {
      this.style = { ...this.style, ...style };
    }

    this.onCoordinateChange(() => {
      const [{ x, y }] = this.dynamicCoordinate;

      this.bbox = {
        minX: x - this.style.radius,
        minY: y - this.style.radius,
        maxX: x + this.style.radius,
        maxY: y + this.style.radius,
      };
    });
  }

  /**
   * 是否在鼠标指针下
   *
   * @param mouseCoord 鼠标坐标
   */
  public isUnderCursor(mouseCoord: AxisPoint) {
    const { style, dynamicCoordinate } = this;

    const distance = getDistance(mouseCoord, dynamicCoordinate[0]);

    if (distance < Point.DISTANCE_THRESHOLD + ((style.radius ?? 0) + (style.strokeWidth ?? 0))) {
      return true;
    }

    return false;
  }

  public render(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) {
      throw Error('No context specific!');
    }

    const { style, dynamicCoordinate } = this;
    const { stroke, strokeWidth, radius, fill, opacity, startAngle, endAngle } = style;
    const [{ x, y }] = dynamicCoordinate;

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = stroke;
    ctx.fillStyle = fill;
    ctx.lineWidth = strokeWidth;

    ctx.globalAlpha = opacity;
    ctx.beginPath();

    ctx.arc(x, y, radius, startAngle, endAngle, false);
    ctx.stroke();
    ctx.fill();

    // 恢复透明度
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
