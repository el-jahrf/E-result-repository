"use client";

import { useRef, useState } from "react";

export default function SignaturePad({
  name,
  initialValue,
}: {
  name: string;
  initialValue?: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signature, setSignature] = useState(initialValue ?? "");
  const [drawing, setDrawing] = useState(false);
  const [empty, setEmpty] = useState(!initialValue);

  function getPosition(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.setPointerCapture(event.pointerId);

    const position = getPosition(event);
    context.beginPath();
    context.moveTo(position.x, position.y);
    context.lineWidth = 3;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#4A2C20";

    setDrawing(true);
    setEmpty(false);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing) return;

    const canvas = canvasRef.current!;
    const context = canvas.getContext("2d");
    if (!context) return;

    const position = getPosition(event);
    context.lineTo(position.x, position.y);
    context.stroke();
  }

  function stopDrawing() {
    if (!drawing) return;

    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL("image/png"));
    }

    setDrawing(false);
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    setSignature("");
    setEmpty(true);
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl border-2 border-dashed border-[#C8A878] bg-white">
        <canvas
          ref={canvasRef}
          width={700}
          height={200}
          className="h-40 w-full touch-none cursor-crosshair"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onPointerLeave={stopDrawing}
        />
      </div>

      <input type="hidden" name={name} value={signature} />

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Sign above using your mouse, finger or stylus.
        </span>

        <button
          type="button"
          onClick={clearSignature}
          className="text-sm font-semibold text-red-600 hover:text-red-800"
        >
          Clear signature
        </button>
      </div>

      {empty && (
        <p className="mt-2 text-xs text-amber-700">
          A signature is required before saving.
        </p>
      )}
    </div>
  );
}