import { useId } from 'react';

export interface DayMythMeta {
  day: number;
  motif: string;
  sceneTitle: string;
  visualStory: string;
  anchors: string[];
}

export const DAY_MYTH_META: Record<number, DayMythMeta> = {
  1: {
    day: 1,
    motif: '創世の光輪と天孫降臨（第1〜2段）',
    sceneTitle: '高天原の神議り・八重雲を押し分けての降臨',
    visualStory:
      '天界の光輪を背に神漏岐・神漏美と八百万の神々が集い、岩や木草・荒ぶる神を鎮めて、光の柱が八重雲を押し分け地上（豊葦原水穂国）へ降る情景です。',
    anchors: [
      '高天原・神留り坐す',
      '神漏岐・神漏美',
      '神集へ・神議り',
      '荒振る神・岩木草を語止め',
      '天の磐座・八重雲を千別き',
    ],
  },
  2: {
    day: 2,
    motif: '瑞の御殿と罪の出現（第3〜4段）',
    sceneTitle: '太敷く宮柱と千木、そして民に忍び寄る罪穢れ',
    visualStory:
      '大倭日高見国の岩盤に太く立てられた宮柱と空へ聳える千木（天の御蔭・日の御蔭）。その平和な民（天の益人）のそばで、天つ罪・国つ罪の瘴気が立ち上ります。',
    anchors: [
      '大倭日高見国',
      '下つ磐根に宮柱太敷き立て',
      '高天原に千木高知りて',
      '天の御蔭・日の御蔭',
      '天の益人等・天つ罪・国つ罪',
    ],
  },
  3: {
    day: 3,
    motif: '天つ宮事と神々の傾聴（第5〜6段）',
    sceneTitle: '金木・菅麻の祓具と、天の磐門・山の霧を開く神々',
    visualStory:
      '置座に並べた金木（打ち切り→打ち断ち）と菅麻（刈り断ち→刈り切り）の前で太祝詞事を宣ると、天の磐門が開き、高山・短山の雲霧をかき分けて神々が耳を傾けます。',
    anchors: [
      '天つ金木(打切り→打断ち)',
      '天つ菅麻(刈断ち→刈切り)',
      '太祝詞事を宣れ',
      '天つ神・天の磐門',
      '国つ神・高山短山の伊褒理',
    ],
  },
  4: {
    day: 4,
    motif: '四つの比喩＆瀬織津比売・速開都比売（第7〜8段）',
    sceneTitle: '風・霧・船・鎌の浄化と、川から海の渦へ至る祓戸リレー',
    visualStory:
      '科戸の風・朝夕の霧・大船・焼鎌の4つの比喩で罪が払われ、急流の滝に坐す瀬織津比売が大海原へ流し出し、潮の八百会に坐す速開都比売が一気に呑み込みます。',
    anchors: [
      '4比喩(風・霧・船・鎌)',
      '瀬織津比売(速川の瀬)',
      '大海原に持ち出でなむ',
      '速開都比売(潮の八百会)',
      '持ち加加呑みてむ',
    ],
  },
  5: {
    day: 5,
    motif: '気吹戸主・速佐須良比売と「白す」（第9〜10段）',
    sceneTitle: '根国への大いなる息吹と、罪を消し去る女神・奏上の光',
    visualStory:
      '気吹戸主が息吹の風で根国・底国へ吹き放ち、速佐須良比売が持ち去って完全に消し失わせたのち、天地八百万の神々へ向けて「聞こし食せと白す」光が差し込みます。',
    anchors: [
      '気吹戸主(気吹戸)',
      '根国・底国へ気吹き放ちてむ',
      '速佐須良比売',
      '持ち佐須良ひ失ひてむ',
      '八百万神等共に聞こし食せと白す',
    ],
  },
  6: {
    day: 6,
    motif: '全段総復習・天→地→海→根国の浄化循環',
    sceneTitle: '光の河が結ぶ「大祓詞」四界の全体マップ',
    visualStory:
      '天（高天原）→地（瑞の御殿と太祝詞事）→川海（瀬織津比売・速開都比売）→根国（気吹戸主・速佐須良比売）と巡る光の軌道で、全10段の繋がりを頭の中で一本化します。',
    anchors: [
      '①天(神議り・降臨)',
      '②地(御殿・罪・太祝詞事)',
      '③傾聴＆4比喩',
      '④祓戸四神リレー',
      '⑤罪消滅・白す',
    ],
  },
  7: {
    day: 7,
    motif: '通し暗唱・万神顕現と清浄成就',
    sceneTitle: '八百万の神々と大いなる光輪・完全暗唱の境地',
    visualStory:
      '聖域の鳥居と天蓋を照らす幾重もの黄金の光輪のもと、前段・後段・結びの「白す」まで一息に淀みなく奏上し切る最終仕上げのイメージです。',
    anchors: [
      '高天原から白すまで',
      '全10段・30句一気通し',
      '迷わず淀みなく',
      '清浄成就',
    ],
  },
};

