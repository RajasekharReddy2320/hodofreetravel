// Client-side encryption utilities using AES-GCM
// Data is encrypted before being sent to the database

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

// Derive a consistent encryption key from user ID
async function deriveKey(userId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userId),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('travexa-vault-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt a string value
export async function encryptValue(value: string, userId: string): Promise<string> {
  if (!value) return '';
  
  try {
    const key = await deriveKey(userId);
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encoder.encode(value)
    );

    // Combine IV and encrypted data, then base64 encode
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Decrypt an encrypted string value
export async function decryptValue(encryptedValue: string, userId: string): Promise<string> {
  if (!encryptedValue) return '';
  
  try {
    const key = await deriveKey(userId);
    
    // Decode base64 and separate IV from data
    const combined = new Uint8Array(
      atob(encryptedValue).split('').map(c => c.charCodeAt(0))
    );
    
    const iv = combined.slice(0, IV_LENGTH);
    const data = combined.slice(IV_LENGTH);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    // Return empty string if decryption fails (could be unencrypted legacy data)
    return '';
  }
}

// Encrypt an object with multiple fields
export async function encryptObject(
  obj: Record<string, string>,
  userId: string
): Promise<Record<string, string>> {
  const encrypted: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    encrypted[key] = value ? await encryptValue(value, userId) : '';
  }
  
  return encrypted;
}

// Decrypt an object with multiple fields
export async function decryptObject(
  obj: Record<string, string>,
  userId: string
): Promise<Record<string, string>> {
  const decrypted: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    decrypted[key] = value ? await decryptValue(value, userId) : '';
  }
  
  return decrypted;
}
