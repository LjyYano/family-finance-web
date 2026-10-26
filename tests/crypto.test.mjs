import assert from 'node:assert/strict';
import test from 'node:test';
import crypto from 'node:crypto';
import {decryptEnvelope} from '../site/crypto.js';

const password='test-only-random-32-chars-example-2026';
function makeEncrypted(payload){
  const salt=crypto.randomBytes(16);const iv=crypto.randomBytes(12);
  const key=crypto.pbkdf2Sync(password,salt,600000,32,'sha256');
  const enc=crypto.createCipheriv('aes-256-gcm',key,iv);
  return {format:'family-finance-encrypted-v1',kdf:'PBKDF2-SHA256',cipher:'AES-256-GCM',iterations:600000,
    salt:salt.toString('base64'),iv:iv.toString('base64'),ciphertext:Buffer.concat([enc.update(JSON.stringify(payload)),enc.final(),enc.getAuthTag()]).toString('base64')};
}
test('浏览器 Web Crypto 与 Node AES-GCM 完整互通',async()=>{
  const payload={schemaVersion:1,months:[{month:'2026-10',transactions:[]}]};
  const e=makeEncrypted(payload);
  const actual=await decryptEnvelope(e,password);
  assert.deepEqual(actual,payload);
  assert.ok(!JSON.stringify(e).includes('transactions'));
  await assert.rejects(()=>decryptEnvelope(e,'wrong-password'));
});
test('篡改加密文件被 GCM 完整性校验阻止',async()=>{
  const e=makeEncrypted({schemaVersion:1,months:[]});
  const raw=Buffer.from(e.ciphertext,'base64');raw[0]^=1;e.ciphertext=raw.toString('base64');
  await assert.rejects(()=>decryptEnvelope(e,password));
});
