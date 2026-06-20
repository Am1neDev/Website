import { createClient } from '@supabase/supabase-js';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || 'course-files';

// Use Supabase Storage when configured, otherwise fall back to the local disk
// so the app runs with zero configuration in development.
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
let supabase = null;

if (useSupabase) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
} else {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const storageBackend = useSupabase ? 'supabase' : 'local';

function makeKey(originalName) {
  const ext = path.extname(originalName);
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
}

// Stores a Buffer and returns the storage key to persist in the DB.
export async function saveFile(buffer, originalName, mime) {
  const key = makeKey(originalName);
  if (useSupabase) {
    const { error } = await supabase.storage.from(BUCKET).upload(key, buffer, {
      contentType: mime || 'application/octet-stream',
      upsert: false,
    });
    if (error) {
      const e = new Error(
        `Storage upload to Supabase bucket "${BUCKET}" failed: ${error.message}. ` +
          'Check that the bucket exists and SUPABASE_SERVICE_KEY is the service_role key.'
      );
      e.status = 502;
      e.expose = true;
      throw e;
    }
  } else {
    await fs.promises.writeFile(path.join(UPLOAD_DIR, key), buffer);
  }
  return key;
}

// Returns the file contents as a Buffer, or null if it no longer exists.
export async function readFile(key) {
  if (useSupabase) {
    const { data, error } = await supabase.storage.from(BUCKET).download(key);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  }
  const filePath = path.join(UPLOAD_DIR, key);
  if (!fs.existsSync(filePath)) return null;
  return fs.promises.readFile(filePath);
}

export async function deleteFile(key) {
  try {
    if (useSupabase) {
      await supabase.storage.from(BUCKET).remove([key]);
    } else {
      await fs.promises.rm(path.join(UPLOAD_DIR, key), { force: true });
    }
  } catch {
    // best-effort cleanup; never block the request on storage deletion
  }
}
