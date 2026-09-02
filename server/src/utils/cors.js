export function isPrivateOriginAllowed(origin, env = process.env) {
  if (/^http:\/\/localhost:\d+$/.test(origin)) return true;

  const configured = [
    env.APP_URL,
    env.FRONTEND_URL,
    ...(env.CORS_ORIGINS || "").split(","),
  ];

  return configured.some((value) => {
    if (!value?.trim()) return false;
    try {
      const url = new URL(value.trim());
      return ["http:", "https:"].includes(url.protocol) && url.origin === origin;
    } catch {
      return false;
    }
  });
}
