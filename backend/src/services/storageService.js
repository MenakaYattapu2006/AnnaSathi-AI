// Supabase Storage & Document Verification Service
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_UPLOADS_DIR = path.join(__dirname, '../../uploads');

let supabaseClient = null;

if (config.supabase.url && config.supabase.serviceRoleKey) {
  supabaseClient = createClient(config.supabase.url, config.supabase.serviceRoleKey);
} else {
  console.warn('⚠️  Supabase Storage credentials not set. Uploads will be stored locally in backend/uploads/.');
  if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
    fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
  }
}

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_DOC_MIMES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Upload a food donation image or NGO verification document.
 * @param {Object} file - Multer file object
 * @param {'donation_images' | 'ngo_documents'} folder
 * @param {string} entityId - Donation ID or NGO ID
 */
export async function uploadFile(file, folder, entityId) {
  if (!file) throw new Error('No file provided for upload.');

  const isDoc = folder === 'ngo_documents';
  const allowedMimes = isDoc ? ALLOWED_DOC_MIMES : ALLOWED_IMAGE_MIMES;
  const maxSize = isDoc ? MAX_DOC_SIZE : MAX_IMAGE_SIZE;

  if (!allowedMimes.has(file.mimetype)) {
    throw new Error(`Invalid file format: ${file.mimetype}. Allowed: ${Array.from(allowedMimes).join(', ')}`);
  }

  if (file.size > maxSize) {
    throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit (${maxSize / 1024 / 1024}MB).`);
  }

  const extension = path.extname(file.originalname) || (file.mimetype.includes('pdf') ? '.pdf' : '.jpg');
  const safeFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${extension}`;
  const storagePath = `${folder}/${entityId}/${safeFilename}`;

  // Supabase Storage Upload
  if (supabaseClient) {
    const { data, error } = await supabaseClient.storage
      .from(config.supabase.storageBucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    return {
      storagePath: data.path,
      mimetype: file.mimetype,
      size: file.size,
      filename: file.originalname,
    };
  }

  // Local filesystem fallback
  const localTargetFolder = path.join(LOCAL_UPLOADS_DIR, folder, entityId);
  if (!fs.existsSync(localTargetFolder)) {
    fs.mkdirSync(localTargetFolder, { recursive: true });
  }
  const localFilePath = path.join(localTargetFolder, safeFilename);
  fs.writeFileSync(localFilePath, file.buffer);

  return {
    storagePath,
    mimetype: file.mimetype,
    size: file.size,
    filename: file.originalname,
    local: true,
  };
}

/**
 * Generate a short-lived signed URL for private document inspection.
 * @param {string} storagePath
 * @param {number} expiresInSeconds - Default 15 minutes (900s)
 */
export async function getSignedUrl(storagePath, expiresInSeconds = 900) {
  if (supabaseClient) {
    const { data, error } = await supabaseClient.storage
      .from(config.supabase.storageBucket)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error) {
      console.error('Supabase signed URL error:', error);
      throw new Error('Failed to generate document access link.');
    }
    return data.signedUrl;
  }

  // Local URL for development inspection
  return `${config.frontendUrl.replace(':5173', ':5000')}/api/v1/files/${storagePath}`;
}
