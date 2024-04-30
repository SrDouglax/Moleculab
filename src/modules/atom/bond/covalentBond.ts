import { Bond } from ".";
import { Atom } from "..";
import { CanvasHelper } from "../../canvas/basic";
import { Vector2 } from "../../physics/vector";

export class CovalentBond {
  bond: Bond;
  constructor(bond: Bond) {
    this.bond = bond;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    CanvasHelper.drawLine({
      ctx,
      start: new Vector2(this.bond.atom1.pos.x, this.bond.atom1.pos.y),
      end: new Vector2(this.bond.atom2.pos.x, this.bond.atom2.pos.y),
      strokeColor: "white",
    });
  }

  calculateForce(atom1: Atom, atom2: Atom): Vector2 {
    const springConstant = 0.1; // Constante de mola (ajuste para a força da ligação)
    const idealBondLength = 100; // Comprimento ideal da ligação
    const displacement = atom1.pos.distanceTo(atom2.pos) - idealBondLength;
    const forceMagnitude = -springConstant * displacement;
    const direction = atom2.pos.sub(atom1.pos).normalize();
    return direction.multi(forceMagnitude);
  }
}
