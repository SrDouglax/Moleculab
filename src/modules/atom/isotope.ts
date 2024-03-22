export class Isotope {
  massNumber: number; // Número de massa do isótopo
  abundance: number; // Abundância relativa do isótopo
  protons: number; // Número de prótons
  neutrons: number; // Número de nêutrons
  electrons: number; // Número de elétrons

  constructor(massNumber: number, abundance: number, protons: number, neutrons: number, electrons: number) {
    this.massNumber = massNumber;
    this.abundance = abundance;
    this.protons = protons;
    this.neutrons = neutrons;
    this.electrons = electrons;
  }
}
