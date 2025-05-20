import "@/styles/waves.css";

export function WavesOverlay() {
  return (
    <div className="waves_container">
      <div className="waves_bg"></div>
      <div className="waves_glitch-layer red"></div>
      <div className="waves_glitch-layer blue"></div>

      <svg className="waves_svg">
        <filter id="fractalDistortion">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008"
            numOctaves="2"
            result="turb"
          >
            <animate
              attributeName="baseFrequency"
              values="0.008;0.015;0.012;0.01;0.008"
              dur="12s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="turb"
            scale="30"
            xChannelSelector="R"
            yChannelSelector="G"
          >
            <animate
              attributeName="scale"
              values="30;50;40;35;30"
              dur="12s"
              repeatCount="indefinite"
            />
          </feDisplacementMap>
        </filter>
      </svg>
    </div>
  );
}
