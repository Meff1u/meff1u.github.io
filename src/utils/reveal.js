export const execute = async (app) => {
    // Fades cards in once they scroll into view; each element is only revealed once
    app.bindReveal = function () {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.12 },
        );

        for (const element of document.querySelectorAll(".reveal")) observer.observe(element);
    };
};
