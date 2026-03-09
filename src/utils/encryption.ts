const SECRET_KEY_TEXT = import.meta.env.VITE_ENCRYPTION_KEY || "fallback-key-32-chars-long!!!";
const SECRET_IV_TEXT = import.meta.env.VITE_ENCRYPTION_IV || "fallback-iv-16ch";

const normalizeBase64 = (value: string): string => {
  if (!value) return "";
  const sanitized = value
    .trim()
    .replace(/ /g, "+")
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padding = sanitized.length % 4;
  if (padding === 0) return sanitized;
  if (padding === 2) return sanitized + "==";
  if (padding === 3) return sanitized + "=";
  return sanitized;
};

// Decode Base64 key if provided (backend uses Base64 encoded keys)
const decodeBase64 = (encoded: string): Uint8Array => {
  try {
    const binary = atob(normalizeBase64(encoded));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    // If not valid Base64, treat as plain text
    const encoder = new TextEncoder();
    return encoder.encode(encoded);
  }
};

// Convert string key to 32-byte array (AES-256)
const getKeyBytes = (): Uint8Array<ArrayBuffer> => {
  // Try Base64 decode first, then fall back to text encoding
  let keyBytes = decodeBase64(SECRET_KEY_TEXT);
  
  // Ensure exactly 32 bytes for AES-256
  if (keyBytes.length < 32) {
    // Pad with zeros or slice to 32
    const padded = new Uint8Array(32);
    padded.set(keyBytes.slice(0, 32));
    return padded as Uint8Array<ArrayBuffer>;
  }
  return keyBytes.slice(0, 32) as Uint8Array<ArrayBuffer>;
};

// Convert string IV to 16-byte array
const getIvBytes = (): Uint8Array<ArrayBuffer> => {
  // Try Base64 decode first, then fall back to text encoding
  let ivBytes = decodeBase64(SECRET_IV_TEXT);
  
  // Ensure exactly 16 bytes
  if (ivBytes.length < 16) {
    const padded = new Uint8Array(16);
    padded.set(ivBytes.slice(0, 16));
    return padded as Uint8Array<ArrayBuffer>;
  }
  return ivBytes.slice(0, 16) as Uint8Array<ArrayBuffer>;
};

// Import key for Web Crypto API
const importKey = async (): Promise<CryptoKey> => {
  const keyBytes = getKeyBytes();
  return await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-CBC' },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encrypt = async (text: string): Promise<string> => {
  if (!text) return '';
  
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    const key = await importKey();
    const iv = getIvBytes();
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-CBC',
        iv: iv.buffer as ArrayBuffer
      },
      key,
      data.buffer as ArrayBuffer
    );
    
    const uint8Array = new Uint8Array(encrypted);
    const binaryString = Array.from(uint8Array)
      .map(byte => String.fromCharCode(byte))
      .join('');
    
    return btoa(binaryString);
  } catch (error) {
    console.error('Encryption failed:', error);
    return '';
  }
};

export const decrypt = async (encrypted: string): Promise<string> => {
  if (!encrypted) return '';
  
  try {
    const key = await importKey();
    const iv = getIvBytes();
    
    const binaryString = atob(normalizeBase64(encrypted));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-CBC',
        iv: iv.buffer as ArrayBuffer
      },
      key,
      bytes.buffer as ArrayBuffer
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
};
