const { readFileSync, writeFileSync } = require("node:fs");
const { Resvg } = require("@resvg/resvg-js");

const width = 1200;
const height = 630;
const output = "./public/og-image.png";
const horizon = 430;
const sun = { x: 880, y: 300, r: 220 };
const avatar = `data:image/png;base64,${readFileSync("./public/avatar.png").toString("base64")}`;

// Stripes cut out of the lower half of the sun, getting thicker towards the horizon like on the site
const stripes = [
    [0.5, 0.04],
    [0.62, 0.05],
    [0.73, 0.06],
    [0.84, 0.07],
    [0.94, 0.08],
]
    .map(([offset, size]) => `<rect x="0" y="${sun.y - sun.r + offset * sun.r * 2}" width="${width}" height="${size * sun.r}" fill="#000"/>`)
    .join("");

// Perspective floor: horizontal lines get denser towards the horizon, vertical lines meet at the vanishing point
const floorLines = [];
for (let i = 1; i <= 12; i++) {
    const y = horizon + Math.pow(i / 12, 2.2) * (height - horizon);
    floorLines.push(`<line x1="0" y1="${y.toFixed(1)}" x2="${width}" y2="${y.toFixed(1)}"/>`);
}
for (let i = -14; i <= 14; i++) {
    const x = sun.x + i * 140;
    floorLines.push(`<line x1="${sun.x}" y1="${horizon}" x2="${x}" y2="${height}"/>`);
}

const mountains = [
    [0, 430],
    [0, 395],
    [70, 370],
    [140, 400],
    [230, 350],
    [330, 405],
    [420, 375],
    [520, 415],
    [660, 415],
    [720, 380],
    [790, 405],
    [900, 340],
    [1000, 400],
    [1090, 360],
    [1200, 390],
    [1200, 430],
]
    .map((point) => point.join(","))
    .join(" ");

let chipX = 80;
const chips = ["Web apps", "Discord bots", "Tools"]
    .map((label) => {
        const chipWidth = label.length * 12.2 + 36;
        const svg = `<rect x="${chipX}" y="372" width="${chipWidth}" height="40" rx="20" fill="#1a0830" fill-opacity="0.85" stroke="#be6eff" stroke-opacity="0.45"/><text x="${chipX + chipWidth / 2}" y="398" text-anchor="middle" font-family="Space Mono" font-size="19" font-weight="700" fill="#efe3ff">${label}</text>`;
        chipX += chipWidth + 12;
        return svg;
    })
    .join("");

const stars = Array.from({ length: 70 }, (_, i) => {
    // Deterministic pseudo-random positions so every build gives the same image
    const x = (i * 197.3) % width;
    const y = (i * 83.7) % (horizon - 60);
    const r = i % 7 === 0 ? 1.6 : 0.9;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#fff" fill-opacity="${0.35 + (i % 5) * 0.12}"/>`;
}).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
<linearGradient id="sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#040008"/><stop offset="0.45" stop-color="#0c0219"/><stop offset="0.68" stop-color="#1c0633"/><stop offset="0.69" stop-color="#0b0214"/><stop offset="1" stop-color="#080110"/></linearGradient>
<radialGradient id="haze" cx="${sun.x}" cy="${horizon}" r="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff2d95" stop-opacity="0.22"/><stop offset="1" stop-color="#ff2d95" stop-opacity="0"/></radialGradient>
<linearGradient id="sun" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffc96b"/><stop offset="0.45" stop-color="#ff3fb4"/><stop offset="0.9" stop-color="#9b3dff"/></linearGradient>
<linearGradient id="ring" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ff3fb4"/><stop offset="0.5" stop-color="#8b3dff"/><stop offset="1" stop-color="#3ff3ff"/></linearGradient>
<linearGradient id="floorFade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#080110" stop-opacity="1"/><stop offset="0.25" stop-color="#080110" stop-opacity="0"/></linearGradient>
<linearGradient id="textFade" x1="0" x2="1"><stop offset="0.35" stop-color="#080110" stop-opacity="0.85"/><stop offset="0.62" stop-color="#080110" stop-opacity="0"/></linearGradient>
<mask id="sunMask"><rect width="${width}" height="${height}" fill="#fff"/>${stripes}</mask>
<clipPath id="avatarClip"><circle cx="${sun.x}" cy="${sun.y - 30}" r="96"/></clipPath>
<filter id="glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="9" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>
</defs>
<rect width="${width}" height="${height}" fill="url(#sky)"/>
${stars}
<rect width="${width}" height="${height}" fill="url(#haze)"/>
<circle cx="${sun.x}" cy="${sun.y}" r="${sun.r + 20}" fill="#ff3fb4" fill-opacity="0.35" filter="url(#softGlow)"/>
<circle cx="${sun.x}" cy="${sun.y}" r="${sun.r}" fill="url(#sun)" mask="url(#sunMask)"/>
<polygon points="${mountains}" fill="#0f0320" stroke="#ff3fb4" stroke-opacity="0.6" stroke-width="1.5"/>
<rect x="0" y="${horizon}" width="${width}" height="${height - horizon}" fill="#080110"/>
<g stroke="#ff3fb4" stroke-opacity="0.75" stroke-width="2">${floorLines.join("")}</g>
<rect x="0" y="${horizon}" width="${width}" height="${height - horizon}" fill="url(#floorFade)"/>
<line x1="0" y1="${horizon}" x2="${width}" y2="${horizon}" stroke="#ff3fb4" stroke-width="2.5" filter="url(#glow)"/>
<rect width="${width}" height="${height}" fill="url(#textFade)"/>
<circle cx="${sun.x}" cy="${sun.y - 30}" r="106" fill="url(#ring)" filter="url(#glow)"/>
<circle cx="${sun.x}" cy="${sun.y - 30}" r="100" fill="#080110"/>
<image href="${avatar}" xlink:href="${avatar}" x="${sun.x - 96}" y="${sun.y - 126}" width="192" height="192" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>
<text x="72" y="290" font-family="Monoton" font-size="132" letter-spacing="4" fill="#ffe6f7" filter="url(#glow)">MEFFIU</text>
<text x="82" y="345" font-family="Space Mono" font-size="24" fill="#c8b3e6">Bio, projects &amp; live Discord status</text>
${chips}
<text x="82" y="585" font-family="Orbitron" font-size="22" font-weight="700" letter-spacing="3" fill="#ff3fb4" filter="url(#glow)">meff1u.github.io</text>
</svg>`;

const png = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: {
        loadSystemFonts: false,
        fontFiles: [
            "./scripts/fonts/Monoton-Regular.ttf",
            "./scripts/fonts/Orbitron.ttf",
            "./scripts/fonts/SpaceMono-Regular.ttf",
            "./scripts/fonts/SpaceMono-Bold.ttf",
        ],
        defaultFontFamily: "Space Mono",
    },
})
    .render()
    .asPng();
writeFileSync(output, png);

console.log(`Saved ${output} (${(png.length / 1024).toFixed(0)} KB)`);
