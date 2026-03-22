import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const banksPath = path.join(__dirname, '..', 'knowledge', 'banks.json');

let _banks = null;
export function loadBanks() {
  if (!_banks) _banks = JSON.parse(fs.readFileSync(banksPath, 'utf8'));
  return _banks;
}

export function findBankContact(bankName) {
  const knowledge = loadBanks();
  const k = (bankName || '').toLowerCase();
  for (const [key, val] of Object.entries(knowledge)) {
    if (key === 'default') continue;
    if (k.includes(key) || key.includes(k.split(' ')[0])) return { ...val };
  }
  return { ...knowledge.default, name: bankName || knowledge.default.name };
}
