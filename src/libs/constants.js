export default {
    discordId: "334411435633541121",
    age: 23,
    lanyard: {
        restUrl: "https://api.lanyard.rest/v1/users/",
        socketUrl: "wss://api.lanyard.rest/socket",
        reconnectDelay: 5000,
        maxActivities: 3,
    },
    discordCdn: "https://cdn.discordapp.com",
    statusLabels: {
        online: "Online",
        idle: "Idle",
        dnd: "Do not disturb",
        offline: "Offline",
    },
    // Discord activity types; 4 (custom status) is rendered separately
    activityLabels: {
        0: "Playing",
        1: "Streaming",
        2: "Listening to",
        3: "Watching",
        5: "Competing in",
    },
    likes: [
        { emoji: "🎌", label: "Anime" },
        { emoji: "🎮", label: "Gaming" },
        { emoji: "🤖", label: "Tinkering with bots" },
        { emoji: "🧠", label: "AI & new toys" },
    ],
    stack: ["JavaScript", "TypeScript", "Node.js", "discord.js", "Next.js", "Express", "MongoDB", "PostgreSQL", "Tailwind", "Three.js", "Docker", "Python"],
};
