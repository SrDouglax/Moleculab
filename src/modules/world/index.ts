export class World {
  position: { x: number; y: number };
  zoom: number;

  constructor(x: number, y: number, zoom: number) {
    this.position = { x: x, y: y };
    this.zoom = zoom;
  }

  setPosition(x: number, y: number) {
    this.position.x = x;
    this.position.y = y;
  }

  setZoom(zoom: number) {
    this.zoom = zoom;
  }
}
