import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';
import path from 'node:path';
import { config } from '@codeprism/shared/config';

export function getHostKeyPath() {
  return path.join(config.dataDir, 'ssh_host_rsa_key.pem');
}

export function loadOrCreateHostKey() {
  const keyPath = getHostKeyPath();
  if (existsSync(keyPath)) return readFileSync(keyPath, 'utf8');

  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 3072,
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' }
  });
  writeFileSync(keyPath, privateKey, { mode: 0o600 });
  return privateKey;
}
