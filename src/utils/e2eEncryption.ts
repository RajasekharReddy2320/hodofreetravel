// End-to-End Encryption utilities using RSA-OAEP + AES-GCM
// Each user has a key pair. Messages are encrypted with recipient's public key.

const RSA_ALGORITHM = {
  name: 'RSA-OAEP',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256',
};

const AES_ALGORITHM = 'AES-GCM';
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12;

// Storage keys
const PRIVATE_KEY_STORAGE = 'e2e_private_key';
const PUBLIC_KEY_STORAGE = 'e2e_public_key';

// Generate a new RSA key pair for the user
export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = await crypto.subtle.generateKey(
    RSA_ALGORITHM,
    true,
    ['encrypt', 'decrypt']
  );

  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKey = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
  const privateKey = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));

  return { publicKey, privateKey };
}

// Store keys securely in localStorage (encrypted with user password would be better)
export function storeKeyPair(publicKey: string, privateKey: string): void {
  localStorage.setItem(PUBLIC_KEY_STORAGE, publicKey);
  localStorage.setItem(PRIVATE_KEY_STORAGE, privateKey);
}

// Get stored key pair
export function getStoredKeyPair(): { publicKey: string | null; privateKey: string | null } {
  return {
    publicKey: localStorage.getItem(PUBLIC_KEY_STORAGE),
    privateKey: localStorage.getItem(PRIVATE_KEY_STORAGE),
  };
}

// Check if user has a key pair
export function hasKeyPair(): boolean {
  const { publicKey, privateKey } = getStoredKeyPair();
  return !!(publicKey && privateKey);
}

// Import a public key from base64 string
async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  const binaryString = atob(publicKeyBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    'spki',
    bytes,
    RSA_ALGORITHM,
    false,
    ['encrypt']
  );
}

// Import a private key from base64 string
async function importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
  const binaryString = atob(privateKeyBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    'pkcs8',
    bytes,
    RSA_ALGORITHM,
    false,
    ['decrypt']
  );
}

// Generate a random AES key for message encryption
async function generateAESKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: AES_ALGORITHM, length: AES_KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt a message for a recipient using hybrid encryption (RSA + AES)
export async function encryptMessage(
  message: string,
  recipientPublicKeyBase64: string
): Promise<{ encryptedMessage: string; encryptedKey: string; iv: string }> {
  try {
    // Import recipient's public key
    const recipientPublicKey = await importPublicKey(recipientPublicKeyBase64);

    // Generate a random AES key for this message
    const aesKey = await generateAESKey();
    const aesKeyBuffer = await crypto.subtle.exportKey('raw', aesKey);

    // Encrypt the AES key with recipient's RSA public key
    const encryptedKeyBuffer = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      recipientPublicKey,
      aesKeyBuffer
    );

    // Generate IV for AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Encrypt the message with AES
    const encoder = new TextEncoder();
    const encryptedMessageBuffer = await crypto.subtle.encrypt(
      { name: AES_ALGORITHM, iv },
      aesKey,
      encoder.encode(message)
    );

    return {
      encryptedMessage: btoa(String.fromCharCode(...new Uint8Array(encryptedMessageBuffer))),
      encryptedKey: btoa(String.fromCharCode(...new Uint8Array(encryptedKeyBuffer))),
      iv: btoa(String.fromCharCode(...iv)),
    };
  } catch (error) {
    console.error('E2E Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

// Decrypt a message using user's private key
export async function decryptMessage(
  encryptedMessage: string,
  encryptedKey: string,
  ivBase64: string,
  privateKeyBase64?: string
): Promise<string> {
  try {
    // Get private key from storage if not provided
    const privateKey = privateKeyBase64 || getStoredKeyPair().privateKey;
    if (!privateKey) {
      throw new Error('No private key available');
    }

    // Import private key
    const cryptoPrivateKey = await importPrivateKey(privateKey);

    // Decode the encrypted AES key
    const encryptedKeyBuffer = new Uint8Array(
      atob(encryptedKey).split('').map(c => c.charCodeAt(0))
    );

    // Decrypt the AES key with RSA private key
    const aesKeyBuffer = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      cryptoPrivateKey,
      encryptedKeyBuffer
    );

    // Import the decrypted AES key
    const aesKey = await crypto.subtle.importKey(
      'raw',
      aesKeyBuffer,
      { name: AES_ALGORITHM, length: AES_KEY_LENGTH },
      false,
      ['decrypt']
    );

    // Decode IV and encrypted message
    const iv = new Uint8Array(atob(ivBase64).split('').map(c => c.charCodeAt(0)));
    const encryptedMessageBuffer = new Uint8Array(
      atob(encryptedMessage).split('').map(c => c.charCodeAt(0))
    );

    // Decrypt the message
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: AES_ALGORITHM, iv },
      aesKey,
      encryptedMessageBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('E2E Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
}

// Initialize E2E encryption for a user (generate and store keys)
export async function initializeE2E(): Promise<string> {
  if (hasKeyPair()) {
    const { publicKey } = getStoredKeyPair();
    return publicKey!;
  }

  const { publicKey, privateKey } = await generateKeyPair();
  storeKeyPair(publicKey, privateKey);
  return publicKey;
}

// Clear stored keys (for logout or account deletion)
export function clearE2EKeys(): void {
  localStorage.removeItem(PUBLIC_KEY_STORAGE);
  localStorage.removeItem(PRIVATE_KEY_STORAGE);
}
