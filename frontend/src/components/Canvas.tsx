import { useEffect, useRef, type MouseEvent, type TouchEvent } from "react";

export interface Point {
  x: number;
  y: number;
}

export interface StrokeData {
  points: Point[];
}

interface CanvasProps {
  strokes: StrokeData[];
  readOnly?: boolean;
  onStrokesChange?: (strokes: StrokeData[]) => void;
  onClear?: () => void;
}

export function Canvas({ strokes, readOnly = false, onStrokesChange, onClear }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentStroke = useRef<Point[]>([]);
  const isDrawing = useRef(false);

  function getPos(e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function drawAll(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, 800, 600);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const allStrokes = currentStroke.current.length > 0
      ? [...strokes, { points: [...currentStroke.current] }]
      : strokes;

    for (const stroke of allStrokes) {
      if (stroke.points.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawAll(ctx);
  });

  function handlePointerDown(e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) {
    if (readOnly) return;
    isDrawing.current = true;
    currentStroke.current = [getPos(e)];
  }

  function handlePointerMove(e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || readOnly) return;
    currentStroke.current.push(getPos(e));
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawAll(ctx);
  }

  function handlePointerUp() {
    if (!isDrawing.current || readOnly) return;
    isDrawing.current = false;
    if (currentStroke.current.length > 0 && onStrokesChange) {
      onStrokesChange([...strokes, { points: [...currentStroke.current] }]);
    }
    currentStroke.current = [];
  }

  function handleClear() {
    if (readOnly || !onClear) return;
    onClear();
  }

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          border: "1px solid #e5e7eb",
          display: "block",
          backgroundColor: "#ffffff",
          touchAction: readOnly ? "auto" : "none",
          cursor: readOnly ? "default" : "crosshair"
        }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />
      {!readOnly && (
        <button
          className="button button--secondary"
          style={{ marginTop: "8px" }}
          onClick={handleClear}
          type="button"
        >
          Clear Canvas
        </button>
      )}
    </div>
  );
}
