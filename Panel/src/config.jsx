export default {
    api: {
        API_URL:
            import.meta.env.MODE === "production"
                ? "https://demo.TransitOps.org"
                : "http://localhost:7002",
    },
};
