import { darkenHex } from "./utils";

interface Props {
  roofColor: string;
  materialType: "shingles" | "metal";
}

export const ModernHouse = ({ roofColor, materialType }: Props) => {
  const roofDark = darkenHex(roofColor, 0.75);
  const wallFront = "#e5e5e5";
  const wallSide = "#cccccc";
  const wallAccent = "#d0d0d0";

  return (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <defs>
        <filter id="shadow-mod" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#00000030" />
        </filter>
        <linearGradient id="sky-mod" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b0c4de" />
          <stop offset="100%" stopColor="#dce8f0" />
        </linearGradient>
        <linearGradient id="glass-mod" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#87CEEB" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#5fa8c8" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="400" height="300" fill="url(#sky-mod)" />
      <rect x="0" y="258" width="400" height="42" fill="#888" opacity="0.15" />

      <g filter="url(#shadow-mod)">
        {/* Main block - front */}
        <polygon points="50,140 260,140 260,258 50,258" fill={wallFront} stroke="#8a8a8a" strokeWidth="1.5" />

        {/* Main block - side */}
        <polygon points="260,140 355,158 355,260 260,258" fill={wallSide} stroke="#8a8a8a" strokeWidth="1.5" />

        {/* Upper block (setback) - front */}
        <polygon points="80,100 220,100 220,140 80,140" fill={wallAccent} stroke="#8a8a8a" strokeWidth="1" />

        {/* Upper block - side */}
        <polygon points="220,100 300,115 300,158 220,140" fill={darkenHex(wallAccent, 0.85)} stroke="#8a8a8a" strokeWidth="1" />

        {/* Flat roof - main */}
        <polygon points="45,140 260,140 360,158 140,158" fill={roofColor} stroke="#6a6a6a" strokeWidth="1" opacity="0.4" />

        {/* Flat roof - upper block */}
        <polygon points="75,100 220,100 305,115 155,115" fill={roofColor} stroke="#6a6a6a" strokeWidth="1.5" />

        {/* Roof edge trim */}
        <line x1="45" y1="140" x2="260" y2="140" stroke={roofDark} strokeWidth="3" />
        <line x1="75" y1="100" x2="220" y2="100" stroke={roofDark} strokeWidth="3" />

        {/* Metal standing seam on visible roof */}
        {materialType === "metal" && (
          <>
            {[100, 140, 180, 220].map((x, i) => (
              <line key={`seam-${i}`} x1={x} y1="100" x2={x + 20} y2="115" stroke="#ffffff30" strokeWidth="1.5" />
            ))}
          </>
        )}

        {/* Large glass windows - upper */}
        <rect x="90" y="108" width="55" height="28" fill="url(#glass-mod)" stroke="#7a7a7a" strokeWidth="0.8" />
        <rect x="155" y="108" width="55" height="28" fill="url(#glass-mod)" stroke="#7a7a7a" strokeWidth="0.8" />

        {/* Floor-to-ceiling windows - lower */}
        <rect x="60" y="148" width="70" height="108" fill="url(#glass-mod)" stroke="#7a7a7a" strokeWidth="0.8" />
        <line x1="95" y1="148" x2="95" y2="256" stroke="#7a7a7a" strokeWidth="0.5" />
        <line x1="60" y1="200" x2="130" y2="200" stroke="#7a7a7a" strokeWidth="0.5" />

        <rect x="140" y="148" width="50" height="108" fill="url(#glass-mod)" stroke="#7a7a7a" strokeWidth="0.8" />

        {/* Modern front door */}
        <rect x="200" y="195" width="35" height="63" fill="#3a3a3a" stroke="#2a2a2a" strokeWidth="1.5" />
        <rect x="204" y="200" width="10" height="25" fill="url(#glass-mod)" opacity="0.6" />
        <line x1="230" y1="230" x2="230" y2="240" stroke="#c0c0c0" strokeWidth="2" />

        {/* Side windows */}
        <rect x="280" y="170" width="30" height="40" fill="url(#glass-mod)" stroke="#7a7a7a" strokeWidth="0.8" />
        <rect x="320" y="170" width="20" height="40" fill="url(#glass-mod)" stroke="#7a7a7a" strokeWidth="0.8" />
      </g>

      {/* Minimalist landscaping */}
      <rect x="55" y="258" width="80" height="3" fill="#6a6a6a" opacity="0.3" />
      <ellipse cx="350" cy="258" rx="18" ry="8" fill="#4a7a3a" opacity="0.5" />

      {/* Concrete walkway */}
      <rect x="200" y="258" width="35" height="30" fill="#b8b8b8" opacity="0.4" />
    </svg>
  );
};
