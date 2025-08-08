// Web Crypto helpers for AES-GCM with PBKDF2 key derivation

function strToUint8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}
function uint8ToStr(buf: ArrayBuffer): string {
  return new TextDecoder().decode(buf);
}
function toB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function fromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    strToUint8(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptString(plaintext: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    strToUint8(plaintext)
  );
  return {
    salt: toB64(salt),
    iv: toB64(iv),
    data: toB64(cipher),
  };
}

export async function decryptString(enc: { salt: string; iv: string; data: string }, password: string): Promise<string> {
  const salt = fromB64(enc.salt);
  const iv = fromB64(enc.iv);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    fromB64(enc.data)
  );
  return uint8ToStr(decrypted);
}
