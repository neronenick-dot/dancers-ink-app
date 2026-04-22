#!/usr/bin/env node
/**
 * Dancers Ink — Database Setup Script
 *
 * Requires: schema.sql already run in Supabase SQL Editor
 *
 * Usage (run from project root):
 *   SUPABASE_SERVICE_KEY=<service_role_key> node scripts/setup.mjs
 *
 * Get your service_role key:
 *   Supabase dashboard → Settings → API → service_role (secret key)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function readDotEnv(file) {
  const path = join(root, file)
  if (!existsSync(path)) return {}
  const vars = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    vars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
  }
  return vars
}

const env = { ...readDotEnv('.env'), ...readDotEnv('.env.local') }
const url = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_KEY

if (!url || !serviceKey) {
  console.error('\n❌  Missing required environment variables.\n')
  if (!url)        console.error('   VITE_SUPABASE_URL      — already in .env')
  if (!serviceKey) console.error('   SUPABASE_SERVICE_KEY   — Supabase → Settings → API → service_role\n')
  console.error('Usage:  SUPABASE_SERVICE_KEY=<key> node scripts/setup.mjs')
  console.error('    or  add SUPABASE_SERVICE_KEY=<key> to .env.local then run node scripts/setup.mjs\n')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

let passed = 0
let failed = 0

const ok   = msg         => { passed++; console.log(`  ✓  ${msg}`) }
const skip = msg         => {           console.log(`  –  ${msg}`) }
const fail = (msg, err)  => { failed++; console.error(`  ✗  ${msg}${err ? ': ' + (err.message || err) : ''}`) }

/* ------------------------------------------------------------------ */
async function main() {
  console.log('\n🩰  Dancers Ink — Setup\n')

  // ── 1. Verify schema exists ──────────────────────────────────────
  console.log('Checking schema …')
  const { error: schemaCheck } = await supabase.from('profiles').select('id').limit(1)
  if (schemaCheck) {
    console.error('\n❌  The "profiles" table does not exist.')
    console.error('    Run supabase/schema.sql in the Supabase SQL Editor first, then re-run this script.\n')
    process.exit(1)
  }
  ok('schema tables exist')

  // ── 2. Storage bucket ────────────────────────────────────────────
  console.log('\nStorage …')
  const { error: bucketErr } = await supabase.storage.createBucket('media', {
    public: true,
    fileSizeLimit: 52428800, // 50 MB
    allowedMimeTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf']
  })
  if (!bucketErr) {
    ok('created "media" bucket (public, 50 MB limit)')
  } else if (bucketErr.message?.includes('already exists') || bucketErr.message?.includes('Duplicate')) {
    skip('"media" bucket already exists')
  } else {
    fail('create media bucket', bucketErr)
  }

  // ── 3. Demo users ────────────────────────────────────────────────
  console.log('\nDemo users …')
  const users = [
    { email: 'admin@dancersink.app',  full_name: 'Studio Admin',  role: 'admin'  },
    { email: 'parent@dancersink.app', full_name: 'Demo Parent',   role: 'parent' },
  ]

  const createdIds = {}
  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: 'demo1234',
      email_confirm: true,
      user_metadata: { full_name: u.full_name }
    })
    if (!error) {
      ok(`created ${u.email}`)
      createdIds[u.email] = data.user.id
    } else if (error.message?.includes('already been registered') || error.message?.includes('already exists')) {
      skip(`${u.email} already exists`)
      // Fetch existing user id so we can still update role below
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', u.email)
        .single()
      if (existing) createdIds[u.email] = existing.id
    } else {
      fail(`create ${u.email}`, error)
    }
  }

  // ── 4. Wait for trigger to create profile rows ───────────────────
  if (Object.keys(createdIds).length > 0) {
    await new Promise(r => setTimeout(r, 1500))
  }

  // ── 5. Set roles ─────────────────────────────────────────────────
  console.log('\nRoles …')
  for (const u of users) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: u.role, full_name: u.full_name })
      .eq('email', u.email)
    if (error) fail(`set role for ${u.email}`, error)
    else ok(`${u.email} → ${u.role}`)
  }

  // ── 6. Seed data check ───────────────────────────────────────────
  console.log('\nSeed data …')
  const { count: classCount } = await supabase
    .from('classes').select('*', { count: 'exact', head: true })
  const { count: annCount } = await supabase
    .from('announcements').select('*', { count: 'exact', head: true })
  const { data: chatbot } = await supabase
    .from('chatbot_settings').select('id').single()

  if ((classCount || 0) > 0) ok(`${classCount} classes in database`)
  else fail('no classes — did schema.sql seed data run?')

  if ((annCount || 0) > 0) ok(`${annCount} announcements in database`)
  else fail('no announcements — did schema.sql seed data run?')

  if (chatbot) ok('chatbot settings row present')
  else fail('no chatbot settings row')

  // ── Summary ──────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(44)}`)
  if (failed === 0) {
    console.log(`✅  All done — ${passed} steps completed.\n`)
    console.log('   Login credentials:')
    console.log('   admin@dancersink.app  / demo1234  (admin)')
    console.log('   parent@dancersink.app / demo1234  (parent)\n')
    console.log('   Next: add storage RLS policies in Supabase SQL Editor.')
    console.log('   SQL is in supabase/storage-policies.sql\n')
  } else {
    console.log(`⚠️  ${passed} succeeded, ${failed} failed.\n`)
    if (failed > 0) {
      console.log('   Check error messages above.')
      console.log('   Most common fix: run supabase/schema.sql first.\n')
    }
  }
}

main().catch(e => { console.error('\nFatal:', e.message || e); process.exit(1) })
