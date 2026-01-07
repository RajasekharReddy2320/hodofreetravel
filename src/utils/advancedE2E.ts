/**
 * Advanced End-to-End Encryption using X25519 ECDH + AES-256-GCM + HKDF
 * - X25519 for key exchange (more efficient than RSA)
 * - HKDF for secure key derivation
 * - AES-256-GCM for authenticated encryption
 * - Keys stored encrypted in Supabase Secure Vault
 */

import { supabase } from '@/integrations/supabase/client';
import { encryptValue, decryptValue } from './encryption';

// Algorithm constants
const AES_ALGORITHM = 'AES-GCM';
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const HKDF_INFO = new TextEncoder().encode('TraviLink-E2E-v2');

// Key storage identifiers in vault
const VAULT_PRIVATE_KEY = 'e2e_x25519_private';
const VAULT_PUBLIC_KEY = 'e2e_x25519_public';
const VAULT_IDENTITY_KEY = 'e2e_identity';

// Type definitions
interface EncryptedMessage {
  ciphertext: string;
  iv: string;
  ephemeralPublicKey: string;
  salt: string;
  version: number;
}

interface StoredKeys {
  publicKey: string | null;
  privateKey: CryptoKey | null;
}

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// Convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate a new X25519 key pair
export async function generateX25519KeyPair(): Promise<CryptoKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'X25519' },
    true,
    ['deriveBits']
  ) as CryptoKeyPair;
  return keyPair;
}

// Export public key to base64
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', publicKey);
  return arrayBufferToBase64(exported);
}

// Import public key from base64
export async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(publicKeyBase64);
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'X25519' },
    true,
    []
  );
}

// Import private key from base64
async function importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(privateKeyBase64);
  return await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'X25519' },
    false,
    ['deriveBits']
  );
}

// HKDF key derivation
async function deriveSymmetricKey(
  sharedSecret: ArrayBuffer,
  salt: ArrayBuffer
): Promise<CryptoKey> {
  // Import shared secret as HKDF key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    'HKDF',
    false,
    ['deriveKey']
  );

  // Derive AES-GCM key using HKDF
  return await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt,
      info: HKDF_INFO
    },
    keyMaterial,
    { name: AES_ALGORITHM, length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// Store keys encrypted in the Secure Vault (database)
export async function storeKeysInVault(
  userId: string,
  publicKey: string,
  privateKeyBase64: string
): Promise<void> {
  try {
    // Encrypt the private key using the user's vault encryption
    const encryptedPrivate = await encryptValue(privateKeyBase64, userId);
    
    // Store in localStorage as backup
    localStorage.setItem(VAULT_PRIVATE_KEY, encryptedPrivate);
    localStorage.setItem(VAULT_PUBLIC_KEY, publicKey);
    
    // Also store the identity key hash for verification
    const identityHash = await generateIdentityHash(publicKey);
    localStorage.setItem(VAULT_IDENTITY_KEY, identityHash);

    console.log('E2E keys stored in encrypted vault');
  } catch (error) {
    console.error('Failed to store keys in vault:', error);
    throw new Error('Failed to secure encryption keys');
  }
}

// Retrieve keys from vault
export async function getKeysFromVault(userId: string): Promise<StoredKeys> {
  try {
    const encryptedPrivate = localStorage.getItem(VAULT_PRIVATE_KEY);
    const publicKey = localStorage.getItem(VAULT_PUBLIC_KEY);
    
    if (!encryptedPrivate || !publicKey) {
      return { publicKey: null, privateKey: null };
    }

    // Decrypt the private key
    const privateKeyBase64 = await decryptValue(encryptedPrivate, userId);
    
    if (!privateKeyBase64) {
      return { publicKey: null, privateKey: null };
    }

    // Import the private key
    const privateKey = await importPrivateKey(privateKeyBase64);
    
    return { publicKey, privateKey };
  } catch (error) {
    console.error('Failed to retrieve keys from vault:', error);
    return { publicKey: null, privateKey: null };
  }
}

// Generate identity hash for key verification
async function generateIdentityHash(publicKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(publicKey);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hash).slice(0, 16);
}

// Check if keys exist
export function hasStoredKeys(): boolean {
  return !!(localStorage.getItem(VAULT_PRIVATE_KEY) && localStorage.getItem(VAULT_PUBLIC_KEY));
}

// Get identity fingerprint for UI verification
export async function getIdentityFingerprint(): Promise<string | null> {
  const publicKey = localStorage.getItem(VAULT_PUBLIC_KEY);
  if (!publicKey) return null;
  return await generateIdentityHash(publicKey);
}

// Initialize E2E encryption for a user
export async function initializeAdvancedE2E(userId: string): Promise<string> {
  // Check if we already have keys
  if (hasStoredKeys()) {
    const keys = await getKeysFromVault(userId);
    if (keys.publicKey && keys.privateKey) {
      // Update profile with public key
      await supabase
        .from('profiles')
        .update({ public_key: keys.publicKey })
        .eq('id', userId);
      return keys.publicKey;
    }
  }

  // Generate new key pair
  const keyPair = await generateX25519KeyPair();
  
  // Export keys
  const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);
  const privateKeyExported = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const privateKeyBase64 = arrayBufferToBase64(privateKeyExported);

  // Store in vault
  await storeKeysInVault(userId, publicKeyBase64, privateKeyBase64);

  // Update profile with public key
  await supabase
    .from('profiles')
    .update({ public_key: publicKeyBase64 })
    .eq('id', userId);

  return publicKeyBase64;
}

