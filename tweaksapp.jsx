const TWEAK_DEFAULTS = {
  palette: "broadsheet",
  accent: "#6b3018",
  basemap: "parchment",
  wash: 38,
  ledgerTone: "match",
};

const THEMES = {
  broadsheet: {
    label: "Victorian Broadsheet",
    basemap: "parchment",
    washRGB: "42,28,12",
    vars: {
      "--vellum": "#e8dcc4", "--vellum-2": "#ddd0b4", "--vellum-3": "#cfc09e", "--vellum-4": "#bfac84",
      "--edge": "#9e8a62", "--edge-soft": "#b8a47a",
      "--ink": "#2a1f10", "--ink-2": "#4a3620", "--faded": "#8a7450", "--gilt": "#b8962e",
      "--bg-top": "#ece3cc", "--map-bg": "#cfc09e",
      "--tile-base-filter": "sepia(0.65) saturate(0.9) hue-rotate(10deg) brightness(0.95) contrast(0.92)",
    },
  },
  vellum: {
    label: "Aged Vellum",
    basemap: "parchment",
    washRGB: "56,41,26",
    vars: {
      "--vellum": "#e9dcbe", "--vellum-2": "#e3d4b0", "--vellum-3": "#d9c89e", "--vellum-4": "#cdb988",
      "--edge": "#b79a68", "--edge-soft": "#c9b288",
      "--ink": "#38291a", "--ink-2": "#5a4427", "--faded": "#8a7148", "--gilt": "#a67c33",
      "--bg-top": "#efe3c8", "--map-bg": "#d9c89e",
      "--tile-base-filter": "sepia(0.5) saturate(1.35) brightness(0.98) contrast(0.9) hue-rotate(-8deg)",
    },
  },
  admiralty: {
    label: "Admiralty Sea-Chart",
    basemap: "parchment",
    washRGB: "20,40,46",
    vars: {
      "--vellum": "#dfe6e4", "--vellum-2": "#d4dddc", "--vellum-3": "#c4d0d0", "--vellum-4": "#b1c1c2",
      "--edge": "#8ea5a4", "--edge-soft": "#aec0bf",
      "--ink": "#1d2f37", "--ink-2": "#38525b", "--faded": "#6c8589", "--gilt": "#9c8a52",
      "--bg-top": "#e9efee", "--map-bg": "#c4d0d0",
      "--tile-base-filter": "sepia(0.4) saturate(1.15) hue-rotate(150deg) brightness(1.0) contrast(0.9)",
    },
  },
  bone: {
    label: "Bone & Sepia",
    basemap: "parchment",
    washRGB: "70,52,32",
    vars: {
      "--vellum": "#f1e9d8", "--vellum-2": "#ece2cd", "--vellum-3": "#e2d6bc", "--vellum-4": "#d6c8a8",
      "--edge": "#c2ad84", "--edge-soft": "#d6c59e",
      "--ink": "#4a3826", "--ink-2": "#6e573a", "--faded": "#9c8560", "--gilt": "#b08a44",
      "--bg-top": "#f7f0e1", "--map-bg": "#e2d6bc",
      "--tile-base-filter": "sepia(0.55) saturate(0.7) brightness(1.08) contrast(0.85)",
    },
  },
  midnight: {
    label: "Midnight Celestial",
    basemap: "slate",
    washRGB: "0,0,0",
    vars: {
      "--vellum": "#222633", "--vellum-2": "#1c2029", "--vellum-3": "#15171f", "--vellum-4": "#2c3140",
      "--edge": "#454d61", "--edge-soft": "#586176",
      "--ink": "#ece3cf", "--ink-2": "#cabd9d", "--faded": "#8f8569", "--gilt": "#d8b260",
      "--bg-top": "#0f1118", "--map-bg": "#15171f",
      "--tile-base-filter": "brightness(0.85) contrast(1.05) saturate(0.7) sepia(0.2) hue-rotate(185deg)",
    },
  },
  sage: {
    label: "Sage Botanical",
    basemap: "parchment",
    washRGB: "40,46,28",
    vars: {
      "--vellum": "#e5e4d3", "--vellum-2": "#dddcc7", "--vellum-3": "#cecdb2", "--vellum-4": "#bcbd9c",
      "--edge": "#9aa080", "--edge-soft": "#b7bb9e",
      "--ink": "#2f3527", "--ink-2": "#4e563e", "--faded": "#7c8366", "--gilt": "#a89149",
      "--bg-top": "#edecde", "--map-bg": "#cecdb2",
      "--tile-base-filter": "sepia(0.45) saturate(0.95) hue-rotate(55deg) brightness(1.02) contrast(0.9)",
    },
  },
};

const PALETTE_OPTS = Object.entries(THEMES).map(([k, v]) => ({ value: k, label: v.label }));
const ACCENTS = ["#6b3018", "#8c3b2b", "#2f6d72", "#3a4f7a", "#9c6b1e"];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const prevPalette = React.useRef(t.palette);

  React.useEffect(() => {
    const th = THEMES[t.palette] || THEMES.broadsheet;
    const root = document.documentElement;
    Object.entries(th.vars).forEach(([k, v]) => root.style.setProperty(k, v));

    root.style.setProperty("--rubric", t.accent);
    root.style.setProperty("--rubric-dk", `color-mix(in srgb, ${t.accent} 76%, #000)`);
    root.style.setProperty("--wash", `rgba(${th.washRGB}, ${t.wash / 100})`);

    const tone = {
      match:   ["var(--vellum-2)", "var(--vellum-3)"],
      darker:  ["color-mix(in srgb, var(--vellum-2) 84%, #000)", "color-mix(in srgb, var(--vellum-3) 80%, #000)"],
      lighter: ["color-mix(in srgb, var(--vellum-2) 80%, #fff)", "color-mix(in srgb, var(--vellum-3) 82%, #fff)"],
    }[t.ledgerTone] || ["var(--vellum-2)", "var(--vellum-3)"];
    root.style.setProperty("--ledger-top", tone[0]);
    root.style.setProperty("--ledger-bot", tone[1]);

    if (prevPalette.current !== t.palette) {
      prevPalette.current = t.palette;
      if (t.basemap !== th.basemap) setTweak("basemap", th.basemap);
    }
  }, [t.palette, t.accent, t.wash, t.ledgerTone]);

  React.useEffect(() => {
    if (window.__setBasemap) window.__setBasemap(t.basemap);
  }, [t.basemap]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Palette" />
      <TweakSelect label="Atlas palette" value={t.palette}
        options={PALETTE_OPTS}
        onChange={(v) => setTweak("palette", v)} />
      <TweakColor label="Accent" value={t.accent} options={ACCENTS}
        onChange={(v) => setTweak("accent", v)} />

      <TweakSection label="Map" />
      <TweakRadio label="Basemap" value={t.basemap}
        options={[{ value: "parchment", label: "Paper" }, { value: "slate", label: "Slate" }, { value: "voyager", label: "Colour" }]}
        onChange={(v) => setTweak("basemap", v)} />
      <TweakSlider label="Parchment wash" value={t.wash} min={0} max={60} unit="%"
        onChange={(v) => setTweak("wash", v)} />

      <TweakSection label="Navbar" />
      <TweakRadio label="Ledger tone" value={t.ledgerTone}
        options={[{ value: "match", label: "Match" }, { value: "darker", label: "Darker" }, { value: "lighter", label: "Lighter" }]}
        onChange={(v) => setTweak("ledgerTone", v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("tweaks-root")).render(<App />);
