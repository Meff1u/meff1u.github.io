import { siDiscord, siGithub, siGooglechrome, siKick, siMyanimelist, siPaypal, siSpotify, siSteam, siTiktok, siTwitch, siX, siYoutube, siInstagram } from "simple-icons";

const icons = {
    discord: siDiscord,
    github: siGithub,
    web: siGooglechrome,
    kick: siKick,
    myanimelist: siMyanimelist,
    paypal: siPaypal,
    spotify: siSpotify,
    steam: siSteam,
    tiktok: siTiktok,
    twitch: siTwitch,
    x: siX,
    youtube: siYoutube,
    instagram: siInstagram,
};

export const execute = async (app) => {
    // Inline SVG instead of <img> so the icon inherits currentColor and can glow in the brand color
    app.createIcon = function (name) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("aria-hidden", "true");
        svg.classList.add("icon");
        path.setAttribute("d", icons[name]?.path ?? "");
        svg.append(path);
        return svg;
    };

    app.getIconUrl = function (name) {
        return `data:image/svg+xml,${encodeURIComponent(icons[name]?.svg ?? "")}`;
    };
};
