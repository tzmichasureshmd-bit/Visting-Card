// Simple nanoid-compatible random string for CommonJS
export function nanoid(size = 21): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const bytes = require("crypto").randomBytes(size);
  for (let i = 0; i < size; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}
