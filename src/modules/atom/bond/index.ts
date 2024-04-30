import { Atom } from "..";
import { CovalentBond } from "./covalentBond";

class Bond {
  atom1: Atom;
  atom2: Atom;
  bondType: CovalentBond;

  constructor(atom1: Atom, atom2: Atom, bondType: CovalentBond = new CovalentBond()) {
    this.atom1 = atom1;
    this.atom2 = atom2;
    this.bondType = bondType;
    this.bondType.bond = this
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
