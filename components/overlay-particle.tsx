import "@/styles/particle.css";

export function OverlayParticle() {
  return (
    <div className="flyer-hero transition-all duration-300 starting:opacity-0">
      <div className="overlay noise" />
      <div className="overlay gradient" />
      <div className="overlay scanlines" />
      <div className="el" />
    </div>
  );
}
