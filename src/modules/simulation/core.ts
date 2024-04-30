import { Atom } from "../atom";
import { Bond, BondType } from "../atom/bond";
import { CovalentBond } from "../atom/bond/covalentBond";
import { Vector2 } from "../physics/vector";
import { World } from "../world";

interface AtomsAngle {
  atom1: Atom;
  atom2: Atom;
  atom3: Atom;
  angle: number;
}

export interface SettingsType {
  timeMode?: "constant" | "realtime";
  iterationsPerSecond?: number;
  calculateAngles?: boolean;
}

/**
 * Represents a simulation of atoms and bonds.
 *
 * The Simulation class manages the animation, interaction, and rendering of atoms and bonds on a canvas element.
 * It provides methods for creating and removing bonds between atoms, calculating angles between atoms, and drawing the simulation on the canvas.
 * The simulation can be interacted with using mouse and keyboard events.
 *
 * @constructor
 * @param {HTMLCanvasElement} canvas - The canvas element to render the simulation on.
 */
class Simulation {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private draggingId: string | null;
  private lastFrameTime: number;
  private mousePosition: { x: number; y: number };
  private pressedKeys: any[];
  private lastClickedItemId: string | null;
  private targetZoom: number;
  private bondedAtomPairs: Set<string>;
  private iterationDelay: number;

  private world: World;
  public atoms: Atom[];
  public bonds: Bond[];
  public angles: AtomsAngle[];

  public settings: SettingsType;

  constructor(canvas: HTMLCanvasElement, settings?: SettingsType) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d"); // Aqui pode ser nulo
    this.atoms = [];
    this.bonds = [];
    this.lastFrameTime = performance.now();
    this.mousePosition = { x: 0, y: 0 };
    this.pressedKeys = [];
    this.draggingId = null;
    this.lastClickedItemId = null;
    this.angles = [];
    this.world = new World(0, 0, 1);
    this.targetZoom = 1;
    this.bondedAtomPairs = new Set<string>();
    this.iterationDelay = 0;

    this.settings = settings || {};

    this.resizeCanvas();

    // Verifica se o contexto não é nulo antes de prosseguir
    if (!this.ctx) {
      console.error("Failed to get 2D rendering context for canvas.");
      return;
    }

