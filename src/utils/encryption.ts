const SECRET_KEY_TEXT = import.meta.env.VITE_ENCRYPTION_KEY || "fallback-key-32-chars-long!!!";
const SECRET_IV_TEXT = import.meta.env.VITE_ENCRYPTION_IV || "fallback-iv-16ch";

// Convert string key to 32-byte array (AES-256)
const getKeyBytes = (): Uint8Array<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const src = encoder.encode(SECRET_KEY_TEXT);
  const key = new Uint8Array(32);
  key.set(src.slice(0, 32));
  return key as Uint8Array<ArrayBuffer>;
};

// Convert string IV to 16-byte array
const getIvBytes = (): Uint8Array<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const src = encoder.encode(SECRET_IV_TEXT);
  const iv = new Uint8Array(16);
  iv.set(src.slice(0, 16));
  return iv as Uint8Array<ArrayBuffer>;
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
    
    const binaryString = atob(encrypted);
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
