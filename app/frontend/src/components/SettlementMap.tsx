import { useState } from "react";
import type { SeedColony } from "../data/seedColony";

const sites = [
  {
    name: "Council house",
    x: 398,
    y: 213,
    label: "The heart of Hearthfall",
    detail:
      "Choose a daily priority below. Your decisions change supplies and morale.",
  },
  {
    name: "Storehouse",
    x: 270,
    y: 293,
    label: "Food & medicine",
    detail: "Foragers refill the stores. Frost and daily rations consume them.",
  },
  {
    name: "Waterworks",
    x: 547,
    y: 291,
    label: "Rain collection",
    detail: "Every rainy day returns eight units of water to the camp.",
  },
  {
    name: "Living quarters",
    x: 416,
    y: 364,
    label: "18 founding settlers",
    detail:
      "Rest days raise morale at the cost of extra provisions and medicine.",
  },
] as const;

function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cy="7" rx="14" ry="6" fill="#091b15" opacity=".5" />
      <path d="M-2 0h4v10h-4z" fill="#77664a" />
      <path d="M0-46 18-10H8l15 16h-46l15-16h-10z" fill="#244c3c" />
      <path d="M0-46 0 6h23L8-10h10z" fill="#193f31" />
      <path d="M0-46-18-10h7L0-30z" fill="#48715a" opacity=".65" />
    </g>
  );
}
function House({
  x,
  y,
  small = false,
}: {
  x: number;
  y: number;
  small?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${small ? 0.7 : 1})`}>
      <path d="m-42 5 48-22 48 23-48 24z" fill="#0a1d18" opacity=".45" />
      <path d="m-34-10 34 17v35l-34-17z" fill="#8a7452" />
      <path d="m0 7 39-19v35L0 42z" fill="#5e6047" />
      <path d="m-44-11 39-42 48 39L0 7z" fill="#bd9e64" />
      <path d="m-5-53 48 39L0 7z" fill="#887b4d" />
      <path d="m-44-11 39-42L0 7z" fill="#a9a16b" />
      <path d="m11 13 10-5v16l-10 5z" fill="#e8c982" />
      <path d="m-23-1 11 5v13l-11-5z" fill="#e8c982" opacity=".8" />
      <path d="m27-46 8-4v24l-8 4z" fill="#495449" />
    </g>
  );
}
export default function SettlementMap({
  colony,
  onSelectResource,
}: {
  colony: SeedColony;
  onSelectResource?: (
    resource: "food" | "water" | "medicine" | "morale",
  ) => void;
}) {
  const [selected, setSelected] = useState(0);
  function selectSite(index: number) {
    setSelected(index);
    onSelectResource?.((["morale", "food", "water", "morale"] as const)[index]);
  }
  return (
    <div className="settlement">
      <div className="map-topline">
        <span>
          <i className="live-dot" /> Hearthfall valley
        </span>
        <span>PLATE I · SURVEY OF THE VALLEY</span>
      </div>
      <svg
        className="settlement-art"
        viewBox="0 0 800 510"
        role="group"
        aria-label={`Illustrated isometric view of Hearthfall Outpost on day ${colony.day}. Select a building below to learn its role.`}
      >
        <defs>
          <pattern
            id="engraving"
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(25)"
          >
            <path d="M0 0v5" stroke="#e5dab1" strokeWidth=".7" />
          </pattern>
          <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#526a4f" />
            <stop offset="1" stopColor="#304e3b" />
          </linearGradient>
          <radialGradient id="glow">
            <stop stopColor="#d5b76c" stopOpacity=".14" />
            <stop offset="1" stopColor="#d5b76c" stopOpacity="0" />
          </radialGradient>
          <pattern
            id="grid"
            width="48"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="m0 14 24-14 24 14-24 14z"
              fill="none"
              stroke="#9ebba0"
              strokeOpacity=".065"
            />
          </pattern>
        </defs>
        <rect width="800" height="510" fill="url(#grid)" />
        <ellipse cx="412" cy="260" rx="350" ry="245" fill="url(#glow)" />
        <path d="m82 285 300-174 333 181-301 175z" fill="#0b2019" />
        <path d="m82 269 300-174 333 181-301 175z" fill="url(#land)" />
        <path
          d="m82 269 300-174 333 181-301 175z"
          fill="url(#engraving)"
          opacity=".2"
        />
        <path d="m82 269 332 182v16L82 285z" fill="#293b2d" />
        <path d="m414 451 301-175v16L414 467z" fill="#20392e" />
        <path
          d="m401 111 50 27-101 58 174 97-96 56 86 47-40 23-121-70 95-56-170-96z"
          fill="#658779"
        />
        <path
          d="m420 125 12 7-101 61 175 100-96 57 86 46-14 8-103-56 95-57-172-97z"
          fill="#96af99"
          opacity=".3"
        />
        <path
          d="m273 289 128-74 143 81M401 215l17 145M270 290l148 70"
          fill="none"
          stroke="#aa9c6e"
          strokeWidth="14"
          strokeLinejoin="round"
          opacity=".55"
        />
        <path
          d="m171 265 180-104m-161 148 64 35m238 62 118-69"
          fill="none"
          stroke="#b7a277"
          strokeWidth="3"
          opacity=".55"
          strokeDasharray="3 13"
        />
        {[
          [224, 219, 1.1],
          [265, 191, 0.9],
          [310, 162, 1.2],
          [364, 126, 0.8],
          [497, 197, 1.1],
          [537, 218, 0.95],
          [598, 251, 1.2],
          [643, 279, 0.9],
          [189, 254, 1.1],
          [210, 305, 0.9],
          [255, 344, 1.2],
          [303, 373, 1],
          [349, 400, 0.85],
          [550, 364, 1],
          [602, 331, 1.1],
          [463, 173, 0.8],
        ].map(([x, y, s]) => (
          <Tree key={`${x}-${y}`} x={x} y={y} scale={s} />
        ))}
        <House x={398} y={213} />
        <House x={270} y={293} small />
        <House x={416} y={364} small />
        <House x={459} y={337} small />
        <g transform="translate(547 291)">
          <ellipse rx="29" ry="14" fill="#182c24" />
          <path d="M-24-18v22q24 17 48 0v-22" fill="#65756b" />
          <ellipse cy="-18" rx="24" ry="12" fill="#a2b4a5" />
          <ellipse cy="-18" rx="18" ry="8" fill="#517f7d" />
          <path
            d="M-29-19v-36l31-18 29 18v36M2-73v37"
            fill="none"
            stroke="#a99b74"
            strokeWidth="5"
          />
        </g>
        <g transform="translate(358 283)">
          <ellipse rx="15" ry="8" fill="#eac277" opacity=".12" />
          <path d="M0-16q-11 11-7 16 9 7 15-2-2-8-5-9l-3 7z" fill="#d0a35d" />
          <path d="m-13 5 24-3m-19-2 17 8" stroke="#816d45" strokeWidth="3" />
        </g>
        <circle
          cx={sites[selected].x}
          cy={sites[selected].y + 42}
          r="8"
          fill="#edcf8d"
          stroke="#203f31"
          strokeWidth="3"
        />
        {sites.map((site, i) => (
          <g
            key={site.name}
            className="map-hotspot"
            role="button"
            tabIndex={0}
            aria-label={`Explore ${site.name}`}
            aria-pressed={selected === i}
            onClick={() => selectSite(i)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectSite(i);
              }
            }}
          >
            <title>{site.name}</title>
            <circle
              cx={site.x}
              cy={site.y + 10}
              r="40"
              fill="transparent"
              stroke={selected === i ? "#e5c98e" : "transparent"}
              strokeWidth="2"
              strokeDasharray="3 5"
            />
          </g>
        ))}
        <g
          fill="#bbcdad"
          fontFamily="monospace"
          fontSize="10"
          letterSpacing="2"
        >
          <text x="647" y="112">
            N
          </text>
          <g stroke="#806b47" strokeWidth=".8" fill="none">
            <circle cx="651" cy="144" r="23" />
            <circle cx="651" cy="144" r="19" />
            <path d="M651 114v60m-30-30h60m-48-18 36 36m-36 0 36-36" />
            <path
              d="m651 119 5 20 20 5-20 5-5 20-5-20-20-5 20-5z"
              fill="#d3c197"
            />
            <path
              d="m651 119 0 25 5-5zM676 144h-25l5 5zM651 169v-25l-5 5zM626 144h25l-5-5z"
              fill="#806b47"
            />
          </g>
          <text x="86" y="410">
            NORTHERN RIDGE
          </text>
        </g>
      </svg>
      <div className="building-selector" aria-label="Explore the settlement">
        {sites.map((site, i) => (
          <button
            key={site.name}
            aria-pressed={i === selected}
            onClick={() => selectSite(i)}
          >
            {site.name}
          </button>
        ))}
      </div>
      <div className="map-caption">
        <strong>{sites[selected].label}</strong>
        <span>
          {sites[selected].detail}{" "}
          {selected === 1
            ? `${colony.food} food · ${colony.medicine} medicine.`
            : selected === 2
              ? `${colony.water} water in reserve.`
              : `${colony.morale} morale · day ${colony.day}.`}
        </span>
      </div>
    </div>
  );
}
