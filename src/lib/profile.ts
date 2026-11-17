export function profileImage(value: string | null | undefined): string {
  if (!value || value.length > 2000) return "";
  if (/^\/uploads\/[a-f0-9-]+\.(png|jpg|gif|webp)$/i.test(value)) return value;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !/\.(png|jpe?g|gif|webp)$/i.test(url.pathname)
    )
      return "";
    return value;
  } catch {
    return "";
  }
}
