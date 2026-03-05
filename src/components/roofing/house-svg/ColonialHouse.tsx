import { darkenHex, lightenHex } from "./utils";

interface Props {
  roofColor: string;
  materialType: "shingles" | "metal";
}

export const ColonialHouse = ({ roofColor, materialType }: Props) => {
  const roofDark = darkenHex(roofColor, 0.7);
  const wallFront = "#f5f0e8";
  const wallSide = "#e0d8cc";

  return (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <defs>
        <filter id="shadow-col" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#00000030" />
        </filter>
        <linearGradient id="sky-col" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a8d8ea" />
          <stop offset="100%" stopColor="#d4eef7" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="400" height="300" fill="url(#sky-col)" />
      <rect x="0" y="255" width="400" height="45" fill="#7cb342" opacity="0.3" />

      <g filter="url(#shadow-col)">
        {/* Front wall - tall two-story */}
        <polygon points="70,130 270,130 270,255 70,255" fill={wallFront} stroke="#5a5045" strokeWidth="1.5" />

        {/* Side wall */}
        <polygon points="270,130 360,150 360,260 270,255" fill={wallSide} stroke="#5a5045" strokeWidth="1.5" />

        {/* Roof front face */}
        <polygon points="55,130 270,130 270,75 170,50" fill={roofColor} stroke="#4a4038" strokeWidth="1.5" />

        {/* Roof side face */}
        <polygon points="270,130 370,150 370,100 270,75" fill={roofDark} stroke="#4a4038" strokeWidth="1.5" />

        {/* Ridge */}
        <line x1="170" y1="50" x2="300" y2="72" stroke="#3a3530" strokeWidth="2" />

        {/* Chimney */}
        <rect x="110" y="42" width="22" height="40" fill="#8b7355" stroke="#5a4d40" strokeWidth="1" />
        <rect x="107" y="40" width="28" height="5" fill="#7a6545" />

        {/* Shingle texture */}
        {materialType === "shingles" && (
          <>
            {[85, 95, 105, 115].map((y, i) => (
              <line key={`sh-${i}`} x1={70 + i * 5} y1={y} x2={268} y2={y} stroke="#00000012" strokeWidth="1" />
            ))}
          </>
        )}

        {/* Metal texture */}
        {materialType === "metal" && (
          <>
            {[120, 160, 200, 240].map((x, i) => (
              <line key={`ml-${i}`} x1={x} y1={130} x2={x * 0.7 + 50} y2={55 + i * 3} stroke="#ffffff25" strokeWidth="2" />
            ))}
          </>
        )}

        {/* Floor divider */}
        <line x1="70" y1="190" x2="270" y2="190" stroke="#c8beb0" strokeWidth="1.5" />

        {/* Second floor windows (symmetrical) */}
        {[100, 155, 210].map(x => (
          <g key={`w2-${x}`}>
            <rect x={x - 4} y="145" width="4" height="30" fill="#2a4a2a" />
            <rect x={x + 25} y="145" width="4" height="30" fill="#2a4a2a" />
            <rect x={x} y="145" width="25" height="30" fill="#a8d8ea" stroke="#5a5045" strokeWidth="1" />
            <line x1={x + 12.5} y1="145" x2={x + 12.5} y2="175" stroke="#5a5045" strokeWidth="0.7" />
            <line x1={x} y1="160" x2={x + 25} y2="160" stroke="#5a5045" strokeWidth="0.7" />
          </g>
        ))}

        {/* First floor windows */}
        {[95, 210].map(x => (
          <g key={`w1-${x}`}>
            <rect x={x - 4} y="200" width="4" height="35" fill="#2a4a2a" />
            <rect x={x + 30} y="200" width="4" height="35" fill="#2a4a2a" />
            <rect x={x} y="200" width="30" height="35" fill="#a8d8ea" stroke="#5a5045" strokeWidth="1" />
            <line x1={x + 15} y1="200" x2={x + 15} y2="235" stroke="#5a5045" strokeWidth="0.7" />
            <line x1={x} y1="218" x2={x + 30} y2="218" stroke="#5a5045" strokeWidth="0.7" />
          </g>
        ))}

        {/* Front door with pediment */}
        <polygon points="150,196 180,196 175,190 155,190" fill={wallFront} stroke="#5a5045" strokeWidth="1" />
        <rect x="155" y="205" width="30" height="50" rx="1" fill="#5c4033" stroke="#3a2a20" strokeWidth="1.5" />
        <rect x="155" y="196" width="30" height="10" fill="#5c4033" stroke="#3a2a20" strokeWidth="0.8" />
        <circle cx="179" cy="232" r="2.5" fill="#c9a959" />

        {/* Side window */}
        <rect x="300" y="170" width="20" height="18" fill="#a8d8ea" stroke="#5a5045" strokeWidth="1" />
        <rect x="300" y="210" width="20" height="18" fill="#a8d8ea" stroke="#5a5045" strokeWidth="1" />
      </g>

      {/* Bushes */}
      <ellipse cx="90" cy="256" rx="20" ry="9" fill="#4a8a3a" opacity="0.6" />
      <ellipse cx="250" cy="256" rx="16" ry="8" fill="#4a8a3a" opacity="0.5" />

      {/* Walkway */}
      <polygon points="155,255 185,255 195,285 145,285" fill="#c8beb0" opacity="0.5" />
    </svg>
  );
};
