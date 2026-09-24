export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function fromHex(hex: string, length?: number): Uint8Array {
  if (
    !/^(?:[a-f0-9]{2})+$/i.test(hex) ||
    (length !== undefined && hex.length !== length * 2)
  ) {
    throw new Error(
      "Invalid hexadecimal value. Check the original file and try again.",
    );
  }
  return Uint8Array.from(hex.match(/.{2}/g)!, (byte) =>
    Number.parseInt(byte, 16),
  );
}

export const randomSecret = () => crypto.getRandomValues(new Uint8Array(32));
export const shortId = (value: string) =>
  value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
