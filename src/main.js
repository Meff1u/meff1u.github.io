import constants from "./libs/constants.js";
import projects from "./libs/projects.json";
import communities from "./libs/communities.json";
import socials from "./libs/socials.json";
import packagejson from "../package.json";
import "./styles/main.css";

const app = {};

app.constants = constants;
app.package = packagejson;
app.content = { projects, communities, socials };

async function loadUtils() {
    const utilFiles = import.meta.glob("./utils/*.js", { eager: true });
    const utilPromises = Object.values(utilFiles).map((file) => file.execute(app));
    return Promise.all(utilPromises);
}

async function init() {
    try {
        await loadUtils();
        app.renderAbout();
        app.renderProjects();
        app.renderCommunities();
        app.renderSocials();
        app.bindReveal();
        app.connectDiscord();
        app.log(`meff1u.github.io v${app.package.version} ready`);
    } catch (error) {
        console.error("Error during initialization:", error);
    }
}

init();
