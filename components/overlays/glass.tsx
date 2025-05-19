import "@/styles/glass.css";

export function OverlayGlass() {
  return (
    <div className="glass transition-all duration-300 starting:opacity-0">
      <div className="overlay _1" />
      <div className="overlay _2" />
      <div className="overlay _3" />
    </div>
  );
}
