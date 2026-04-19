/**
 * ============================================================================
 * CRYPTO SERVICE — Encriptación simétrica AES-256-GCM
 * ============================================================================
 *
 * Usado para cifrar tokens sensibles (GitHub) antes de persistirlos en la BD.
 *
 * Formato del valor cifrado almacenado en BD:
 *   base64(iv):base64(ciphertext):base64(authTag)
 *
 * Configuración:
 *   ENCRYPTION_KEY — 32 bytes en hex (64 chars). Si no existe, se usa modo
 *   transparente (sin cifrado) con un warning para no romper deploys.
 */

import crypto from 'crypto';
import { logger } from './logger.service';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_ENV = process.env['ENCRYPTION_KEY'] ?? '';

function getKey(): Buffer | null {
  if (!KEY_ENV || KEY_ENV.length !== 64) {
    return null;
  }
  try {
    return Buffer.from(KEY_ENV, 'hex');
  } catch {
    return null;
  }
}

const KEY = getKey();

if (!KEY) {
  const isProduction = process.env['NODE_ENV'] === 'production';
  const message =
    'ENCRYPTION_KEY no configurada o inválida. ' +
    'Define ENCRYPTION_KEY con 64 caracteres hex para habilitar el cifrado.';

  if (isProduction) {
    // En producción no queremos degradar a "sin cifrado" para secretos.
    throw new Error(message);
  }

  logger.warn(`⚠️  ${message} Los tokens se almacenan sin cifrar en development/test.`);
}

/**
 * Cifra un texto plano con AES-256-GCM.
 * Si no hay clave configurada, devuelve el texto sin modificar.
 */
export function encrypt(plaintext: string): string {
  if (!KEY) return plaintext;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), encrypted.toString('base64'), authTag.toString('base64')].join(':');
}

/**
 * Descifra un valor cifrado con AES-256-GCM.
 * Si el valor no tiene el formato cifrado esperado (o no hay clave), lo devuelve tal cual.
 */
export function decrypt(ciphertext: string): string {
  if (!KEY) return ciphertext;
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    // Valor antiguo sin cifrar — devolver raw (backward-compat)
    return ciphertext;
  }
  try {
    const [ivB64, encB64, tagB64] = parts as [string, string, string];
    const iv = Buffer.from(ivB64, 'base64');
    const encrypted = Buffer.from(encB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted) + decipher.final('utf8');
  } catch {
    // Si falla el descifrado (e.g. token fue guardado sin cifrar), devolver raw
    logger.warn('decrypt: fallo al descifrar, devolviendo valor raw');
    return ciphertext;
  }
}
