import "@/styles/particle.css";

export function OverlayParticle() {
  return (
    <div className="particle transition-all duration-300 starting:opacity-0">
      <div className="overlay _1" />
      <div className="overlay _2" />
      <div className="overlay _3" />
      <div className="overlay _4" />
    </div>
  );
}
