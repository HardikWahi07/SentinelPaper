
import crypto from 'crypto';
import QRCode from 'qrcode';

/**
 * Sentinel Forensic Service
 * 
 * Handles cryptographic watermarking and QR code generation.
 * Replaces the need for an external FastAPI service by providing 
 * high-performance forensic utilities in the Next.js server layer.
 */

export type ForensicSignature = {
  hash: string;
  qrDataUri: string;
  timestamp: string;
};

/**
 * Generates a unique forensic watermark and scannable QR code for an exam batch.
 */
export async function generateForensicWatermark(batchId: string, centerId: string): Promise<ForensicSignature> {
  const timestamp = new Date().toISOString();
  
  // Generate a SHA-256 hash representing the "paper integrity fingerprint"
  const rawData = `${batchId}:${centerId}:${timestamp}`;
  const hash = crypto
    .createHash('sha256')
    .update(rawData)
    .digest('hex');

  // Create a minimal payload for the QR code to keep it dense and easy to scan
  const qrPayload = {
    b: batchId.substring(0, 8), // Batch prefix
    c: centerId,                // Center ID
    h: hash.substring(0, 12),   // Signature fragment
    t: Date.now()               // Epoch timestamp
  };

  // Generate the QR code as a Base64 Data URI
  const qrDataUri = await QRCode.toDataURL(JSON.stringify(qrPayload), {
    errorCorrectionLevel: 'H', // High error correction for printed forensics
    margin: 1,
    width: 256,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  return {
    hash,
    qrDataUri,
    timestamp
  };
}

/**
 * Verifies if a provided hash matches the calculated signature for a batch.
 */
export function verifyWatermark(batchId: string, centerId: string, timestamp: string, providedHash: string): boolean {
  const rawData = `${batchId}:${centerId}:${timestamp}`;
  const calculatedHash = crypto
    .createHash('sha256')
    .update(rawData)
    .digest('hex');
    
  return calculatedHash === providedHash;
}
