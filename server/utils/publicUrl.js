export const getClientBaseUrl = () => {
  const baseUrl = process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL;

  if (!baseUrl) {
    throw new Error("CLIENT_URL ou RENDER_EXTERNAL_URL doit être configuré.");
  }

  return baseUrl.replace(/\/+$/, "");
};
