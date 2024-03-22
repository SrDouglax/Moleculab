export class Vector2 {
  x: number = 0;
  y: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  sum(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  sub(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  multi(value: number): Vector2 {
    return new Vector2(this.x * value, this.y * value);
  }

  div(value: number): Vector2 {
    return new Vector2(this.x / value, this.y / value);
  }

  dot(other: Vector2): number {
    return this.x * other.x + this.y * other.y;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  selfInterpolate(target: Vector2, factor: number): Vector2 {
    this.x = this.x + (target.x - this.x) * factor;
    this.y = this.y + (target.y - this.y) * factor;

    return new Vector2(this.x, this.y);
  }

  static calculateAngleBetweenVectors(vector1: Vector2, vector2: Vector2): number {
    const dotProduct = vector1.dot(vector2);
    const magnitude1 = vector1.length();
    const magnitude2 = vector2.length();

    const cosTheta = dotProduct / (magnitude1 * magnitude2);

    // Ensure cosTheta is within [-1, 1] to avoid NaN errors
    const clampedCosTheta = Math.max(-1, Math.min(1, cosTheta));

    // Calculate the angle in radians
    const angleInRadians = Math.acos(clampedCosTheta);

    // Convert radians to degrees
    const angleInDegrees = angleInRadians * (180 / Math.PI);

    return angleInDegrees;
  }
}