    this.setupEventListeners();
    this.simulate(0);
  }

  /**
   * Calculates the angles between atoms in the simulation.
   *
   * This method iterates over all atoms in the simulation and their corresponding bonds to calculate the angles between them.
   * It checks if the atoms form a triangular bond and calculates the angle at the midpoint of the triangle.
   * The calculated angles are stored in the 'angles' array.
   *
   * @returns {void}
   */
  calculateAngles(): void {
    // Limpar ângulos antigos
    this.angles = [];

    // Iterar sobre todos os átomos
    for (const atom1 of this.atoms) {
      // Iterar sobre as ligações do átomo atual
      for (const bond of this.bonds) {
        let atom2: Atom;
        let atom3: Atom;

        // Verificar se o átomo1 é um dos átomos da ligação
        if (bond.atom1 === atom1) {
          atom2 = bond.atom2;
        } else if (bond.atom2 === atom1) {
          atom2 = bond.atom1;
        } else {
          continue; // Se o átomo1 não estiver ligado nesta ligação, passe para a próxima
        }

        // Iterar novamente sobre as ligações para encontrar o terceiro átomo
        for (const bond2 of this.bonds) {
          // Verificar se o átomo2 está em outra ligação
          if (bond2.atom1 === atom2 && bond2.atom2 !== atom1) {
            atom3 = bond2.atom2;
          } else if (bond2.atom2 === atom2 && bond2.atom1 !== atom1) {
            atom3 = bond2.atom1;
          } else {
            continue; // Se não houver terceiro átomo, passe para a próxima ligação
          }

          // Verificar se a sequência de três átomos forma uma ligação triangular
          if (this.isTriangle(atom1, atom2, atom3)) {
            const vector1 = atom1.pos.sub(atom2.pos);
            const vector2 = atom3.pos.sub(atom2.pos);
            // Calcular o ângulo no ponto do meio do triângulo
            const angle = Vector2.calculateAngleBetweenVectors(vector1, vector2);

            if (
              !this.angles.find(
                (e) =>
                  [atom1.id, atom2.id, atom3.id].includes(e.atom1.id) && [atom2.id].includes(e.atom2.id) && [atom1.id, atom2.id, atom3.id].includes(e.atom3.id)
              )
            ) {
              // Armazenar o valor calculado
              this.angles.push({ atom1, atom2, atom3, angle });
            }
          }
        }
      }
    }
  }

  /**
   * Checks if three atoms are connected in a triangle formation.
   *
   * @param atom1 - The first atom.
   * @param atom2 - The second atom.
   * @param atom3 - The third atom.
   * @returns True if the atoms are connected in a triangle formation, false otherwise.
   */
  isTriangle(atom1: Atom, atom2: Atom, atom3: Atom): boolean {
    // Verificar se os átomos estão todos conectados entre si
    return atom1.isBondedWith(this.bonds, atom2) && atom2.isBondedWith(this.bonds, atom3);
  }

  /**
   * Draws angles between atoms on the canvas.
   *
   * The angles are drawn as arcs with a specified color and line width.
   *
   * @returns {void}
   */
  drawAngles(): void {
    if (!this.ctx) return;

    this.ctx.strokeStyle = "red"; // Defina a cor dos ângulos
    this.ctx.lineWidth = 2; // Defina a largura da linha dos ângulos

    for (const { atom1, atom2, atom3, angle } of this.angles) {
      const midPointX = atom2.pos.x * this.world.zoom;
      const midPointY = atom2.pos.y * this.world.zoom;

      const radius = (atom2.getAnimatedSize() + 5) * this.world.zoom; // Raio do arco
      let startAngle = Math.atan2(atom1.pos.y * this.world.zoom - midPointY, atom1.pos.x * this.world.zoom - midPointX);
      let endAngle = Math.atan2(atom3.pos.y * this.world.zoom - midPointY, atom3.pos.x * this.world.zoom - midPointX);
      let arcSize = endAngle - startAngle;

      // Verificar se o tamanho do arco é negativo (ocorre quando o ângulo de término é menor que o ângulo de início)
      if (arcSize < 0) {
        arcSize += 2 * Math.PI; // Adiciona 360 graus (ou 2π radianos) para corrigir o valor negativo
      }

      // Se o tamanho do arco for maior que PI, desenhe o arco menor
      if (arcSize > Math.PI) {
        // Inverte os pontos de início e término para desenhar o menor arco
        [startAngle, endAngle] = [endAngle, startAngle];
      }

      // Desenha o arco
      this.ctx.beginPath();
      this.ctx.strokeStyle = `hsl(${(angle || 0) * 2}, 50%, 50%)`;
      this.ctx.arc(midPointX, midPointY, radius, startAngle, endAngle);
      this.ctx.stroke();

      // Calcular o ângulo de inclinação do arco
      const angleOfArc = startAngle + (endAngle - startAngle) / 2 + Math.PI;

      // Desenha o texto do primeiro ângulo
      let rotationAngle = angleOfArc;
      if (angleOfArc > Math.PI && angleOfArc < 2 * Math.PI) {
        rotationAngle -= Math.PI;
      }
      // this.drawAngleText(midPointX, midPointY, radius, angle.toFixed(2), angleOfArc);
    }
  }

  /**
   * Draws the angle text on the canvas.
   *
   * @param midPointX - The x-coordinate of the midpoint of the arc.
   * @param midPointY - The y-coordinate of the midpoint of the arc.
   * @param radius - The radius of the arc.
   * @param angleText - The text to be displayed as the angle.
   * @param rotationAngle - The rotation angle of the text.
   */
  drawAngleText(midPointX: number, midPointY: number, radius: number, angleText: string) {
    if (!this.ctx) return;
    this.ctx.save(); // Salva o estado atual do contexto
    this.ctx.translate(midPointX, midPointY); // Move para o ponto médio do arco
    // this.ctx.rotate(rotationAngle + Math.PI / 2); // Rotaciona o contexto de acordo com o ângulo de inclinação do arco

    // Desenhe o texto do ângulo
    const textX = 0; // Posição X do texto em relação ao ponto médio do arco
    let textY = 0; // Posição Y do texto em relação ao ponto médio do arco

    // Ajustar a posição do texto para ficar ao lado do arco
    // if (rotationAngle > Math.PI) {
    //   // this.ctx.textAlign = "right";
    //   textY = radius + 20; // Desloca o texto para cima
    // } else {
    //   // this.ctx.textAlign = "left";
    textY = -(radius + 20); // Desloca o texto para baixo
    // }

    this.ctx.fillStyle = "white";
    this.ctx.font = "12px Arial";
    this.ctx.fillText(`${angleText}°`, textX, textY);

    this.ctx.restore(); // Restaura o estado do contexto para antes da rotação
  }

  /**
   * Removes the event listeners from the canvas.
   */
  public destroy() {
    // Remove os event listeners do canvas
    window.removeEventListener("mousedown", this.handleMouseDown);
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("mouseup", this.handleMouseUp);
    window.removeEventListener("keydown", this.handleKeyPressed);
    window.removeEventListener("keyup", this.handleKeyReleased);
    window.removeEventListener("focus", this.handleWindowFocus);
  }

  /**
   * Resizes the canvas element to match the current window dimensions.
   */
  public resizeCanvas() {
    const canvasStyle = window.getComputedStyle(this.canvas);
    const canvasWidth = parseFloat(canvasStyle.width);
    const canvasHeight = parseFloat(canvasStyle.height);
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
    console.log(canvasWidth, canvasHeight);
  }

  /**
   * Handles the creation or removal of a bond between two atoms.
   *
   * @param atom1Id - The ID of the first atom.
   * @param atom2Id - The ID of the second atom.
   * @returns void
   */
  private handleBond(atom1Id: string | null, atom2Id: string | null) {
    if (atom1Id === atom2Id) return;

    const atom1 = this.atoms.find((e) => e.id === atom1Id);
    const atom2 = this.atoms.find((e) => e.id === atom2Id);

    if (!atom1 || !atom2) return;
    const existingBondIndex = this.bonds.findIndex(
      (bond) => (bond.atom1.id === atom1Id && bond.atom2.id === atom2Id) || (bond.atom1.id === atom2Id && bond.atom2.id === atom1Id)
    );
    if (existingBondIndex > -1) {
      this.bonds.splice(existingBondIndex, 1);
    } else {
      if (!Bond.isBondValid(this.bonds, atom1, atom2)) return;
      this.bonds = [...this.bonds, new Bond(atom1, atom2)];
    }
  }

  /**
   * Returns the ID of the molecule that the mouse is currently hovering over, or null if no molecule is being hovered.
   *
   * @param mouseX - The x-coordinate of the mouse position.
   * @param mouseY - The y-coordinate of the mouse position.
   * @returns The ID of the molecule being hovered, or null if no molecule is being hovered.
   */
  private getMouseOverMoleculeId(mouseX: number, mouseY: number): string | null {
    for (const atom of this.atoms) {
      const distance = Math.sqrt(Math.pow(mouseX - atom.pos.x, 2) + Math.pow(mouseY - atom.pos.y, 2));
      if (distance <= atom.size) {
        return atom.id;
      }
    }
    return null;
  }

  /**
   * Animates the simulation by updating the positions of the atoms and drawing them on the canvas.
   * This method is called recursively using requestAnimationFrame to create a smooth animation effect.
   *
   * @returns {void}
   */
  private simulate(currentTime: number): void {
    if (this.ctx) {
      const deltaTime =
        this.settings.timeMode === "realtime" ? (currentTime - this.lastFrameTime) / 1000 : (1 / 60) * (this.settings.iterationsPerSecond || 60);
      this.iterationDelay += deltaTime;

      // const atomsTable: Record<string, Atom> = this.atoms.reduce((acc: Record<string, Atom>, atom: Atom) => {
      //   acc[atom.id] = atom;
      //   return acc;
      // }, {});

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.save();

      this.calculatePhysics(deltaTime);

      const zoomSmooth = 0.1;
      this.world.zoom = this.world.zoom * (1 - zoomSmooth) + this.targetZoom * zoomSmooth;

      if (this.settings.calculateAngles) {
        this.calculateAngles();
        this.drawAngles();
      }
      [...this.bondedAtomPairs].forEach((e, i) => {
        this.ctx?.fillText(`${e}`, 10, 80 + 10 * i);
      });
      // [...this.bondedAtomPairs].forEach((bond) => {
      //   const atom1 = atomsTable[bond.split("_")[0]];
      //   const atom2 = atomsTable[bond.split("_")[1]];
      //   Bond.draw(this.ctx!, this.world, atom1, atom2, BondType["Covalent"]);
      // });
      this.atoms.forEach((atom) => {
        atom.draw(this.ctx!, this.world, this.lastClickedItemId === atom.id);
      });

      
      this.ctx.fillStyle = "#444";
      this.ctx.font = "bold 18px Arial";
      this.ctx.fillText(`'N' to create new atom`, 10, 30);
      
      this.ctx.fillStyle = "white";
      this.ctx.font = "12px Arial";
      this.ctx.fillText(`FPS: ${Math.round(1 / ((currentTime - this.lastFrameTime) / 1000))}`, 10, this.canvas.height - 10);

      // [...this.bondedAtomPairs].forEach((e, i) => {
      //   this.ctx?.fillText(`${e}`, 10, 80 + 10 * i);
      // });
      this.ctx.restore();
    }

    this.lastFrameTime = currentTime;
    requestAnimationFrame(this.simulate.bind(this));
  }

  private calculatePhysics(deltaTime: number) {
    // Apply movement logic
    this.atoms.forEach((atom) => {
      if (atom.id === this.draggingId) {
        atom.pos = new Vector2(this.mousePosition.x, this.mousePosition.y);
      } else {
        let totalForceX = 0;
        let totalForceY = 0;
        this.atoms.forEach((otherAtom) => {
          if (this.isBonded(atom, otherAtom)) {
            const bond = this.bonds.find((b) => b.isAtomsInBond(atom, otherAtom));
            if (bond?.bondType instanceof CovalentBond && this.ctx) {
              const bondForce = bond.bondType.calculateForce(atom, otherAtom);
              totalForceX -= bondForce.x;
              totalForceY -= bondForce.y;
              bond.bondType.draw(this.ctx);
            }
          }

          // Repulse
          // const forceMagnitude = 200 / otherAtom.pos.distanceTo(atom.pos);
          // const forceX = (otherAtom.pos.x - atom.pos.x) * forceMagnitude * (1 / (atom.pos.distanceTo(otherAtom.pos) / 10 ** 1 || 0.00000001));
          // const forceY = (otherAtom.pos.y - atom.pos.y) * forceMagnitude * (1 / (atom.pos.distanceTo(otherAtom.pos) / 10 ** 1 || 0.00000001));
          // totalForceX -= forceX;
          // totalForceY -= forceY;
          // }
          const distance = atom.pos.distanceTo(otherAtom.pos);
          if (distance < 400 && atom !== otherAtom && !this.isBonded(atom, otherAtom) && Bond.isBondValid(this.bonds, atom, otherAtom)) {
            const bond = new Bond(atom, otherAtom);
            this.bonds.push(bond);
            this.bondedAtomPairs.add(this.getBondKey(atom, otherAtom));
          } else if (distance > 400 && this.isBonded(atom, otherAtom)) {
            this.bonds = this.bonds.filter((bond) => !this.areAtomsEqual(bond.atom1, atom, bond.atom2, otherAtom));
            this.removeBondedPair(atom, otherAtom);
          }
        });
        atom.vel = new Vector2(totalForceX || 0, totalForceY || 0);
        atom.calcPosition(deltaTime);
        if (atom.pos.x < 0) {
          atom.pos.x = this.canvas.width / this.world.zoom / 2;
        } else if (atom.pos.x > this.canvas.width / this.world.zoom) {
          atom.pos.x = this.canvas.width / this.world.zoom / 2;
        } else if (atom.pos.y < 0) {
          atom.pos.y = this.canvas.height / this.world.zoom / 2;
        } else if (atom.pos.y > this.canvas.height / this.world.zoom) {
          atom.pos.y = this.canvas.height / this.world.zoom / 2;
        }
      }
    });
  }

  private getBondKey(atom1: Atom, atom2: Atom): string {
    return `${atom1.id}_${atom2.id}`;
  }

  private isBonded(atom1: Atom, atom2: Atom): boolean {
    const key1 = this.getBondKey(atom1, atom2);
    const key2 = this.getBondKey(atom2, atom1);
    return this.bondedAtomPairs.has(key1) || this.bondedAtomPairs.has(key2);
  }

  private areAtomsEqual(atom1: Atom, otherAtom1: Atom, atom2: Atom, otherAtom2: Atom): boolean {
    return (atom1 === otherAtom1 && atom2 === otherAtom2) || (atom1 === otherAtom2 && atom2 === otherAtom1);
  }

  private removeBondedPair(atom1: Atom, atom2: Atom): void {
    const key1 = this.getBondKey(atom1, atom2);
    const key2 = this.getBondKey(atom2, atom1);
    this.bondedAtomPairs.delete(key1);
    this.bondedAtomPairs.delete(key2);
  }

  // =========== Input Managers =========== \\
  private setupEventListeners() {
    window.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("mouseup", this.handleMouseUp);
    window.addEventListener("keydown", this.handleKeyPressed);
    window.addEventListener("keyup", this.handleKeyReleased);
    window.addEventListener("focus", this.handleWindowFocus);
    window.addEventListener("wheel", this.handleZoom);
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  private handleKeyPressed = (event: KeyboardEvent) => {
    if (!this.pressedKeys.includes(event.key)) {
      this.pressedKeys.push(event.key);
      if (event.key === "n") {
        this.atoms = [...this.atoms, Atom.generateRandomAtom(new Vector2(this.mousePosition.x, this.mousePosition.y))];
      }
      if (event.key === "d") {
        const molecule = this.getMouseOverMoleculeId(this.mousePosition.x, this.mousePosition.y);
        this.atoms = this.atoms.filter((e) => e.id !== molecule);
      }
      if (event.key === "r") {
        this.atoms = [];
        this.bonds = [];
        this.angles = [];
        this.draggingId = null;
      }
    }
  };

  private handleKeyReleased = (event: KeyboardEvent) => {
    this.pressedKeys = this.pressedKeys.filter((key) => key !== event.key);
  };

  private handleWindowFocus = () => {
    this.pressedKeys = [];
    this.draggingId = null;
  };

  private handleMouseDown = (event: MouseEvent) => {
    const moleculeId = this.getMouseOverMoleculeId(this.mousePosition.x, this.mousePosition.y);

    // If ctrl key is pressed when click in atom
    if (event.ctrlKey) {
      if (this.lastClickedItemId) {
        this.handleBond(this.lastClickedItemId, moleculeId);
      }
      this.lastClickedItemId = moleculeId;
      // If not just set dragging atom
    } else {
      this.lastClickedItemId = null;
      if (moleculeId) {
        this.draggingId = moleculeId;
      }
    }
  };

  private handleMouseMove = (event: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX / this.world.zoom - rect.left;
    const mouseY = event.clientY / this.world.zoom - rect.top;
    this.mousePosition = { x: mouseX, y: mouseY };
    const moleculeId = this.getMouseOverMoleculeId(mouseX, mouseY);
    if (moleculeId) {
      this.canvas.style.cursor = "pointer";
    } else if (!this.draggingId) {
      this.canvas.style.cursor = "default";
    }
  };

  private handleMouseUp = () => {
    this.draggingId = null;
  };

  private handleZoom = (event: WheelEvent) => {
    const zoomAmount = event.deltaY * -0.0005; // Adjust the sensitivity based on your needs
    this.targetZoom = Math.min(Math.max(this.targetZoom + zoomAmount, 0.1), 10);
  };
}

export default Simulation;
