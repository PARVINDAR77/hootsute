import * as crypto from 'crypto';

export function canonicalJsonStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(canonicalJsonStringify).join(',')}]`;
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${canonicalJsonStringify(obj[key])}`,
  );
  return `{${pairs.join(',')}}`;
}

export function computeSnapshotHash(snapshot: any): string {
  const canonicalJson = canonicalJsonStringify(snapshot);
  return crypto.createHash('sha256').update(canonicalJson).digest('hex');
}
