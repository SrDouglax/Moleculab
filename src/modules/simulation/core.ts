import { Atom } from "../atom";
import { Bond } from "../atom/bond";
import { Vector2 } from "../physics/vector";

interface AtomsAngle {
  atom1: Atom;
  atom2: Atom;
  atom3: Atom;
  angle: number;
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

  public atoms: Atom[];
  public bonds: Bond[];
  public angles: AtomsAngle[];

  constructor(canvas: HTMLCanvasElement) {
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

    this.resizeCanvas();

    // Verifica se o contexto não é nulo antes de prosseguir
    if (!this.ctx) {
      console.error("Failed to get 2D rendering context for canvas.");
      return;
    }

    this.setupEventListeners();
    this.animate();
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
    const areConnected = atom1.isBondedWith(this.bonds, atom2) && atom2.isBondedWith(this.bonds, atom3);

    return areConnected;
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
      const midPointX = atom2.pos.x;
      const midPointY = atom2.pos.y;

      const radius = atom2.getAnimatedSize() + 5; // Raio do arco
      let startAngle = Math.atan2(atom1.pos.y - midPointY, atom1.pos.x - midPointX);
      let endAngle = Math.atan2(atom3.pos.y - midPointY, atom3.pos.x - midPointX);
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
  drawAngleText(midPointX: number, midPointY: number, radius: number, angleText: string, rotationAngle: number) {
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
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
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
    console.log(existingBondIndex);
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
  private animate(): void {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    // Aplica a lógica de movimento
    this.atoms.forEach((atom) => {
      if (atom.id === this.draggingId) {
        atom.vel = new Vector2(this.mousePosition.x - atom.pos.x, this.mousePosition.y - atom.pos.y);
      }
      atom.calcPosition(deltaTime);
    });

    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.calculateAngles();
      this.drawAngles();
      this.bonds.forEach((bond) => {
        bond.draw(this.ctx!);
      });
      this.atoms.forEach((atom) => {
        atom.draw(this.ctx!, this.lastClickedItemId === atom.id);
      });
    }

    requestAnimationFrame(this.animate.bind(this));
  }

  // =========== Input Managers =========== \\
  private setupEventListeners() {
    window.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("mouseup", this.handleMouseUp);
    window.addEventListener("keydown", this.handleKeyPressed);
    window.addEventListener("keyup", this.handleKeyReleased);
    window.addEventListener("focus", this.handleWindowFocus);
  }

  private handleKeyPressed = (event: KeyboardEvent) => {
    if (!this.pressedKeys.includes(event.key)) {
      this.pressedKeys.push(event.key);
      console.log(this.angles);
      if (event.key === "n") {
        this.atoms = [...this.atoms, Atom.generateRandomAtom(new Vector2(this.mousePosition.x, this.mousePosition.y))];
      }
      if (event.key === "d") {
        const molecule = this.getMouseOverMoleculeId(this.mousePosition.x, this.mousePosition.y);
        this.atoms = this.atoms.filter((e) => e.id !== molecule);
      }
    }
  };

  private handleKeyReleased = (event: KeyboardEvent) => {
    this.pressedKeys = this.pressedKeys.filter((key) => key !== event.key);
  };

  private handleWindowFocus = (event: FocusEvent) => {
    this.pressedKeys = [];
    this.draggingId = null;
  };

  private handleMouseDown = (event: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const moleculeId = this.getMouseOverMoleculeId(mouseX, mouseY);

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

    console.log(this.bonds);
  };

  private handleMouseMove = (event: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
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
}

export default Simulation;
