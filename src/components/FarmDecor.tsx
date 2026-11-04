export function FarmDecor() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="sun" cx="18%" cy="8%" r="18%">
          <stop offset="0%" stopColor="#fff7c2" />
          <stop offset="100%" stopColor="#9ed8ff" stopOpacity="0" />
        </radialGradient>
        <pattern id="decor-grass" patternUnits="userSpaceOnUse" width="256" height="256">
          <image href="/farm/tex/grass.jpg" width="256" height="256" preserveAspectRatio="none" />
        </pattern>
        <radialGradient id="grass-fade">
          <stop offset="0.55" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="grass-mask">
          <ellipse cx="760" cy="470" rx="760" ry="380" fill="url(#grass-fade)" />
        </mask>
      </defs>
      <rect width="1400" height="800" fill="url(#sun)" />
      <rect width="1400" height="800" fill="url(#decor-grass)" opacity="0.55" mask="url(#grass-mask)" />
    </svg>
  );
}
