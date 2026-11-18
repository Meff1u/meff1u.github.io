export const execute = async (app) => {
    app.log = function (message) {
        console.log(`[${new Date().toLocaleString("en-GB")}] ${message}`);
    };

    // Formats milliseconds as m:ss, or h:mm:ss once it passes an hour
    app.formatDuration = function (ms) {
        const total = Math.floor(Math.max(0, ms) / 1000);
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const seconds = String(total % 60).padStart(2, "0");
        return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
    };

    // Shorthand for the Object.assign(document.createElement(...)) pattern, with optional children
    app.createElement = function (tag, props = {}, children = []) {
        const element = Object.assign(document.createElement(tag), props);
        element.append(...children.filter(Boolean));
        return element;
    };

    app.createLink = function (href, props = {}, children = []) {
        return app.createElement("a", { href, target: "_blank", rel: "noopener", ...props }, children);
    };
};
