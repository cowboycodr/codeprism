import { eq } from 'drizzle-orm';
import ssh2 from 'ssh2';
import { db } from '@codeprism/db/db';
import { sshKeys } from '@codeprism/db/schema';

const { utils } = ssh2;

export function listAuthorizedKeys() {
  return db.select().from(sshKeys).all();
}

export function createAuthorizedKey(label: string, publicKey: string) {
  const parsed = utils.parseKey(publicKey);
  if (parsed instanceof Error) throw new Error(`Invalid SSH public key: ${parsed.message}`);
  return db.insert(sshKeys).values({ label, publicKey }).returning().get();
}

export function isAuthorizedPublicKey(algo: string, data: Buffer) {
  const keys = listAuthorizedKeys();
  for (const key of keys) {
    const parsed = utils.parseKey(key.publicKey);
    if (parsed instanceof Error) continue;
    const parsedKeys = Array.isArray(parsed) ? parsed : [parsed];
    for (const candidate of parsedKeys) {
      if (candidate.type === algo && candidate.getPublicSSH().equals(data)) return true;
    }
  }
  return false;
}

export function getAuthorizedKey(id: number) {
  return db.select().from(sshKeys).where(eq(sshKeys.id, id)).get();
}
