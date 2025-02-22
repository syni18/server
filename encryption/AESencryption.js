import crypto from 'crypto';

// Generate a 256-bit key and initialization vector (IV)
const generateKeyAndIv = () => {
  return {
    key: crypto.randomBytes(32), // 32 bytes = 256 bits
    iv: crypto.randomBytes(16), // 16 bytes for AES IV
  };
};
/**
 * Encrypts a given text using AES-256-CBC.
 * @param {string} plainText - The text to encrypt.
 * @returns {string} The encrypted text in base64 format.
 */
export function encryptionText(plainText) {  
  const { key, iv } = generateKeyAndIv();  
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  let encrypted = cipher.update(plainText, "utf-8", "base64");
  encrypted += cipher.final("base64");

  return {
    encrypt: `${iv.toString("base64")}:${encrypted}`,
    secret: {
      iv: iv,
      key: key,
    },
  };
}

/**
 * Decrypts an encrypted text using AES-256-CBC.
 * @param {string} encryptedText - The text to decrypt (base64 format).
 * @returns {string} The decrypted plain text.
 */
export function decryptionText(encryptedText, key) {
  if (!Buffer.isBuffer(key)) {
    throw new Error("key must be a Buffer");
  }

  // Split the encrypted text into IV and encrypted data
  const [ivBase64, encryptedData] = encryptedText.split(":");
  const ivBuffer = Buffer.from(ivBase64, "base64");

  // Create the decipher
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, ivBuffer);

  // Perform decryption
  let decrypted = decipher.update(encryptedData, "base64", "utf-8");
  decrypted += decipher.final("utf-8");

  return decrypted;
}
