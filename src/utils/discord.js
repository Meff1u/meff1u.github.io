export const execute = async (app) => {
    const elements = {};
    let presence = null;
    let heartbeat = null;

    // Activity images come in several prefixed formats depending on where the asset is hosted
    const getAssetUrl = function (applicationId, asset) {
        if (!asset) return null;
        if (asset.startsWith("mp:external/")) return `https://media.discordapp.net/external/${asset.slice(12)}`;
        if (asset.startsWith("mp:")) return `https://media.discordapp.net/${asset.slice(3)}`;
        if (asset.startsWith("spotify:")) return `https://i.scdn.co/image/${asset.slice(8)}`;
        if (applicationId) return `${app.constants.discordCdn}/app-assets/${applicationId}/${asset}.png?size=128`;
        return null;
    };

    const getVisibleActivities = () => (presence?.activities ?? []).filter((activity) => activity.type !== 4).slice(0, app.constants.lanyard.maxActivities);

    app.connectDiscord = function () {
        for (const id of [
            "favicon",
            "hero-avatar",
            "discord-avatar",
            "discord-dot",
            "discord-name",
            "discord-username",
            "discord-tag",
            "discord-led",
            "discord-status",
            "discord-custom",
            "discord-activities",
            "discord-profile",
        ]) {
            elements[id] = document.getElementById(id);
        }

        elements["discord-profile"].href = `https://discord.com/users/${app.constants.discordId}`;

        app.fetchPresence();
        app.openPresenceSocket();
        setInterval(() => app.updateActivityTimes(), 1000);
    };

    // REST call fills the card right away, the socket takes over for live updates
    app.fetchPresence = async function () {
        try {
            const response = await fetch(`${app.constants.lanyard.restUrl}${app.constants.discordId}`);
            const json = await response.json();
            if (json.success) app.setPresence(json.data);
        } catch (error) {
            if (!presence) elements["discord-status"].textContent = "no connection";
            console.error("Failed to fetch Discord presence:", error);
        }
    };

    app.openPresenceSocket = function () {
        const socket = new WebSocket(app.constants.lanyard.socketUrl);

        socket.addEventListener("message", (event) => {
            const message = JSON.parse(event.data);

            if (message.op === 1) {
                heartbeat = setInterval(() => socket.readyState === WebSocket.OPEN && socket.send(JSON.stringify({ op: 3 })), message.d.heartbeat_interval);
                socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: app.constants.discordId } }));
            } else if (message.op === 0 && ["INIT_STATE", "PRESENCE_UPDATE"].includes(message.t)) {
                app.setPresence(message.d);
            }
        });

        socket.addEventListener("close", () => {
            clearInterval(heartbeat);
            setTimeout(() => app.openPresenceSocket(), app.constants.lanyard.reconnectDelay);
        });
    };

    app.setPresence = function (data) {
        presence = data;
        app.renderDiscordUser();
        app.renderDiscordStatus();
        app.renderActivities();
    };

    app.renderDiscordUser = function () {
        const user = presence.discord_user ?? {};
        const { discordCdn } = app.constants;

        // public/avatar.png is a saved copy for the first paint and link previews; once Lanyard answers, the live Discord avatar takes over
        if (user.avatar) {
            const extension = user.avatar.startsWith("a_") ? "gif" : "png";
            const avatarUrl = `${discordCdn}/avatars/${user.id}/${user.avatar}.${extension}?size=256`;
            // Favicons don't animate in most browsers, so it always uses the static png
            const faviconUrl = `${discordCdn}/avatars/${user.id}/${user.avatar}.png?size=64`;
            if (elements["discord-avatar"].src !== avatarUrl) elements["discord-avatar"].src = avatarUrl;
            if (elements["hero-avatar"].src !== avatarUrl) elements["hero-avatar"].src = avatarUrl;
            if (elements.favicon.href !== faviconUrl) elements.favicon.href = faviconUrl;
        }

        // The decoration image is created on demand so there is never an <img> without a source in the page
        const decoration = user.avatar_decoration_data?.asset;
        let decorationImage = document.getElementById("discord-decoration");
        if (decoration && !decorationImage) {
            decorationImage = app.createElement("img", { id: "discord-decoration", className: "decoration", alt: "" });
            elements["discord-avatar"].after(decorationImage);
        }
        if (decoration) decorationImage.src = `${discordCdn}/avatar-decoration-presets/${decoration}.png?size=160&passthrough=true`;
        else decorationImage?.remove();

        elements["discord-name"].textContent = user.global_name || user.display_name || user.username || "Meffiu";
        elements["discord-username"].textContent = user.username || "meffiu";

        const guild = user.primary_guild;
        elements["discord-tag"].hidden = !(guild?.tag && guild.identity_enabled);
        if (!elements["discord-tag"].hidden) {
            const badge = guild.badge
                ? app.createElement("img", { src: `${discordCdn}/guild-tag-badges/${guild.identity_guild_id}/${guild.badge}.png?size=24`, alt: "" })
                : null;
            elements["discord-tag"].replaceChildren(...[badge, guild.tag].filter(Boolean));
        }
    };

    app.renderDiscordStatus = function () {
        const status = presence.discord_status || "offline";
        const devices = [presence.active_on_discord_desktop && "desktop", presence.active_on_discord_mobile && "mobile", presence.active_on_discord_web && "web"].filter(
            Boolean,
        );

        elements["discord-dot"].className = `status-dot ${status}`;
        elements["discord-led"].className = `led ${status}`;
        elements["discord-status"].textContent = app.constants.statusLabels[status] + (devices.length ? ` · ${devices.join(", ")}` : "");

        const custom = presence.activities?.find((activity) => activity.type === 4);
        if (!custom?.state && !custom?.emoji) return elements["discord-custom"].replaceChildren();

        const emoji = custom.emoji;
        const emojiElement = emoji?.id
            ? app.createElement("img", { src: `${app.constants.discordCdn}/emojis/${emoji.id}.${emoji.animated ? "gif" : "png"}?size=48`, alt: emoji.name })
            : emoji
              ? app.createElement("span", { textContent: emoji.name })
              : null;

        elements["discord-custom"].replaceChildren(
            app.createElement("div", { className: "custom-status" }, [emojiElement, app.createElement("span", { textContent: custom.state ?? "" })]),
        );
    };

    app.renderActivities = function () {
        const activities = getVisibleActivities();

        if (!activities.length) {
            const offline = presence.discord_status === "offline";
            elements["discord-activities"].replaceChildren(
                app.createElement("div", {
                    className: "activities-empty",
                    textContent: offline ? "💤 Offline right now, check back later" : "Nothing running. Probably writing code 👾",
                }),
            );
            return;
        }

        elements["discord-activities"].replaceChildren(...activities.map((activity, index) => app.createActivity(activity, index)));
        app.updateActivityTimes();
    };

    app.createActivity = function (activity, index) {
        const spotify = activity.id === "spotify:1" && presence.spotify;
        const largeImage = spotify ? spotify.album_art_url : getAssetUrl(activity.application_id, activity.assets?.large_image);
        const smallImage = spotify ? null : getAssetUrl(activity.application_id, activity.assets?.small_image);
        const placeholder = () => app.createElement("div", { className: "art-placeholder", textContent: activity.type === 2 ? "🎧" : "🎮" });

        const art = app.createElement("div", { className: "activity-art" });
        if (largeImage) {
            const image = app.createElement("img", { className: "large", src: largeImage, alt: "" });
            image.addEventListener("error", () => image.replaceWith(placeholder()), { once: true });
            art.append(image);
            if (smallImage) art.append(app.createElement("img", { className: "small", src: smallImage, alt: "" }));
        } else {
            art.append(placeholder());
        }

        const label = spotify ? "Listening to Spotify" : `${app.constants.activityLabels[activity.type] ?? ""}${activity.type === 2 ? ` ${activity.name}` : ""}`;
        const lines = spotify ? [`by ${spotify.artist.replace(/;/g, ",")}`, `on ${spotify.album}`] : [activity.details, activity.state];
        const { start, end } = activity.timestamps ?? {};

        let time = null;
        if (start && end) {
            time = app.createElement("div", {}, [
                app.createElement("div", { className: "bar" }, [app.createElement("i", { id: `activity-bar-${index}` })]),
                app.createElement("div", { className: "times" }, [
                    app.createElement("span", { id: `activity-current-${index}` }),
                    app.createElement("span", { textContent: app.formatDuration(end - start) }),
                ]),
            ]);
        } else if (start) {
            time = app.createElement("div", { className: "line", id: `activity-elapsed-${index}` });
        }

        const info = app.createElement("div", { className: "activity-info" }, [
            app.createElement("div", { className: "activity-kind", textContent: label }),
            app.createElement("strong", { textContent: spotify ? spotify.song : activity.name }),
            ...lines.filter(Boolean).map((line) => app.createElement("div", { className: "line", textContent: line })),
            time,
        ]);

        if (spotify?.track_id) return app.createLink(`https://open.spotify.com/track/${spotify.track_id}`, { className: "activity" }, [art, info]);
        return app.createElement("div", { className: "activity" }, [art, info]);
    };

    // Runs every second, so it only touches the time elements instead of re-rendering the activities
    app.updateActivityTimes = function () {
        const now = Date.now();

        getVisibleActivities().forEach((activity, index) => {
            const { start, end } = activity.timestamps ?? {};

            if (start && end) {
                const progress = Math.min(1, (now - start) / (end - start));
                const bar = document.getElementById(`activity-bar-${index}`);
                const current = document.getElementById(`activity-current-${index}`);
                if (bar) bar.style.width = `${progress * 100}%`;
                if (current) current.textContent = app.formatDuration(Math.min(now, end) - start);
            } else if (start) {
                const elapsed = document.getElementById(`activity-elapsed-${index}`);
                if (elapsed) elapsed.textContent = `⏱ ${app.formatDuration(now - start)} elapsed`;
            }
        });
    };
};
