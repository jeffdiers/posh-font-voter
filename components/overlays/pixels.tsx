import "@/styles/pixel.css";

import React, { useEffect } from "react";

export function PixelGridOverlay() {
  useEffect(() => {
    const grid = document.getElementById("pixelGrid");
    const cols = Math.floor(window.innerWidth / 40);
    const rows = Math.floor(window.innerHeight / 40);
    const total = cols * rows;

    for (let i = 0; i < total; i++) {
      const pixel = document.createElement("div");
      pixel.classList.add("pixel");
      pixel.style.animationDelay = `${Math.random() * 2}s`;
      pixel.style.background = `rgba(255, 255, 255, ${Math.random() * 0.15})`;
      grid?.appendChild(pixel);
    }
  }, []);

  return (
    <div className="pixels transition-all duration-300 starting:opacity-0">
      <div className="overlay" />
      <div id="pixelGrid" className="pixel-grid" />
    </div>
  );
}
