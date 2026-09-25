/**
 * scripts/migrate-passcode-hash.mjs — One-Time Passcode Hash Migration
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE-TIME manual migration. NOT part of the app's runtime — run once via:
 *   node scripts/migrate-passcode-hash.mjs
 * from the `web/` directory. Safe to delete after use.
 *
 * Backfills `passcode_hash` for any `shops` rows where it is still null, by
 * hashing the existing plaintext `passcode` column with bcryptjs. The
 * `passcode` column itself is left untouched (not modified, cleared, or
 * dropped).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing required environment variable(s): ' +
      [
        !SUPABASE_URL && 'NEXT_PUBLIC_SUPABASE_URL',
        !SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
      ]
        .filter(Boolean)
        .join(', ') +
      '. Ensure web/.env.local is present and populated. Aborting.'
  );
  process.exit(1);
}

const SALT_ROUNDS = 10;

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: rows, error: selectError } = await supabase
    .from('shops')
    .select('shop_slug, passcode')
    .is('passcode_hash', null);

  if (selectError) {
    console.error('Failed to read shops table:', selectError.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('No shops require a passcode_hash migration. Done.');
    return;
  }

  let updatedCount = 0;

  for (const row of rows) {
    const hash = await bcrypt.hash(row.passcode, SALT_ROUNDS);

    const { error: updateError } = await supabase
      .from('shops')
      .update({ passcode_hash: hash })
      .eq('shop_slug', row.shop_slug);

    if (updateError) {
      console.error(
        `Failed to update passcode_hash for shop: ${row.shop_slug} — ${updateError.message}`
      );
      continue;
    }

    console.log(`Updated passcode_hash for shop: ${row.shop_slug}`);
    updatedCount += 1;
  }

  console.log(`Total shops updated: ${updatedCount}`);
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
