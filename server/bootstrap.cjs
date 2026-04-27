(async () => {
  try {
    await import("./src/index.js");
  } catch (error) {
    console.error("Failed to start Express app:", error);
    process.exit(1);
  }
})();
