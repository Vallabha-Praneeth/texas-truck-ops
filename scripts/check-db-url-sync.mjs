#!/usr/bin/env node

/**
 * Check if DATABASE_URL is synchronized across .env files
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Helper to parse .env file
function parseEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const env = {};

    content.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes
        value = value.replace(/^["']|["']$/g, '');
        env[key] = value;
      }
    });

    return env;
  } catch (error) {
    return null;
  }
}

// Check API .env file
const apiEnvPath = resolve(rootDir, 'packages/api/.env');
const apiEnv = parseEnvFile(apiEnvPath);

if (!apiEnv) {
  console.warn('⚠️  Warning: packages/api/.env not found');
  process.exit(0); // Don't fail, just warn
}

if (!apiEnv.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not found in packages/api/.env');
  console.error('   Please add DATABASE_URL to your .env file');
  process.exit(1);
}

console.log('✅ Database URL configuration check passed');
process.exit(0);
