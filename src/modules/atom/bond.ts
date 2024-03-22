import { Atom } from ".";

enum BondType {
  Covalent = "covalent",
  Ionic = "ionic",
  Metallic = "metallic",
}

class Bond {
  atom1: Atom;
  atom2: Atom;
  bondType: BondType;

  constructor(atom1: Atom, atom2: Atom, bondType: BondType = BondType["Covalent"]) {
    this.atom1 = atom1;
    this.atom2 = atom2;
    this.bondType = bondType;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.moveTo(this.atom1.pos.x, this.atom1.pos.y);
    ctx.lineTo(this.atom2.pos.x, this.atom2.pos.y);
    ctx.lineWidth = 5;
    ctx.strokeStyle = this.bondType === BondType.Covalent ? "white" : this.bondType === BondType.Ionic ? "blue" : "red";
    ctx.stroke();
  }

  static isBondValid(existingBonds: Bond[], newAtom1: Atom, newAtom2: Atom): boolean {
    for (const bond of existingBonds) {
      if ((bond.atom1 === newAtom1 && bond.atom2 === newAtom2) || (bond.atom1 === newAtom2 && bond.atom2 === newAtom1)) {
        return false;
      }
    }
    return true;
  }
}

export { Bond };