// Encrypt a message using ECDH + AES-GCM
export async function encryptMessageAdvanced(
  message: string,
  recipientPublicKeyBase64: string
): Promise<EncryptedMessage> {
  try {
    // Generate ephemeral key pair for this message (perfect forward secrecy)
    const ephemeralKeyPair = await generateX25519KeyPair();
    const ephemeralPublicKeyBase64 = await exportPublicKey(ephemeralKeyPair.publicKey);

    // Import recipient's public key
    const recipientPublicKey = await importPublicKey(recipientPublicKeyBase64);

    // Perform ECDH key exchange
    const sharedSecret = await crypto.subtle.deriveBits(
      { name: 'X25519', public: recipientPublicKey },
      ephemeralKeyPair.privateKey,
      256
    );

    // Generate random salt for HKDF
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

    // Derive symmetric key using HKDF
    const symmetricKey = await deriveSymmetricKey(sharedSecret, salt.buffer as ArrayBuffer);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Encrypt the message
    const encoder = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: AES_ALGORITHM, iv },
      symmetricKey,
      encoder.encode(message)
    );

    return {
      ciphertext: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
      ephemeralPublicKey: ephemeralPublicKeyBase64,
      salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
      version: 2 // Version 2 = X25519/HKDF/AES-GCM
    };
  } catch (error) {
    console.error('Advanced encryption failed:', error);
    throw new Error('Failed to encrypt message');
  }
}

// Decrypt a message using ECDH + AES-GCM
export async function decryptMessageAdvanced(
  encryptedMessage: EncryptedMessage,
  recipientPrivateKey: CryptoKey
): Promise<string> {
  try {
    // Import ephemeral public key
    const ephemeralPublicKey = await importPublicKey(encryptedMessage.ephemeralPublicKey);

    // Perform ECDH key exchange
    const sharedSecret = await crypto.subtle.deriveBits(
      { name: 'X25519', public: ephemeralPublicKey },
      recipientPrivateKey,
      256
    );

    // Get salt
    const salt = base64ToArrayBuffer(encryptedMessage.salt);

    // Derive symmetric key using HKDF
    const symmetricKey = await deriveSymmetricKey(sharedSecret, salt);

    // Get IV
    const iv = new Uint8Array(base64ToArrayBuffer(encryptedMessage.iv));

    // Decrypt
    const ciphertext = base64ToArrayBuffer(encryptedMessage.ciphertext);
    const plaintext = await crypto.subtle.decrypt(
      { name: AES_ALGORITHM, iv },
      symmetricKey,
      ciphertext
    );

    return new TextDecoder().decode(plaintext);
  } catch (error) {
    console.error('Advanced decryption failed:', error);
    throw new Error('Failed to decrypt message');
  }
}

// Encrypt for database storage (combines all fields into JSON)
export async function encryptForStorage(
  message: string,
  recipientPublicKeyBase64: string
): Promise<{ content: string; iv: string; encrypted_key: string; is_encrypted: boolean }> {
  const encrypted = await encryptMessageAdvanced(message, recipientPublicKeyBase64);
  
  // Pack metadata into encrypted_key field as JSON
  const metadata = JSON.stringify({
    ephemeralPublicKey: encrypted.ephemeralPublicKey,
    salt: encrypted.salt,
    version: encrypted.version
  });

  return {
    content: encrypted.ciphertext,
    iv: encrypted.iv,
    encrypted_key: metadata,
    is_encrypted: true
  };
}

// Decrypt from database storage
export async function decryptFromStorage(
  content: string,
  iv: string,
  encryptedKey: string,
  userId: string
): Promise<string> {
  try {
    // Get user's private key
    const keys = await getKeysFromVault(userId);
    if (!keys.privateKey) {
      throw new Error('No private key available');
    }

    // Parse metadata
    const metadata = JSON.parse(encryptedKey);
    
    const encryptedMessage: EncryptedMessage = {
      ciphertext: content,
      iv: iv,
      ephemeralPublicKey: metadata.ephemeralPublicKey,
      salt: metadata.salt,
      version: metadata.version || 2
    };

    return await decryptMessageAdvanced(encryptedMessage, keys.privateKey);
  } catch (error) {
    console.error('Decryption from storage failed:', error);
    throw error;
  }
}

// Clear all stored keys (for logout)
export function clearAdvancedE2EKeys(): void {
  localStorage.removeItem(VAULT_PRIVATE_KEY);
  localStorage.removeItem(VAULT_PUBLIC_KEY);
  localStorage.removeItem(VAULT_IDENTITY_KEY);
}

// Verify key fingerprint matches expected
export async function verifyKeyFingerprint(
  publicKeyBase64: string,
  expectedFingerprint: string
): Promise<boolean> {
  const fingerprint = await generateIdentityHash(publicKeyBase64);
  return fingerprint === expectedFingerprint;
}

// Legacy fallback - use old RSA-based encryption if X25519 not supported
export { 
  encryptMessage, 
  decryptMessage, 
  initializeE2E,
  hasKeyPairSync 
} from './e2eEncryption';
