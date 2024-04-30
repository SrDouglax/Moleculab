import { Vector2 } from "../physics/vector";

interface DrawCircleParams {
  ctx: CanvasRenderingContext2D | null;
  x?: number;
  y?: number;
  radius?: number;
  fillColor?: string;
}

interface DrawSquareParams {
  ctx: CanvasRenderingContext2D | null;
  x?: number;
  y?: number;
  sideLength?: number;
  fillColor?: string;
}

interface DrawRectangleParams {
  ctx: CanvasRenderingContext2D | null;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fillColor?: string;
}

interface DrawLineParams {
  ctx: CanvasRenderingContext2D | null;
  start?: Vector2;
  end?: Vector2;
  strokeColor?: string;
  lineWidth?: number;
}

interface ClearCanvasParams {
  ctx: CanvasRenderingContext2D | null;
  width?: number;
  height?: number;
}

export class CanvasHelper {
  static drawCircle({ ctx, x = 0, y = 0, radius = 30, fillColor = "blue" }: DrawCircleParams): void {
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.closePath();
  }

  static drawSquare({ ctx, x = 0, y = 0, sideLength = 50, fillColor = "black" }: DrawSquareParams): void {
    if (!ctx) return;
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, sideLength, sideLength);
  }

  static drawRectangle({ ctx, x = 0, y = 0, width = 100, height = 50, fillColor = "black" }: DrawRectangleParams): void {
    if (!ctx) return;
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width, height);
  }

  static drawLine({ ctx, start = new Vector2(0, 0), end = new Vector2(0, 0), strokeColor = "white", lineWidth = 5 }: DrawLineParams): void {
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.lineWidth = lineWidth; // Usa a largura da linha passada como parâmetro
    ctx.strokeStyle = strokeColor; // Usa a cor da linha passada como parâmetro
    ctx.stroke();
    ctx.closePath();
  }

  static clearCanvas({ ctx, width = 500, height = 400 }: ClearCanvasParams): void {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
  }
}