function MythHalo({
  cx,
  cy,
  r,
  stroke = '#f6d878',
  reverse = false,
}: {
  cx: number;
  cy: number;
  r: number;
  stroke?: string;
  reverse?: boolean;
}) {
  const spokes = [0, 30, 60, 90, 120, 150];
  return (
    <g className={reverse ? 'myth-spin-rev' : 'myth-spin-slow'}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeOpacity="0.65"
        strokeDasharray="6 4"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.82}
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        strokeOpacity="0.45"
      />
      {spokes.map((deg) => (
        <line
          key={deg}
          x1={cx}
          y1={cy - r * 0.96}
          x2={cx}
          y2={cy + r * 0.96}
          stroke={stroke}
          strokeWidth="0.9"
          strokeOpacity="0.28"
          transform={`rotate(${deg} ${cx} ${cy})`}
        />
      ))}
    </g>
  );
}

function DeitySilhouette({
  x,
  y,
  scale = 1,
  robeColor = '#f5eedc',
  accentColor = '#f2c95c',
  veilColor = '#8fd8ff',
  delayed = false,
}: {
  x: number;
  y: number;
  scale?: number;
  robeColor?: string;
  accentColor?: string;
  veilColor?: string;
  delayed?: boolean;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      className={delayed ? 'myth-float-delay' : 'myth-float'}
    >
      {/* Celestial scarf / hagoromo veil */}
      <path
        d="M -38 8 Q -58 -16 -34 -34 Q 0 -50 34 -34 Q 58 -16 38 8 Q 22 -8 0 -6 Q -22 -8 -38 8 Z"
        fill="none"
        stroke={veilColor}
        strokeWidth="3.5"
        strokeOpacity="0.7"
      />
      {/* Robe body */}
      <path
        d="M -20 42 L -10 -12 Q 0 -18 10 -12 L 20 42 Q 0 48 -20 42 Z"
        fill={robeColor}
        fillOpacity="0.95"
      />
      {/* Gold stole */}
      <path
        d="M -8 -10 L 0 18 L 8 -10"
        fill="none"
        stroke={accentColor}
        strokeWidth="2.6"
      />
      {/* Head & crown */}
      <circle cx="0" cy="-24" r="9.5" fill={robeColor} />
      <path d="M -8 -31 L 0 -41 L 8 -31 Z" fill={accentColor} />
    </g>
  );
}

function FrameOverlay({
  uid,
  compact,
  label,
}: {
  uid: string;
  compact: boolean;
  label: string;
}) {
  return (
    <>
      <rect
        x="8"
        y="8"
        width="624"
        height="284"
        rx="12"
        fill="none"
        stroke={`url(#${uid}-gold)`}
        strokeWidth="2"
        strokeOpacity="0.72"
      />
      <rect
        x="14"
        y="14"
        width="612"
        height="272"
        rx="8"
        fill="none"
        stroke={`url(#${uid}-gold)`}
        strokeWidth="0.8"
        strokeOpacity="0.38"
      />
      {!compact && (
        <g>
          <rect
            x="22"
            y="20"
            width="230"
            height="24"
            rx="12"
            fill="#0b1124"
            fillOpacity="0.72"
            stroke="#f2c95c"
            strokeOpacity="0.5"
          />
          <text
            x="34"
            y="36"
            fill="#f7e5a8"
            fontSize="11.5"
            fontWeight="700"
            fontFamily="sans-serif"
          >
            {label}
          </text>
        </g>
      )}
    </>
  );
}

