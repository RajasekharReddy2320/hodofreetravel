// End-to-End Encryption utilities using RSA-OAEP + AES-GCM
// Each user has a key pair. Messages are encrypted with recipient's public key.

import { encryptValue, decryptValue } from './encryption';

const RSA_ALGORITHM = {
  name: 'RSA-OAEP',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256',
};

const AES_ALGORITHM = 'AES-GCM';
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12;

// Storage keys for encrypted vault storage
const PRIVATE_KEY_VAULT = 'e2e_private_key_vault';
const PUBLIC_KEY_VAULT = 'e2e_public_key_vault';

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

// Store keys securely - encrypted in localStorage using user's vault encryption
export async function storeKeyPair(publicKey: string, privateKey: string, userId: string): Promise<void> {
  try {
    // Encrypt private key with user's vault encryption key
    const encryptedPrivateKey = await encryptValue(privateKey, userId);
    const encryptedPublicKey = await encryptValue(publicKey, userId);
    
    localStorage.setItem(PRIVATE_KEY_VAULT, encryptedPrivateKey);
    localStorage.setItem(PUBLIC_KEY_VAULT, encryptedPublicKey);
  } catch (error) {
    console.error('Failed to encrypt keys for storage:', error);
    // Fallback to unencrypted storage
    localStorage.setItem(PRIVATE_KEY_VAULT, privateKey);
    localStorage.setItem(PUBLIC_KEY_VAULT, publicKey);
  }
}

// Get stored key pair - decrypted from vault
export async function getStoredKeyPair(userId: string): Promise<{ publicKey: string | null; privateKey: string | null }> {
  const encryptedPublicKey = localStorage.getItem(PUBLIC_KEY_VAULT);
  const encryptedPrivateKey = localStorage.getItem(PRIVATE_KEY_VAULT);
  
  if (!encryptedPublicKey || !encryptedPrivateKey) {
    return { publicKey: null, privateKey: null };
  }

  try {
    const publicKey = await decryptValue(encryptedPublicKey, userId);
    const privateKey = await decryptValue(encryptedPrivateKey, userId);
    return { publicKey, privateKey };
  } catch (error) {
    // Might be legacy unencrypted keys
    return { publicKey: encryptedPublicKey, privateKey: encryptedPrivateKey };
  }
}

// Sync version for checking existence
export function hasKeyPairSync(): boolean {
  const publicKey = localStorage.getItem(PUBLIC_KEY_VAULT);
  const privateKey = localStorage.getItem(PRIVATE_KEY_VAULT);
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

// Encrypt a message for multiple recipients (group chat)
export async function encryptMessageForGroup(
  message: string,
  recipientPublicKeys: { [userId: string]: string }
): Promise<{ encryptedMessage: string; encryptedKeys: { [userId: string]: string }; iv: string }> {
  try {
    // Generate a random AES key for this message
    const aesKey = await generateAESKey();
    const aesKeyBuffer = await crypto.subtle.exportKey('raw', aesKey);

    // Encrypt the AES key for each recipient
    const encryptedKeys: { [userId: string]: string } = {};
    
    for (const [userId, publicKeyBase64] of Object.entries(recipientPublicKeys)) {
      try {
        const recipientPublicKey = await importPublicKey(publicKeyBase64);
        const encryptedKeyBuffer = await crypto.subtle.encrypt(
          { name: 'RSA-OAEP' },
          recipientPublicKey,
          aesKeyBuffer
        );
        encryptedKeys[userId] = btoa(String.fromCharCode(...new Uint8Array(encryptedKeyBuffer)));
      } catch (error) {
        console.error(`Failed to encrypt key for user ${userId}:`, error);
      }
    }

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
      encryptedKeys,
      iv: btoa(String.fromCharCode(...iv)),
    };
  } catch (error) {
    console.error('E2E Group Encryption error:', error);
    throw new Error('Failed to encrypt message for group');
  }
}

// Decrypt a message using user's private key
export async function decryptMessage(
  encryptedMessage: string,
  encryptedKey: string,
  ivBase64: string,
  userId: string,
  privateKeyBase64?: string
): Promise<string> {
  try {
    // Get private key from storage if not provided
    let privateKey = privateKeyBase64;
    if (!privateKey) {
      const keyPair = await getStoredKeyPair(userId);
      privateKey = keyPair.privateKey;
    }
    
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

// Decrypt a group message using user's encrypted key from the keys object
export async function decryptGroupMessage(
  encryptedMessage: string,
  encryptedKeys: { [userId: string]: string },
  ivBase64: string,
  userId: string
): Promise<string> {
  const encryptedKey = encryptedKeys[userId];
  if (!encryptedKey) {
    throw new Error('No encrypted key found for this user');
  }
  return decryptMessage(encryptedMessage, encryptedKey, ivBase64, userId);
}

// Initialize E2E encryption for a user (generate and store keys)
export async function initializeE2E(userId: string): Promise<string> {
  if (hasKeyPairSync()) {
    const keyPair = await getStoredKeyPair(userId);
    if (keyPair.publicKey) {
      return keyPair.publicKey;
    }
  }

  const { publicKey, privateKey } = await generateKeyPair();
  await storeKeyPair(publicKey, privateKey, userId);
  return publicKey;
}

// Clear stored keys (for logout or account deletion)
export function clearE2EKeys(): void {
  localStorage.removeItem(PUBLIC_KEY_VAULT);
  localStorage.removeItem(PRIVATE_KEY_VAULT);
  // Also clear old storage keys if they exist
  localStorage.removeItem('e2e_private_key');
  localStorage.removeItem('e2e_public_key');
}
