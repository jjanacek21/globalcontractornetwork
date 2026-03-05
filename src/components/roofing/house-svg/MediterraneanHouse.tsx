import { darkenHex } from "./utils";

interface Props {
  roofColor: string;
  materialType: "shingles" | "metal";
}

export const MediterraneanHouse = ({ roofColor, materialType }: Props) => {
  const roofDark = darkenHex(roofColor, 0.7);
  const wallFront = "#f0e6d3";
  const wallSide = "#ddd0bc";

  return (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <defs>
        <filter id="shadow-med" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#00000030" />
        </filter>
        <linearGradient id="sky-med" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#87CEEB" />
          <stop offset="100%" stopColor="#c4e4f2" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="400" height="300" fill="url(#sky-med)" />
      <rect x="0" y="258" width="400" height="42" fill="#7cb342" opacity="0.3" />

      <g filter="url(#shadow-med)">
        {/* Main front wall - stucco texture via subtle pattern */}
        <polygon points="60,140 250,140 250,258 60,258" fill={wallFront} stroke="#8a7a60" strokeWidth="1.5" />

        {/* Side wall */}
        <polygon points="250,140 350,158 350,260 250,258" fill={wallSide} stroke="#8a7a60" strokeWidth="1.5" />

        {/* Hip roof - front face */}
        <polygon points="45,140 250,140 200,95 100,95" fill={roofColor} stroke="#5a4d40" strokeWidth="1.5" />

        {/* Hip roof - side face */}
        <polygon points="250,140 360,158 310,115 200,95" fill={roofDark} stroke="#5a4d40" strokeWidth="1.5" />

        {/* Hip roof - top */}
        <polygon points="100,95 200,95 310,115 200,85" fill={darkenHex(roofColor, 0.85)} stroke="#5a4d40" strokeWidth="1" />

        {/* Barrel tile texture (wavy lines) */}
        {materialType === "shingles" && (
          <>
            {[108, 118, 128].map((y, i) => (
              <path key={`tile-${i}`} d={`M${65 + i * 5},${y} Q${120},${y - 3} ${180},${y} Q${220},${y + 2} ${248},${y}`} fill="none" stroke="#00000015" strokeWidth="1.5" />
            ))}
          </>
        )}

        {materialType === "metal" && (
          <>
            {[120, 160, 200].map((x, i) => (
              <line key={`ml-${i}`} x1={x} y1={140} x2={x * 0.8 + 20} y2={98 + i * 2} stroke="#ffffff25" strokeWidth="2" />
            ))}
          </>
        )}

        {/* Arched windows */}
        {[95, 195].map(x => (
          <g key={`aw-${x}`}>
            <path d={`M${x},220 L${x},200 Q${x + 15},185 ${x + 30},200 L${x + 30},220 Z`} fill="#a8d8ea" stroke="#8a7a60" strokeWidth="1" />
            <line x1={x + 15} y1="188" x2={x + 15} y2="220" stroke="#8a7a60" strokeWidth="0.7" />
          </g>
        ))}

        {/* Arched front door */}
        <path d="M140,258 L140,205 Q155,188 170,205 L170,258 Z" fill="#6b4226" stroke="#4a2e18" strokeWidth="1.5" />
        <circle cx="163" cy="235" r="2.5" fill="#c9a959" />

        {/* Terracotta accent band */}
        <rect x="60" y="138" width="190" height="4" fill="#b8734a" opacity="0.6" />

        {/* Side arched window */}
        <path d="M290,200 L290,185 Q300,175 310,185 L310,200 Z" fill="#a8d8ea" stroke="#8a7a60" strokeWidth="1" />

        {/* Balcony railing */}
        <rect x="85" y="174" width="50" height="3" fill="#6b5a48" />
        {[92, 102, 112, 122, 128].map(x => (
          <line key={`rail-${x}`} x1={x} y1="174" x2={x} y2="140" stroke="#6b5a48" strokeWidth="1.5" />
        ))}
      </g>

      {/* Palm tree */}
      <rect x="35" y="210" width="6" height="50" fill="#8b7355" rx="2" />
      <ellipse cx="38" cy="208" rx="22" ry="12" fill="#4a8a3a" opacity="0.7" />
      <ellipse cx="30" cy="202" rx="15" ry="8" fill="#5a9a4a" opacity="0.6" />

      {/* Bush */}
      <ellipse cx="240" cy="258" rx="15" ry="7" fill="#4a8a3a" opacity="0.6" />
    </svg>
  );
};
