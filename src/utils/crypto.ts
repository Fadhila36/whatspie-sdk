export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto API is not available in this environment.');
  }

  const enc = new TextEncoder();
  const algorithm = { name: 'HMAC', hash: 'SHA-256' };

  try {
    const key = await globalThis.crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      algorithm,
      false,
      ['verify']
    );

    // Convert hex signature to Uint8Array
    const signatureBytes = new Uint8Array(
      signature.match(/[\da-f]{2}/gi)?.map((h) => parseInt(h, 16)) || []
    );

    return await globalThis.crypto.subtle.verify(
      algorithm.name,
      key,
      signatureBytes,
      enc.encode(payload)
    );
  } catch (error) {
    return false;
  }
}
