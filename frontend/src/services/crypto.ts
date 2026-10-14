/**
 * Browser-native Web Cryptography API SHA-256 file hashing
 */
export async function calculateFileSha256(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexString = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `0x${hexString}`;
}

export function formatAddress(address: string, chars: number = 4): string {
  if (!address || address.length < 10) return address || '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function formatHash(hash: string, chars: number = 6): string {
  if (!hash || hash.length < 16) return hash || '';
  return `${hash.substring(0, chars + 2)}...${hash.substring(hash.length - chars)}`;
}
