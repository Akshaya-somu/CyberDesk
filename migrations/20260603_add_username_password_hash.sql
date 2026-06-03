-- Migration: Add username and password_hash columns to users table
-- Generated: 2026-06-03

ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS username varchar;

ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS password_hash varchar;

-- Optionally create an index on username for faster lookups (non-unique)
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
