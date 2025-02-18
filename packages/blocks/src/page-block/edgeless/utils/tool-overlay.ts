import { DisposableGroup, noop } from '@blocksuite/global/utils';

import {
  type Options,
  Overlay,
  type RoughCanvas,
  ShapeStyle,
  type XYWH,
} from '../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import {
  NOTE_OVERLAY_CORNER_RADIUS,
  NOTE_OVERLAY_DARK_BACKGROUND_COLOR,
  NOTE_OVERLAY_HEIGHT,
  NOTE_OVERLAY_LIGHT_BACKGROUND_COLOR,
  NOTE_OVERLAY_OFFSET_X,
  NOTE_OVERLAY_OFFSET_Y,
  NOTE_OVERLAY_STOKE_COLOR,
  NOTE_OVERLAY_TEXT_COLOR,
  NOTE_OVERLAY_WIDTH,
  SHAPE_OVERLAY_HEIGHT,
  SHAPE_OVERLAY_OFFSET_X,
  SHAPE_OVERLAY_OFFSET_Y,
  SHAPE_OVERLAY_WIDTH,
} from '../utils/consts.js';

const drawRectangle = (ctx: CanvasRenderingContext2D, xywh: XYWH) => {
  const [x, y, w, h] = xywh;
  ctx.rect(x, y, w, h);
};

const drawTriangle = (ctx: CanvasRenderingContext2D, xywh: XYWH) => {
  const [x, y, w, h] = xywh;
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w, y + h);
};

const drawDiamond = (ctx: CanvasRenderingContext2D, xywh: XYWH) => {
  const [x, y, w, h] = xywh;
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + w, y + h / 2);
  ctx.lineTo(x + w / 2, y + h);
  ctx.lineTo(x, y + h / 2);
};

const drawEllipse = (ctx: CanvasRenderingContext2D, xywh: XYWH) => {
  const [x, y, w, h] = xywh;
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
};

const drawRoundedRect = (ctx: CanvasRenderingContext2D, xywh: XYWH) => {
  const [x, y, w, h] = xywh;
  const width = w;
  const height = h;
  const radius = 0.1;
  const cornerRadius = Math.min(width * radius, height * radius);
  ctx.moveTo(x + cornerRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, cornerRadius);
  ctx.arcTo(x + width, y + height, x, y + height, cornerRadius);
  ctx.arcTo(x, y + height, x, y, cornerRadius);
  ctx.arcTo(x, y, x + width, y, cornerRadius);
};

const drawGeneralShape = (
  ctx: CanvasRenderingContext2D,
  type: string,
  xywh: XYWH,
  options: Options
) => {
  ctx.strokeStyle = options.stroke ?? '';
  ctx.lineWidth = options.strokeWidth ?? 2;
  ctx.fillStyle = options.fill ?? '#FFFFFF00';

  ctx.beginPath();

  switch (type) {
    case 'rect':
      drawRectangle(ctx, xywh);
      break;
    case 'triangle':
      drawTriangle(ctx, xywh);
      break;
    case 'diamond':
      drawDiamond(ctx, xywh);
      break;
    case 'ellipse':
      drawEllipse(ctx, xywh);
      break;
    case 'roundedRect':
      drawRoundedRect(ctx, xywh);
      break;
    default:
      throw new Error(`Unknown shape type: ${type}`);
  }

  ctx.closePath();

  ctx.fill();
  ctx.stroke();
};

export abstract class Shape {
  xywh: XYWH;
  type: string;
  options: Options;
  shapeStyle: ShapeStyle;

  constructor(
    xywh: XYWH,
    type: string,
    options: Options,
    shapeStyle: ShapeStyle
  ) {
    this.xywh = xywh;
    this.type = type;
    this.options = options;
    this.shapeStyle = shapeStyle;
  }

  abstract draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void;
}

export class RectShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    if (this.shapeStyle === ShapeStyle.Scribbled) {
      const [x, y, w, h] = this.xywh;
      rc.rectangle(x, y, w, h, this.options);
    } else {
      drawGeneralShape(ctx, 'rect', this.xywh, this.options);
    }
  }
}

export class TriangleShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    if (this.shapeStyle === ShapeStyle.Scribbled) {
      const [x, y, w, h] = this.xywh;
      rc.polygon(
        [
          [x + w / 2, y],
          [x, y + h],
          [x + w, y + h],
        ],
        this.options
      );
    } else {
      drawGeneralShape(ctx, 'triangle', this.xywh, this.options);
    }
  }
}

