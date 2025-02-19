import type { AxisPoint } from '@/shapes';
import { CrossCursor } from '@/shapes';

import { DEFAULT_LABEL_COLOR } from '../constant';

export class CursorManager {
  public cursor: CrossCursor | null = null;

  public enabled = true;

  private _container: HTMLDivElement;

  private _cursors: Record<string, any> = {};

  private _coordinate: AxisPoint;

  private _color: string = DEFAULT_LABEL_COLOR;

  constructor(container: HTMLDivElement | null, coordinate: AxisPoint, color?: string, showAuxiliaryLine?: boolean) {
    this._coordinate = coordinate;
    this.cursor = new CrossCursor({
      ...coordinate,
      style: {
        stroke: color || this._color,
      },
      showAuxiliaryLine,
    });

    if (!container) {
      throw new Error('Container is required');
    }

    this._container = container;
    this.default();
  }

  public set color(color: string) {
    this._color = color;
    this.cursor?.setStyle({
      stroke: color,
    });
  }

  public get color() {
    return this._color;
  }

  public default() {
    this.enabled = true;
    this._container.style.cursor = 'none';
    this.cursor = new CrossCursor({
      ...this._coordinate,
      style: {
        stroke: this._color,
      },
      showAuxiliaryLine: this.cursor?.showAuxiliaryLine,
    });
  }

  public enable() {
    this.default();
  }

  public disable() {
    this.enabled = false;
    this._container.style.cursor = 'auto';
  }

  public register(name: string, cursor: CrossCursor) {
    if (this._cursors[name]) {
      console.warn(`Cursor ${name} has been registered`);
    }

    this._cursors[name] = cursor;
  }

  public grab() {
    this._container.style.cursor = 'grab';
  }

  public grabbing() {
    this._container.style.cursor = 'grabbing';
  }

  public unregister(name: string) {
    delete this._cursors[name];
  }

  public render(ctx: CanvasRenderingContext2D | null) {
    if (!this.enabled) {
      return;
    }

    if (this.cursor) {
      this.cursor.render(ctx);
    }
  }

  public move(x: number, y: number) {
    this._coordinate = { x, y };

    if (this.cursor) {
      this.cursor.updateCoordinate(x, y);
    }
  }
}
