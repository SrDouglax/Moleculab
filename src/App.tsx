import React, { useRef, useEffect, useState } from "react";
import Simulation from "./modules/simulation/core"; // Supondo que o arquivo com a classe Simulation esteja localizado no mesmo diretório

const App: React.FC = () => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  let simulation: Simulation | null = null;

  if (canvas) {
    simulation = new Simulation(canvas);
  }
  useEffect(() => {
    simulation?.resizeCanvas();
    setCanvas(canvasRef.current);
  }, [canvasRef.current]);

  return (
    <div className="relative bg-black">
      <canvas ref={canvasRef} className="w-full h-full canvas"></canvas>
    </div>
  );
};

export default App;
