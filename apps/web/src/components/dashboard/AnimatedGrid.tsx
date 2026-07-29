"use client";

import React, { useEffect, useRef } from "react";

interface AnimatedGridProps {
  gridSize?: number;
  squareSize?: number;
  color?: string;
  className?: string;
}

export function AnimatedGrid({
  gridSize = 40,
  squareSize = 4,
  color = "rgba(255, 255, 255, 0.15)",
  className = "",
}: AnimatedGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    
    // Store opacity for each cell to animate smoothly
    const cells: { targetOpacity: number; currentOpacity: number }[][] = [];

    const resize = () => {
      if (!canvas.parentElement) return;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width;
      canvas.height = height;
      
      cols = Math.floor(width / gridSize) + 1;
      rows = Math.floor(height / gridSize) + 1;
      
      cells.length = 0;
      for (let i = 0; i < cols; i++) {
        cells[i] = [];
        for (let j = 0; j < rows; j++) {
          cells[i][j] = { targetOpacity: 0, currentOpacity: 0 };
        }
      }
    };

    window.addEventListener("resize", resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Update randomly 2 cells per frame
      for (let i = 0; i < 2; i++) {
        const randCol = Math.floor(Math.random() * cols);
        const randRow = Math.floor(Math.random() * rows);
        if (cells[randCol] && cells[randCol][randRow]) {
           cells[randCol][randRow].targetOpacity = Math.random() > 0.8 ? Math.random() * 0.5 : 0;
        }
      }

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const cell = cells[i][j];
          // Ease towards target opacity
          cell.currentOpacity += (cell.targetOpacity - cell.currentOpacity) * 0.05;
          
          if (cell.currentOpacity > 0.01) {
             ctx.fillStyle = color.replace(/[\d.]+\)$/g, `${cell.currentOpacity})`);
             // Draw a small dot or square at the intersection
             ctx.fillRect(
               i * gridSize - squareSize / 2, 
               j * gridSize - squareSize / 2, 
               squareSize, 
               squareSize
             );
          }
        }
      }
      
      // Draw the faint grid lines
      ctx.strokeStyle = color.replace(/[\d.]+\)$/g, "0.03)");
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < cols; i++) {
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, height);
      }
      for (let j = 0; j < rows; j++) {
        ctx.moveTo(0, j * gridSize);
        ctx.lineTo(width, j * gridSize);
      }
      ctx.stroke();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gridSize, squareSize, color]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
    />
  );
}