export function DayMythSvg({
  day,
  compact = false,
}: {
  day: number;
  compact?: boolean;
}) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeDay = day >= 1 && day <= 7 ? day : 1;

  return (
    <svg
      viewBox="0 0 640 300"
      role="img"
      aria-label={DAY_MYTH_META[safeDay].sceneTitle}
      style={compact ? { maxHeight: 150 } : undefined}
    >
      <defs>
        <linearGradient id={`${uid}-sky-night`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#091026" />
          <stop offset="55%" stopColor="#172854" />
          <stop offset="100%" stopColor="#263d70" />
        </linearGradient>
        <linearGradient id={`${uid}-sky-dawn`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#141e42" />
          <stop offset="55%" stopColor="#3c3a6e" />
          <stop offset="100%" stopColor="#94624c" />
        </linearGradient>
        <linearGradient id={`${uid}-sky-sea`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0a1b38" />
          <stop offset="55%" stopColor="#10385e" />
          <stop offset="100%" stopColor="#0c203d" />
        </linearGradient>
        <linearGradient id={`${uid}-sky-abyss`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#132245" />
          <stop offset="50%" stopColor="#1f1a3d" />
          <stop offset="100%" stopColor="#3b2c4e" />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff2b8" />
          <stop offset="50%" stopColor="#f2c44d" />
          <stop offset="100%" stopColor="#c78d24" />
        </linearGradient>
        <linearGradient id={`${uid}-beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff7d1" stopOpacity="0.88" />
          <stop offset="65%" stopColor="#f5c95d" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#f5c95d" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff4bf" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#eab649" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#eab649" stopOpacity="0" />
        </radialGradient>
        <path id={`${uid}-cosmo-path`} d="M 95 75 C 210 60 210 155 315 150 C 420 145 430 225 545 210" />
      </defs>

      {safeDay === 1 && (
        <g>
          <rect width="640" height="300" fill={`url(#${uid}-sky-night)`} />
          {/* Ambient celestial glow */}
          <circle cx="320" cy="108" r="145" fill={`url(#${uid}-glow)`} className="myth-pulse" />
          <MythHalo cx={320} cy={104} r={88} />
          <MythHalo cx={320} cy={104} r={116} reverse stroke="#9ad7ff" />

          {/* Eight-million kami spheres */}
          {[140, 195, 245, 395, 445, 500].map((cx, i) => (
            <circle
              key={cx}
              cx={cx}
              cy={72 + (i % 2) * 24}
              r="7"
              fill="#fff3ba"
              fillOpacity="0.8"
              className="myth-pulse"
            />
          ))}

          {/* Twin ancestral deities: 神漏岐・神漏美 */}
          <DeitySilhouette x={282} y={102} scale={0.9} veilColor="#9ce0ff" />
          <DeitySilhouette x={358} y={102} scale={0.9} veilColor="#ffd2ea" delayed />

          {/* Descending light pillar (天降し) */}
          <polygon points="295,128 345,128 386,286 254,286" fill={`url(#${uid}-beam)`} className="myth-pulse" />

          {/* Parting eight-fold clouds (天の八重雲を千別きに千別きて) */}
          <g className="myth-drift-l">
            <ellipse cx="220" cy="192" rx="88" ry="20" fill="#dbeaff" fillOpacity="0.3" />
            <ellipse cx="170" cy="204" rx="68" ry="15" fill="#ffffff" fillOpacity="0.24" />
          </g>
          <g className="myth-drift-r">
            <ellipse cx="420" cy="192" rx="88" ry="20" fill="#dbeaff" fillOpacity="0.3" />
            <ellipse cx="470" cy="204" rx="68" ry="15" fill="#ffffff" fillOpacity="0.24" />
          </g>

          {/* Calmed 豊葦原水穂国 */}
          <path d="M 14 268 Q 170 232 320 250 Q 470 266 626 238 L 626 286 L 14 286 Z" fill="#1d4d3e" />
          <path d="M 14 276 Q 220 252 420 268 Q 540 276 626 262 L 626 286 L 14 286 Z" fill="#2a6b52" />

          {/* Sparkling particles */}
          {[275, 305, 338, 365].map((sx, idx) => (
            <circle
              key={sx}
              cx={sx}
              cy={246 - idx * 8}
              r="3"
              fill="#fff5b8"
              className="myth-spark"
            />
          ))}

          {/* Labels */}
          <text x="320" y="34" textAnchor="middle" fill="#ffe9a6" fontSize="13" fontWeight="700">
            神漏岐・神漏美・八百万神（神議り）
          </text>
          <text x="155" y="182" textAnchor="middle" fill="#d3ebff" fontSize="11.5">
            天の八重雲を千別き
          </text>
          <text x="485" y="256" textAnchor="middle" fill="#b4f5ce" fontSize="12" fontWeight="700">
            豊葦原水穂国（安国）
          </text>
        </g>
      )}

      {safeDay === 2 && (
        <g>
          <rect width="640" height="300" fill={`url(#${uid}-sky-dawn)`} />
          {/* Radiant sun halo (天の御蔭・日の御蔭) */}
          <circle cx="245" cy="120" r="130" fill={`url(#${uid}-glow)`} className="myth-pulse" />
          <MythHalo cx={245} cy={125} r={88} />

          {/* Underground bedrock & thick pillar (下つ磐根に宮柱太敷き立て) */}
          <path d="M 14 238 L 410 238 L 430 286 L 14 286 Z" fill="#2b2628" />
          <rect x="232" y="160" width="26" height="122" fill={`url(#${uid}-gold)`} fillOpacity="0.88" />

          {/* Ornate Shrine with crossed Chigi (高天原に千木高知りて・瑞の御殿) */}
          <g className="myth-float">
            <line x1="185" y1="74" x2="215" y2="112" stroke="#ffe596" strokeWidth="5" strokeLinecap="round" />
            <line x1="305" y1="74" x2="275" y2="112" stroke="#ffe596" strokeWidth="5" strokeLinecap="round" />
            <polygon points="168,142 245,98 322,142" fill="#f7eed7" stroke="#e4b343" strokeWidth="2.5" />
            <rect x="188" y="142" width="114" height="58" fill="#fffaf0" stroke="#d49e35" strokeWidth="2" />
            <rect x="230" y="158" width="30" height="42" fill="#b5382a" />
          </g>

          {/* Peaceful populace (天の益人等) */}
          {[82, 112, 142].map((px) => (
            <g key={px} transform={`translate(${px} 230)`}>
              <circle cx="0" cy="-14" r="5" fill="#fde9b8" />
              <path d="M -7 4 L -4 -8 L 4 -8 L 7 4 Z" fill="#fde9b8" />
            </g>
          ))}

          {/* Rising miasma (天つ罪・国つ罪・許許太久の罪) */}
          <g className="myth-miasma">
            <path
              d="M 455 268 Q 430 220 468 188 Q 505 156 475 112 Q 528 130 546 175 Q 576 218 548 268 Z"
              fill="#4d245e"
              fillOpacity="0.82"
              stroke="#d95b6c"
              strokeWidth="1.5"
            />
            <circle cx="496" cy="175" r="24" fill="#a83254" fillOpacity="0.45" />
            <circle cx="524" cy="218" r="30" fill="#2f1340" fillOpacity="0.6" />
          </g>

          <text x="245" y="54" textAnchor="middle" fill="#fff0b3" fontSize="12.5" fontWeight="700">
            千木高知る瑞の御殿（天・日の御蔭）
          </text>
          <text x="115" y="264" textAnchor="middle" fill="#ffe2a8" fontSize="11.5">
            下つ磐根・天の益人等
          </text>
          <text x="505" y="96" textAnchor="middle" fill="#ffb8c6" fontSize="12.5" fontWeight="700">
            天つ罪・国つ罪・許許太久の罪
          </text>
        </g>
      )}

      {safeDay === 3 && (
        <g>
          <rect width="640" height="300" fill={`url(#${uid}-sky-night)`} />
          {/* Left: Ritual altar 千座の置座 (天つ金木 + 天つ菅麻) */}
          <rect x="44" y="216" width="150" height="16" rx="4" fill="#d9a648" />
          <rect x="64" y="232" width="14" height="36" fill="#9e7026" />
          <rect x="160" y="232" width="14" height="36" fill="#9e7026" />
          {/* 金木 (crossed sacred wood) */}
          <line x1="72" y1="208" x2="112" y2="174" stroke="#f5cf6e" strokeWidth="6" strokeLinecap="round" />
          <line x1="76" y1="176" x2="108" y2="208" stroke="#e0a93b" strokeWidth="6" strokeLinecap="round" />
          {/* 菅麻 (split hemp threads) */}
          <path d="M 148 212 Q 140 184 134 168 M 152 212 Q 152 182 152 164 M 156 212 Q 164 184 170 168" stroke="#e8fff0" strokeWidth="2.5" fill="none" />

          {/* Expanding soundwave rings of 太祝詞事 */}
          {[42, 72, 102].map((r) => (
            <circle
              key={r}
              cx="120"
              cy="185"
              r={r}
              fill="none"
              stroke="#ffe694"
              strokeWidth="1.6"
              className="myth-flow"
            />
          ))}

          {/* Upper Center: Heavenly Gate 天の磐門 & 天つ神 */}
          <circle cx="330" cy="86" r="78" fill={`url(#${uid}-glow)`} className="myth-pulse" />
          <MythHalo cx={330} cy={86} r={54} />
          <rect x="268" y="40" width="22" height="92" rx="3" fill="#4f5f82" className="myth-drift-l" />
          <rect x="370" y="40" width="22" height="92" rx="3" fill="#4f5f82" className="myth-drift-r" />
          <DeitySilhouette x={330} y={88} scale={0.72} />

          {/* Right: Mountains (高山・短山) + 伊褒理 mist + 国つ神 */}
          <polygon points="390,282 470,136 550,282" fill="#214d43" />
          <polygon points="485,282 555,176 620,282" fill="#2c6354" />
          <g className="myth-drift-r">
            <ellipse cx="505" cy="176" rx="68" ry="14" fill="#d8f2ff" fillOpacity="0.45" />
          </g>
          <DeitySilhouette x={470} y={120} scale={0.62} veilColor="#8df7c3" delayed />

          <text x="122" y="280" textAnchor="middle" fill="#ffe59c" fontSize="11.5" fontWeight="700">
            金木(切→断)・菅麻(断→切)／太祝詞事
          </text>
          <text x="330" y="28" textAnchor="middle" fill="#fff0b5" fontSize="12" fontWeight="700">
            天つ神（天の磐門を押し披き）
          </text>
          <text x="518" y="276" textAnchor="middle" fill="#b9f5da" fontSize="11.5" fontWeight="700">
            国つ神（高山・短山の伊褒理）
          </text>
        </g>
      )}

      {safeDay === 4 && (
        <g>
          <rect width="640" height="300" fill={`url(#${uid}-sky-sea)`} />
          {/* Top 4 metaphors bar */}
          {[
            { x: 110, label: '①科戸の風', color: '#a8f0ff' },
            { x: 250, label: '②朝夕の霧', color: '#d7e3ff' },
            { x: 390, label: '③大船解き放ち', color: '#ffe399' },
            { x: 530, label: '④焼鎌の敏鎌', color: '#ffae9c' },
          ].map((m) => (
            <g key={m.label}>
              <rect
                x={m.x - 56}
                y="22"
                width="112"
                height="26"
                rx="13"
                fill="#0b1830"
                fillOpacity="0.72"
                stroke={m.color}
                strokeOpacity="0.7"
              />
              <text x={m.x} y="39" textAnchor="middle" fill={m.color} fontSize="11" fontWeight="700">
                {m.label}
              </text>
            </g>
          ))}

          {/* Left: Waterfall & 瀬織津比売 */}
          <polygon points="34,274 110,110 198,274" fill="#18474c" />
          <path
            d="M 110 112 Q 130 165 152 210 T 218 258"
            fill="none"
            stroke="#8ef2ff"
            strokeWidth="12"
            strokeLinecap="round"
            className="myth-flow"
          />
          <circle cx="135" cy="135" r="56" fill={`url(#${uid}-glow)`} className="myth-pulse" />
          <MythHalo cx={135} cy={135} r={44} stroke="#8cf5e4" />
          <DeitySilhouette x={135} y={136} scale={0.78} veilColor="#72f2e5" />

          {/* Stream connecting river to ocean vortex */}
          <path
            d="M 218 258 Q 310 240 400 220"
            fill="none"
            stroke="#9be7ff"
            strokeWidth="6"
            className="myth-flow"
          />

          {/* Right: 速開都比売 & Swirling vortex (潮の八百会) */}
          <g transform="translate(485 232)">
            <ellipse cx="0" cy="0" rx="108" ry="26" fill="none" stroke="#6bd4ff" strokeWidth="2.5" className="myth-spin-slow" />
            <ellipse cx="0" cy="0" rx="74" ry="18" fill="none" stroke="#a6ebff" strokeWidth="2" className="myth-spin-rev" />
            <ellipse cx="0" cy="0" rx="40" ry="10" fill="#06142b" stroke="#ffe599" strokeWidth="1.8" />
          </g>
          <circle cx="485" cy="142" r="58" fill={`url(#${uid}-glow)`} className="myth-pulse" />
          <MythHalo cx={485} cy={142} r={46} stroke="#88c7ff" reverse />
          <DeitySilhouette x={485} y={142} scale={0.78} veilColor="#7bb9ff" delayed />

          <text x="140" y="280" textAnchor="middle" fill="#a8fff2" fontSize="12" fontWeight="700">
            瀬織津比売（速川の瀬→大海原）
          </text>
          <text x="485" y="280" textAnchor="middle" fill="#b3dcff" fontSize="12" fontWeight="700">
            速開都比売（潮の八百会・加加呑）
          </text>
        </g>
      )}

      {safeDay === 5 && (
        <g>
          <rect width="640" height="300" fill={`url(#${uid}-sky-abyss)`} />
          {/* Left: 気吹戸主 & wind portal */}
          <circle cx="115" cy="130" r="64" fill={`url(#${uid}-glow)`} className="myth-pulse" />
          <MythHalo cx={115} cy={130} r={48} stroke="#85e0ff" />
          <DeitySilhouette x={115} y={132} scale={0.78} veilColor="#87ebff" />

          {/* Sweeping wind ribbons toward 根国・底国 */}
          <path d="M 150 135 Q 230 105 310 175" fill="none" stroke="#9be8ff" strokeWidth="4" className="myth-flow" />
          <path d="M 148 158 Q 225 145 298 205" fill="none" stroke="#c2f2ff" strokeWidth="3" className="myth-flow" />

          {/* Center: 速佐須良比売 dissolving fragments */}
          <circle cx="330" cy="168" r="68" fill={`url(#${uid}-glow)`} className="myth-pulse" />
          <MythHalo cx={330} cy={168} r={48} stroke="#e3b8ff" reverse />
          <DeitySilhouette x={330} y={170} scale={0.76} veilColor="#d7a8ff" delayed />
          {[295, 315, 348, 368].map((px, i) => (
            <circle key={px} cx={px} cy={225 - i * 10} r="3.5" fill="#f7c8ff" className="myth-spark" />
          ))}

          {/* Right: Golden Dawn of 白す */}
          <circle cx="535" cy="115" r="88" fill={`url(#${uid}-glow)`} className="myth-pulse" />
          <MythHalo cx={535} cy={115} r={54} stroke="#ffe38c" />
          <text x="535" y="122" textAnchor="middle" fill="#fff7d1" fontSize="24" fontWeight="700" fontFamily="serif">
            白す
          </text>

          <text x="115" y="255" textAnchor="middle" fill="#a8edff" fontSize="11.5" fontWeight="700">
            気吹戸主（気吹き放つ）
          </text>
          <text x="330" y="268" textAnchor="middle" fill="#ebc7ff" fontSize="11.5" fontWeight="700">
            速佐須良比売（根国・底国で消失）
          </text>
          <text x="535" y="212" textAnchor="middle" fill="#ffe7a6" fontSize="11.5" fontWeight="700">
            八百万神等共に聞こし食せと白す
          </text>
        </g>
      )}

      {safeDay === 6 && (
        <g>
          <rect width="640" height="300" fill={`url(#${uid}-sky-night)`} />
          {/* 4-Realm Cosmology Flow */}
          <path
            d="M 95 75 C 210 60 210 155 315 150 C 420 145 430 225 545 210"
            fill="none"
            stroke="#ffe28c"
            strokeWidth="4"
            strokeOpacity="0.65"
            className="myth-flow"
          />
          {/* Traveling orb of light along the S-curve */}
          <circle r="7" fill="#fff9d6">
            <animateMotion dur="5s" repeatCount="indefinite">
              <mpath href={`#${uid}-cosmo-path`} />
            </animateMotion>
          </circle>

          {[
            { cx: 95, cy: 75, title: '① 高天原', sub: '神議り・降臨', color: '#ffe594' },
            { cx: 235, cy: 132, title: '② 瑞の御殿', sub: '罪・太祝詞事', color: '#9cf5c5' },
            { cx: 385, cy: 168, title: '③ 傾聴と4比喩', sub: '瀬織津・速開都', color: '#8de5ff' },
            { cx: 540, cy: 210, title: '④ 根国・結び', sub: '気吹戸・速佐須良・白す', color: '#e5b8ff' },
          ].map((node, i) => (
            <g key={node.title}>
              <MythHalo cx={node.cx} cy={node.cy} r={34} stroke={node.color} reverse={i % 2 === 1} />
              <circle cx={node.cx} cy={node.cy} r="22" fill="#0d1836" stroke={node.color} strokeWidth="2" />
              <text x={node.cx} y={node.cy + 4} textAnchor="middle" fill={node.color} fontSize="10.5" fontWeight="700">
                {node.title}
              </text>
              <text x={node.cx} y={node.cy + 48} textAnchor="middle" fill="#eef4ff" fontSize="11">
                {node.sub}
              </text>
            </g>
          ))}
        </g>
      )}

      {safeDay === 7 && (
        <g>
          <rect width="640" height="300" fill={`url(#${uid}-sky-night)`} />
          <circle cx="320" cy="145" r="145" fill={`url(#${uid}-glow)`} className="myth-pulse" />
          <MythHalo cx={320} cy={145} r={112} stroke="#ffe694" />
          <MythHalo cx={320} cy={145} r={86} stroke="#9edcff" reverse />
          <MythHalo cx={320} cy={145} r={58} stroke="#fff3c4" />

          {/* Grand Sacred Torii Gate */}
          <g>
            <path d="M 218 112 Q 320 98 422 112 L 414 126 Q 320 116 226 126 Z" fill={`url(#${uid}-gold)`} />
            <rect x="242" y="138" width="156" height="10" rx="2" fill="#f2c44d" />
            <rect x="258" y="122" width="14" height="142" fill="#b5382a" stroke="#f2c44d" strokeWidth="1.5" />
            <rect x="368" y="122" width="14" height="142" fill="#b5382a" stroke="#f2c44d" strokeWidth="1.5" />
          </g>

          {/* Celebratory ascending stardust */}
          {[180, 220, 290, 350, 420, 460].map((sx, idx) => (
            <circle
              key={sx}
              cx={sx}
              cy={240 - (idx % 3) * 32}
              r="3.5"
              fill="#fff5bd"
              className="myth-spark"
            />
          ))}

          <text x="320" y="198" textAnchor="middle" fill="#fff7d6" fontSize="18" fontWeight="700" fontFamily="serif">
            大祓詞 完全暗唱
          </text>
          <text x="320" y="222" textAnchor="middle" fill="#ffe099" fontSize="12">
            天つ神・国つ神・八百万神等共に聞こし食せと白す
          </text>
        </g>
      )}

      <FrameOverlay
        uid={uid}
        compact={compact}
        label={`Day ${safeDay} ・ ${DAY_MYTH_META[safeDay].motif}`}
      />
    </svg>
  );
}