export class DiamondShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    if (this.shapeStyle === ShapeStyle.Scribbled) {
      const [x, y, w, h] = this.xywh;
      rc.polygon(
        [
          [x + w / 2, y],
          [x + w, y + h / 2],
          [x + w / 2, y + h],
          [x, y + h / 2],
        ],
        this.options
      );
    } else {
      drawGeneralShape(ctx, 'diamond', this.xywh, this.options);
    }
  }
}

export class EllipseShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    if (this.shapeStyle === ShapeStyle.Scribbled) {
      const [x, y, w, h] = this.xywh;
      rc.ellipse(x + w / 2, y + h / 2, w, h, this.options);
    } else {
      drawGeneralShape(ctx, 'ellipse', this.xywh, this.options);
    }
  }
}

export class RoundedRectShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    if (this.shapeStyle === ShapeStyle.Scribbled) {
      const [x, y, w, h] = this.xywh;
      const radius = 0.1;
      const r = Math.min(w * radius, h * radius);
      const x0 = x + r;
      const x1 = x + w - r;
      const y0 = y + r;
      const y1 = y + h - r;
      const path = `
          M${x0},${y} L${x1},${y} 
          A${r},${r} 0 0 1 ${x1},${y0} 
          L${x1},${y1} 
          A${r},${r} 0 0 1 ${x1 - r},${y1} 
          L${x0 + r},${y1} 
          A${r},${r} 0 0 1 ${x0},${y1 - r} 
          L${x0},${y0} 
          A${r},${r} 0 0 1 ${x0 + r},${y}
        `;

      rc.path(path, this.options);
    } else {
      drawGeneralShape(ctx, 'roundedRect', this.xywh, this.options);
    }
  }
}

export class ShapeFactory {
  static createShape(
    xywh: XYWH,
    type: string,
    options: Options,
    shapeStyle: ShapeStyle
  ): Shape {
    switch (type) {
      case 'rect':
        return new RectShape(xywh, type, options, shapeStyle);
      case 'triangle':
        return new TriangleShape(xywh, type, options, shapeStyle);
      case 'diamond':
        return new DiamondShape(xywh, type, options, shapeStyle);
      case 'ellipse':
        return new EllipseShape(xywh, type, options, shapeStyle);
      case 'roundedRect':
        return new RoundedRectShape(xywh, type, options, shapeStyle);
      default:
        throw new Error(`Unknown shape type: ${type}`);
    }
  }
}

class ToolOverlay extends Overlay {
  public x: number;
  public y: number;
  public globalAlpha: number;
  protected edgeless: EdgelessPageBlockComponent;
  protected disposables!: DisposableGroup;

  constructor(edgeless: EdgelessPageBlockComponent) {
    super();
    this.x = 0;
    this.y = 0;
    this.globalAlpha = 0;
    this.edgeless = edgeless;
    this.disposables = new DisposableGroup();
    this.disposables.add(
      this.edgeless.slots.viewportUpdated.on(() => {
        // when viewport is updated, we should keep the overlay in the same position
        // to get last mouse position and convert it to model coordinates
        const lastX = this.edgeless.tools.lastMousePos.x;
        const lastY = this.edgeless.tools.lastMousePos.y;
        const [x, y] = this.edgeless.surface.toModelCoord(lastX, lastY);
        this.x = x;
        this.y = y;
      })
    );
  }

  dispose(): void {
    this.disposables.dispose();
  }

  render(_ctx: CanvasRenderingContext2D, _rc: RoughCanvas): void {
    noop();
  }
}

export class ShapeOverlay extends ToolOverlay {
  public shape: Shape;

  constructor(
    edgeless: EdgelessPageBlockComponent,
    type: string,
    options: Options,
    shapeStyle: ShapeStyle
  ) {
    super(edgeless);
    const xywh = [
      this.x,
      this.y,
      SHAPE_OVERLAY_WIDTH,
      SHAPE_OVERLAY_HEIGHT,
    ] as XYWH;
    this.shape = ShapeFactory.createShape(xywh, type, options, shapeStyle);
    this.disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(edgelessTool => {
        if (edgelessTool.type !== 'shape') return;
        const shapeType = edgelessTool.shape;
        const shapeStyle = edgelessTool.shapeStyle;
        const computedStyle = getComputedStyle(edgeless);
        const strokeColor = computedStyle.getPropertyValue(
          edgelessTool.strokeColor
        );
        const fillColor = computedStyle.getPropertyValue(
          edgelessTool.fillColor
        );
        const newOptions = {
          ...options,
          stroke: strokeColor,
          fill: fillColor,
        };

        let { x, y } = this;
        if (shapeType === 'roundedRect' || shapeType === 'rect') {
          x += SHAPE_OVERLAY_OFFSET_X;
          y += SHAPE_OVERLAY_OFFSET_Y;
        }
        const w =
          shapeType === 'roundedRect'
            ? SHAPE_OVERLAY_WIDTH + 40
            : SHAPE_OVERLAY_WIDTH;
        const xywh = [x, y, w, SHAPE_OVERLAY_HEIGHT] as XYWH;
        this.shape = ShapeFactory.createShape(
          xywh,
          shapeType,
          newOptions,
          shapeStyle
        );
        this.edgeless.surface.refresh();
      })
    );
  }

  override render(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    ctx.globalAlpha = this.globalAlpha;
    let { x, y } = this;
    const { type } = this.shape;
    if (type === 'roundedRect' || type === 'rect') {
      x += SHAPE_OVERLAY_OFFSET_X;
      y += SHAPE_OVERLAY_OFFSET_Y;
    }
    const w =
      type === 'roundedRect' ? SHAPE_OVERLAY_WIDTH + 40 : SHAPE_OVERLAY_WIDTH;
    const xywh = [x, y, w, SHAPE_OVERLAY_HEIGHT] as XYWH;
    this.shape.xywh = xywh;
    this.shape.draw(ctx, rc);
  }
}

