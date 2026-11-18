export const execute = async (app) => {
    const createTags = (items) => items.map((item) => app.createElement("span", { className: "tag", textContent: item }));

    app.renderAbout = function () {
        document.getElementById("age").textContent = app.constants.age;
        document.getElementById("year").textContent = new Date().getFullYear();

        document.getElementById("likes").replaceChildren(
            ...app.constants.likes.map((like) =>
                app.createElement("div", { className: "like" }, [
                    app.createElement("span", { className: "like-emoji", textContent: like.emoji }),
                    app.createElement("span", { textContent: like.label }),
                ]),
            ),
        );

        document.getElementById("stack").replaceChildren(...createTags(app.constants.stack));
    };

    app.renderProjects = function () {
        document.getElementById("projects-list").replaceChildren(...app.content.projects.map((project) => app.createProjectCard(project)));
    };

    app.createProjectCard = function (project) {
        const links = [];
        if (project.live) {
            const label = new URL(project.live).hostname.replace(/^www\./, "");
            links.push(app.createLink(project.live, { className: "link live" }, [app.createIcon("web"), label.endsWith("github.io") ? "Demo" : label]));
        }
        if (project.repo) links.push(app.createLink(project.repo, { className: "link" }, [app.createIcon("github"), "Code"]));

        // Projects built with someone else get a visible credit next to the title, not hidden in the description
        const partner = project.partner
            ? app.createElement("div", { className: "partner" }, [
                  "made together with ",
                  app.createLink(project.partner.url, { textContent: project.partner.name }),
              ])
            : null;

        return app.createElement("article", { className: `panel project reveal${project.featured ? " featured" : ""}` }, [
            app.createElement("div", { className: "project-top" }, [
                app.createElement("div", { className: "project-icon", textContent: project.emoji }),
                app.createElement("div", {}, [
                    app.createElement("h3", { textContent: project.name }),
                    app.createElement("div", { className: "kind", textContent: project.kind }),
                ]),
            ]),
            partner,
            app.createElement("p", { textContent: project.description }),
            app.createElement("div", { className: "stack" }, createTags(project.stack)),
            app.createElement("div", { className: "links" }, links),
        ]);
    };

    app.renderCommunities = function () {
        document.getElementById("communities-list").replaceChildren(
            ...app.content.communities.map((community) =>
                app.createLink(community.url, { className: "panel community reveal" }, [
                    app.createElement("span", { className: "role", textContent: community.role }),
                    app.createElement("strong", { textContent: community.name }),
                    app.createElement("small", { textContent: community.description }),
                    app.createElement("span", { className: "go", textContent: community.cta }),
                ]),
            ),
        );
    };

    app.renderSocials = function () {
        document.getElementById("socials-list").replaceChildren(
            ...app.content.socials.map((social) => {
                const link = app.createLink(social.url, { className: "panel social reveal", ariaLabel: social.name }, [
                    app.createIcon(social.icon),
                    app.createElement("span", {}, [
                        app.createElement("b", { textContent: social.name }),
                        app.createElement("small", { textContent: social.handle }),
                    ]),
                ]);
                link.style.setProperty("--color", social.color);
                return link;
            }),
        );
    };
};
