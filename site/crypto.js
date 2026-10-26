// 本模块不依赖外部脚本：浏览器原生 PBKDF2-SHA256 + AES-256-GCM。
function b64bytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
export async function decryptEnvelope(envelope, passphrase) {
  if (envelope?.format !== 'family-finance-encrypted-v1' || envelope?.kdf !== 'PBKDF2-SHA256' ||
    envelope?.cipher !== 'AES-256-GCM' || envelope?.iterations !== 600000 ||
    typeof envelope.salt !== 'string' || typeof envelope.iv !== 'string' || typeof envelope.ciphertext !== 'string') {
    throw new Error('加密文件格式不兼容，请更新网站或重新发布数据。');
  }
  const raw = new TextEncoder().encode(passphrase);
  const baseKey = await crypto.subtle.importKey('raw', raw, 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64bytes(envelope.salt), hash: 'SHA-256', iterations: envelope.iterations },
    baseKey,
    { name: 'AES-GCM', length: 256 }, false, ['decrypt']
  );
  let plaintext;
  try {
    plaintext = await crypto.subtle.decrypt(
      {name: 'AES-GCM', iv: b64bytes(envelope.iv)}, key, b64bytes(envelope.ciphertext)
    );
  } catch {
    throw new Error('解密失败：密码不正确，或加密数据已损坏。');
  }
  const result = JSON.parse(new TextDecoder().decode(plaintext));
  if (result?.schemaVersion !== 1 || !Array.isArray(result?.months)) {
    throw new Error('解密成功，但财务数据的格式不正确。');
  }
  return result;
}
export async function fetchAndDecrypt(passphrase) {
  const response = await fetch('./data/finance.enc.json', {cache: 'no-store'});
  if (!response.ok) {
    throw new Error('加密账本尚未发布，请先配置私有仓库的 GitHub Actions。');
  }
  return decryptEnvelope(await response.json(), passphrase);
}
