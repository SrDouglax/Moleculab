import { Atom } from "..";
import { CanvasHelper } from "../../canvas/basic";
import { Vector2 } from "../../physics/vector";
import { World } from "../../world";
import { CovalentBond } from "./covalentBond";

export enum BondType {
  Covalent = "covalent",
  Ionic = "ionic",
  Metallic = "metallic",
}

class Bond {
  atom1: Atom;
  atom2: Atom;
  bondType: CovalentBond;

  constructor(atom1: Atom, atom2: Atom, bondType: CovalentBond = new CovalentBond(this)) {
    this.atom1 = atom1;
    this.atom2 = atom2;
    this.bondType = bondType;
  }

  static draw(ctx: CanvasRenderingContext2D, world: World, atom1: Atom, atom2: Atom, bondType: BondType): void {
    const relativePos1 = atom1.pos.multi(world.zoom);
    const relativePos2 = atom2.pos.multi(world.zoom);
    CanvasHelper.drawLine({
      ctx,
      lineWidth: 5 * world.zoom,
      start: new Vector2(relativePos1.x, relativePos1.y),
      end: new Vector2(relativePos2.x, relativePos2.y),
      strokeColor: bondType === BondType.Covalent ? "white" : bondType === BondType.Ionic ? "blue" : "red",
    });
  }

  static isBondValid(existingBonds: Bond[], newAtom1: Atom, newAtom2: Atom): boolean {
    for (const bond of existingBonds) {
      if ((bond.atom1 === newAtom1 && bond.atom2 === newAtom2) || (bond.atom1 === newAtom2 && bond.atom2 === newAtom1)) {
        return false;
      }
    }
    return true;
  }

  static isAtomInBond(bond: Bond, atom: Atom) {
    if (bond.atom1 === atom) {
      return bond.atom2;
    } else if (bond.atom2 === atom) {
      return bond.atom1;
    }
    return false;
  }

  isAtomsInBond(atom1: Atom, atom2: Atom) {
    return [this.atom1, this.atom2].includes(atom1) && [this.atom1, this.atom2].includes(atom2);
  }
}

export { Bond };
