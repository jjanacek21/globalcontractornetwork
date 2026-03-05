import { darkenHex, lightenHex } from "./utils";

interface Props {
  roofColor: string;
  materialType: "shingles" | "metal";
}

export const RanchHouse = ({ roofColor, materialType }: Props) => {
  const roofDark = darkenHex(roofColor, 0.7);
  const roofLight = lightenHex(roofColor, 1.15);
  const wallFront = "#e8ddd4";
  const wallSide = "#d4c8bc";

  return (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <defs>
        <filter id="shadow-ranch" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#00000030" />
        </filter>
        <linearGradient id="roof-sun-ranch" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={roofLight} stopOpacity="0.3" />
          <stop offset="100%" stopColor={roofColor} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sky-ranch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a8d8ea" />
          <stop offset="100%" stopColor="#d4eef7" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="400" height="300" fill="url(#sky-ranch)" />

      {/* Ground */}
      <ellipse cx="200" cy="270" rx="190" ry="30" fill="#6b9b3a" opacity="0.35" />
      <rect x="0" y="260" width="400" height="40" fill="#7cb342" opacity="0.3" />

      {/* Driveway */}
      <polygon points="310,260 350,260 370,280 330,280" fill="#b0a89a" opacity="0.5" />

      <g filter="url(#shadow-ranch)">
        {/* Front wall */}
        <polygon points="50,170 260,170 260,250 50,250" fill={wallFront} stroke="#5a5045" strokeWidth="1.5" />

        {/* Side wall (right, in perspective) */}
        <polygon points="260,170 360,190 360,260 260,250" fill={wallSide} stroke="#5a5045" strokeWidth="1.5" />

        {/* Roof - front face (sun side) */}
        <polygon points="35,170 260,170 260,120 160,95" fill={roofColor} stroke="#4a4038" strokeWidth="1.5" />
        <polygon points="35,170 260,170 260,120 160,95" fill="url(#roof-sun-ranch)" />

        {/* Roof - side face (shadow side) */}
        <polygon points="260,170 370,190 370,145 260,120" fill={roofDark} stroke="#4a4038" strokeWidth="1.5" />

        {/* Roof ridge */}
        <line x1="160" y1="95" x2="290" y2="115" stroke="#3a3530" strokeWidth="2" />

        {/* Shingle texture */}
        {materialType === "shingles" && (
          <>
            {[135, 148, 160].map((y, i) => (
              <line key={`sh-${i}`} x1={55 + i * 8} y1={y} x2={255} y2={y} stroke="#00000012" strokeWidth="1" />
            ))}
            {[155, 168, 180].map((y, i) => (
              <line key={`shs-${i}`} x1={265} y1={y} x2={365} y2={y + 3} stroke="#00000015" strokeWidth="1" />
            ))}
          </>
        )}

        {/* Metal texture */}
        {materialType === "metal" && (
          <>
            {[100, 140, 180, 220].map((x, i) => (
              <line key={`ml-${i}`} x1={x} y1={170} x2={x * 0.75 + 40} y2={100 + i * 2} stroke="#ffffff25" strokeWidth="2" />
            ))}
            {[290, 320, 350].map((x, i) => (
              <line key={`mr-${i}`} x1={x} y1={190 - i} x2={x - 10} y2={140 + i * 5} stroke="#ffffff20" strokeWidth="2" />
            ))}
          </>
        )}

        {/* Garage door (side wall) */}
        <rect x="285" y="210" width="45" height="48" rx="2" fill="#7a6b5c" stroke="#5a4d40" strokeWidth="1" />
        {[220, 230, 240, 250].map(y => (
          <line key={`g-${y}`} x1="287" y1={y} x2="328" y2={y} stroke="#5a4d40" strokeWidth="0.5" />
        ))}

        {/* Front door */}
        <rect x="145" y="200" width="30" height="50" rx="2" fill="#5c4033" stroke="#3a2a20" strokeWidth="1.5" />
        <circle cx="169" cy="226" r="2.5" fill="#c9a959" />

        {/* Porch overhang */}
        <polygon points="130,200 190,200 190,195 130,195" fill={darkenHex(roofColor, 0.85)} stroke="#4a4038" strokeWidth="0.8" />
        <line x1="132" y1="200" x2="132" y2="250" stroke="#8a7a6a" strokeWidth="2" />
        <line x1="188" y1="200" x2="188" y2="250" stroke="#8a7a6a" strokeWidth="2" />

        {/* Windows with shutters */}
        {[80, 210].map(x => (
          <g key={`w-${x}`}>
            <rect x={x - 5} y="195" width="5" height="30" fill="#3a5a3a" />
            <rect x={x + 30} y="195" width="5" height="30" fill="#3a5a3a" />
            <rect x={x} y="195" width="30" height="30" fill="#a8d8ea" stroke="#5a5045" strokeWidth="1" />
            <line x1={x + 15} y1="195" x2={x + 15} y2="225" stroke="#5a5045" strokeWidth="0.8" />
            <line x1={x} y1="210" x2={x + 30} y2="210" stroke="#5a5045" strokeWidth="0.8" />
          </g>
        ))}

        {/* Side window */}
        <rect x="295" y="195" width="20" height="15" fill="#a8d8ea" stroke="#5a5045" strokeWidth="1" />
      </g>

      {/* Bushes */}
      <ellipse cx="70" cy="252" rx="18" ry="10" fill="#4a8a3a" opacity="0.7" />
      <ellipse cx="240" cy="252" rx="15" ry="8" fill="#4a8a3a" opacity="0.6" />

      {/* Walkway */}
      <polygon points="148,250 178,250 185,280 140,280" fill="#c8beb0" opacity="0.5" />
    </svg>
  );
};
