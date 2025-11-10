"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

type Point = { x: number; y: number };

interface DrawingCanvasProps {
  onDrawEnd: (points: Point[]) => void;
  onClear: () => void;
  width: number;
  height: number;
}

export function DrawingCanvas({ onDrawEnd, onClear, width, height }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);

  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    return canvas?.getContext('2d');
  };

  const clearCanvas = () => {
    const ctx = getCanvasContext();
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      setPoints([]);
      onClear();
    }
  };

  useEffect(() => {
    const ctx = getCanvasContext();
    if (ctx) {
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'hsl(var(--foreground))';
    }
  }, [width, height]);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in event.nativeEvent) {
      return {
        x: event.nativeEvent.touches[0].clientX - rect.left,
        y: event.nativeEvent.touches[0].clientY - rect.top,
      };
    }
    return {
      x: event.nativeEvent.offsetX,
      y: event.nativeEvent.offsetY,
    };
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(event);
    if (coords) {
      setIsDrawing(true);
      setPoints([coords]);
      const ctx = getCanvasContext();
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
      }
    }
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const coords = getCoordinates(event);
    if (coords) {
      setPoints(prevPoints => [...prevPoints, coords]);
      const ctx = getCanvasContext();
      if (ctx) {
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const ctx = getCanvasContext();
      if (ctx) {
        ctx.closePath();
      }
      if (points.length > 1) {
        onDrawEnd(points);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg border bg-background touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        aria-label="Drawing canvas"
      />
      <Button variant="outline" size="sm" onClick={clearCanvas}>
        <Eraser className="mr-2" />
        Clear Drawing
      </Button>
    </div>
  );
}