export class NoteOverlay extends ToolOverlay {
  public text = '';
  public themeMode = 'light';

  private _getOverlayText(text: string): string {
    return text[0].toUpperCase() + text.slice(1);
  }

  constructor(edgeless: EdgelessPageBlockComponent) {
    super(edgeless);
    this.globalAlpha = 0;
    this.disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(edgelessTool => {
        // when change note child type, update overlay text
        if (edgelessTool.type !== 'note') return;
        this.text = this._getOverlayText(edgelessTool.tip);
        this.edgeless.surface.refresh();
      })
    );
  }

  override render(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = this.globalAlpha;
    const overlayX = this.x + NOTE_OVERLAY_OFFSET_X;
    const overlayY = this.y + NOTE_OVERLAY_OFFSET_Y;
    // Get real color from css variable
    const computedStyle = getComputedStyle(this.edgeless);
    ctx.strokeStyle = computedStyle.getPropertyValue(NOTE_OVERLAY_STOKE_COLOR);
    // Draw the overlay rectangle
    ctx.fillStyle =
      this.themeMode === 'light'
        ? NOTE_OVERLAY_LIGHT_BACKGROUND_COLOR
        : NOTE_OVERLAY_DARK_BACKGROUND_COLOR;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(overlayX + NOTE_OVERLAY_CORNER_RADIUS, overlayY);
    ctx.lineTo(
      overlayX + NOTE_OVERLAY_WIDTH - NOTE_OVERLAY_CORNER_RADIUS,
      overlayY
    );
    ctx.quadraticCurveTo(
      overlayX + NOTE_OVERLAY_WIDTH,
      overlayY,
      overlayX + NOTE_OVERLAY_WIDTH,
      overlayY + NOTE_OVERLAY_CORNER_RADIUS
    );
    ctx.lineTo(
      overlayX + NOTE_OVERLAY_WIDTH,
      overlayY + NOTE_OVERLAY_HEIGHT - NOTE_OVERLAY_CORNER_RADIUS
    );
    ctx.quadraticCurveTo(
      overlayX + NOTE_OVERLAY_WIDTH,
      overlayY + NOTE_OVERLAY_HEIGHT,
      overlayX + NOTE_OVERLAY_WIDTH - NOTE_OVERLAY_CORNER_RADIUS,
      overlayY + NOTE_OVERLAY_HEIGHT
    );
    ctx.lineTo(
      overlayX + NOTE_OVERLAY_CORNER_RADIUS,
      overlayY + NOTE_OVERLAY_HEIGHT
    );
    ctx.quadraticCurveTo(
      overlayX,
      overlayY + NOTE_OVERLAY_HEIGHT,
      overlayX,
      overlayY + NOTE_OVERLAY_HEIGHT - NOTE_OVERLAY_CORNER_RADIUS
    );
    ctx.lineTo(overlayX, overlayY + NOTE_OVERLAY_CORNER_RADIUS);
    ctx.quadraticCurveTo(
      overlayX,
      overlayY,
      overlayX + NOTE_OVERLAY_CORNER_RADIUS,
      overlayY
    );
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // Draw the overlay text
    ctx.fillStyle = computedStyle.getPropertyValue(NOTE_OVERLAY_TEXT_COLOR);
    let fontSize = 16;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // measure the width of the text
    // if the text is wider than the rectangle, reduce the maximum width of the text
    while (ctx.measureText(this.text).width > NOTE_OVERLAY_WIDTH - 20) {
      fontSize -= 1;
      ctx.font = `${fontSize}px Arial`;
    }

    ctx.fillText(this.text, overlayX + 10, overlayY + NOTE_OVERLAY_HEIGHT / 2);
  }
}
