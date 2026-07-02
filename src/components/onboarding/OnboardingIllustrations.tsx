/** Compact onboarding art — California map with real projected geometry. */

import { CA_ONBOARDING_MAP } from "./californiaMapArt";
import { MAP_COLORS } from "../../utils/mapTheme";

const { width, height, statePath, cities } = CA_ONBOARDING_MAP;

function CityDot({
  x,
  y,
  active = false,
}: {
  x: number;
  y: number;
  active?: boolean;
}) {
  if (active) {
    return (
      <>
        <circle cx={x} cy={y} r={9} fill="none" stroke="#93c5fd" strokeWidth={2} opacity={0.95} />
        <circle
          cx={x}
          cy={y}
          r={4.5}
          fill={MAP_COLORS.hint}
          stroke="#fff"
          strokeWidth={2}
        />
      </>
    );
  }
  return (
    <circle
      cx={x}
      cy={y}
      r={3.5}
      fill={MAP_COLORS.markerFill}
      stroke={MAP_COLORS.markerStroke}
      strokeWidth={1.2}
    />
  );
}

function CaliforniaMap({
  highlightId,
  mapTop = 0,
}: {
  highlightId: keyof typeof cities;
  mapTop?: number;
}) {
  return (
    <g transform={`translate(0, ${mapTop})`}>
      <rect width={width} height={height} rx={10} fill={MAP_COLORS.water} />
      <path
        d={statePath}
        fill={MAP_COLORS.land}
        stroke={MAP_COLORS.landStroke}
        strokeWidth={1.25}
      />
      {(["sf", "sd"] as const).map((id) => (
        <CityDot key={id} x={cities[id].x} y={cities[id].y} />
      ))}
      <CityDot x={cities[highlightId].x} y={cities[highlightId].y} active />
    </g>
  );
}

export function OnboardingTapIllustration() {
  const pad = 10;
  const headerH = 30;
  const gap = 6;
  const mapY = pad + headerH + gap;
  const totalH = mapY + height + pad;
  const pillW = 108;
  const pillX = cities.la.x - pillW / 2;
  const laY = cities.la.y + mapY;
  const fingerX = cities.la.x + 12;
  const fingerY = laY + 4;

  return (
    <svg
      viewBox={`0 0 ${width} ${totalH}`}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width={width} height={totalH} rx={14} fill="#eef6f8" />
      <rect x={pad} y={pad} width={width - pad * 2} height={headerH} rx={8} fill="#173b41" />
      <rect x={pillX} y={pad + 5} width={pillW} height={20} rx={10} fill="#f06548" />
      <text
        x={cities.la.x}
        y={pad + 19}
        textAnchor="middle"
        fill="#fff"
        fontFamily="system-ui,sans-serif"
        fontSize={10}
        fontWeight={700}
      >
        {cities.la.label}
      </text>
      <CaliforniaMap highlightId="la" mapTop={mapY} />
      <path
        d={`M${fingerX} ${fingerY}v12h7v6l11-11-11-11h7V${fingerY}z`}
        fill="#f06548"
        stroke="#fff"
        strokeWidth={1.25}
      />
    </svg>
  );
}

export function OnboardingTypeIllustration() {
  const inputY = height + 22;

  return (
    <svg
      viewBox={`0 0 ${width} ${inputY + 34}`}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width={width} height={inputY + 34} rx={14} fill="#eef6f8" />
      <CaliforniaMap highlightId="la" mapTop={8} />
      <rect x={0} y={inputY} width={width} height={34} rx={10} fill="#12333a" />
      <rect x={10} y={inputY + 6} width={176} height={22} rx={8} fill="#fff" stroke="#2563eb" strokeWidth={1.5} />
      <text x={20} y={inputY + 20} fill="#1f2937" fontFamily="system-ui,sans-serif" fontSize={11} fontWeight={600}>
        Los Angeles
      </text>
      <rect x={194} y={inputY + 6} width={64} height={22} rx={8} fill="#2563eb" />
      <text
        x={226}
        y={inputY + 20}
        textAnchor="middle"
        fill="#fff"
        fontFamily="system-ui,sans-serif"
        fontSize={10}
        fontWeight={700}
      >
        Check
      </text>
    </svg>
  );
}

export function OnboardingUnlocksIllustration() {
  return (
    <svg viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="300" height="200" rx="16" fill="#faf8f5" />
      <circle cx="62" cy="88" r="26" fill="#CD7F32" stroke="#9A5B1E" strokeWidth="2" />
      <text x="62" y="94" textAnchor="middle" fill="#FFF4E6" fontSize="16" fontWeight="800">
        ★
      </text>
      <text x="62" y="128" textAnchor="middle" fill="#9a3412" fontFamily="system-ui,sans-serif" fontSize="10" fontWeight="700">
        70%
      </text>
      <circle cx="150" cy="88" r="26" fill="#A8B0BC" stroke="#6B7280" strokeWidth="2" />
      <text x="150" y="94" textAnchor="middle" fill="#F9FAFB" fontSize="16" fontWeight="800">
        ★
      </text>
      <text x="150" y="128" textAnchor="middle" fill="#374151" fontFamily="system-ui,sans-serif" fontSize="10" fontWeight="700">
        85%
      </text>
      <circle cx="238" cy="88" r="26" fill="#E8B84A" stroke="#B8860B" strokeWidth="2" />
      <text x="238" y="94" textAnchor="middle" fill="#FFFBEB" fontSize="16" fontWeight="800">
        ★
      </text>
      <text x="238" y="128" textAnchor="middle" fill="#92400e" fontFamily="system-ui,sans-serif" fontSize="10" fontWeight="700">
        100%
      </text>
      <rect x="24" y="148" width="252" height="36" rx="10" fill="#eef2ff" />
      <text
        x="150"
        y="170"
        textAnchor="middle"
        fill="#3730a3"
        fontFamily="system-ui,sans-serif"
        fontSize="10"
        fontWeight="700"
      >
        ⚡ Speed badges · Journey levels · Daily &amp; regional quizzes
      </text>
    </svg>
  );
}

export const ONBOARDING_ILLUSTRATIONS = {
  tap: OnboardingTapIllustration,
  type: OnboardingTypeIllustration,
  unlock: OnboardingUnlocksIllustration,
} as const;
