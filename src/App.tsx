import React, { useRef, useState, useEffect } from "react";
import Simulation, { SettingsType } from "./modules/simulation/core";

const defaultSettings: SettingsType = {
  timeMode: "realtime",
  iterationsPerSecond: 1,
};

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);
  const simulationRef = useRef<Simulation | null>(null);

  useEffect(() => {
    setCanvas(canvasRef.current);
  }, []);

  useEffect(() => {
    if (canvas) {
      simulationRef.current = new Simulation(canvas, defaultSettings);
    }
  }, [canvas]);

  useEffect(() => {
    if (simulationRef.current !== null) {
      simulationRef.current.settings = settings;
    }
    console.log(simulationRef.current, settings);
  }, [settings]);

  const handleTimeModeChange = (mode: "realtime" | "constant") => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      timeMode: mode,
    }));
  };

  const handleIterationsPerSecondChange = (value: number) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      iterationsPerSecond: value,
    }));
  };

  return (
    <div className="grid grid-cols-[1fr_16rem] w-full h-full text-white bg-black">
      <div className="h-full">
        <canvas ref={canvasRef} className="w-full h-full"></canvas>
      </div>
      <div className="h-full px-4 py-2 overflow-auto min-w-12 bg-zinc-900">
        <p className="text-2xl font-bold">Configurações</p>
        <div className="mt-4">
          <p className="mb-2 text-xl font-bold">Modo temporal:</p>
          <div className="flex gap-2">
            <div
              className={`w-full px-2 py-1 font-semibold select-none cursor-pointer text-center border rounded-md ${
                settings.timeMode === "realtime" ? "" : "opacity-50"
              }`}
              onClick={() => handleTimeModeChange("realtime")}>
              Realtime
            </div>
            <div
              className={`w-full px-2 py-1 font-semibold select-none cursor-pointer text-center border rounded-md ${
                settings.timeMode === "constant" ? "" : "opacity-50"
              }`}
              onClick={() => handleTimeModeChange("constant")}>
              Constant
            </div>
          </div>
          {settings.timeMode === "constant" && (
            <div className="">
              <p className="">Iterações por segundo: {settings.iterationsPerSecond?.toFixed(2)}</p>
              <div className="flex gap-1">
                <div
                  className="flex-shrink-0 w-8 h-8 font-semibold text-center border rounded-md cursor-pointer select-none"
                  onClick={() => handleIterationsPerSecondChange(Math.max((settings.iterationsPerSecond || 60) - 0.1, 0.5))}>
                  -
                </div>
                <input
                  type="range"
                  className="w-full"
                  min={0.5}
                  step={0.1}
                  max={240}
                  value={settings.iterationsPerSecond}
                  onChange={(e) => handleIterationsPerSecondChange(parseFloat(e.currentTarget.value))}
                />
                <div
                  className="flex-shrink-0 w-8 h-8 font-semibold text-center border rounded-md cursor-pointer select-none"
                  onClick={() => handleIterationsPerSecondChange(Math.min((settings.iterationsPerSecond || 60) + 0.1, 240))}>
                  +
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col mt-4">
          <p className="text-xl font-bold">Ângulos:</p>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.calculateAngles}
              onChange={() =>
                setSettings((prev) => {
                  const data = { ...prev };
                  data.calculateAngles = !prev.calculateAngles;
                  return data;
                })
              }
            />
            <p className="">Calcular e desenhar</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
