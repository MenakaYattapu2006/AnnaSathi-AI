import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const key = process.env.GEMINI_API_KEY;

const candidateModels = [
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-2.5-pro'
];

async function findWorkingModel() {
  for (const m of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Hello' }] }] })
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`✓ Model ${m} is WORKING! Response: "${data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().slice(0, 50)}"`);
        return m;
      } else {
        const err = await res.json();
        console.log(`- Model ${m} returned HTTP ${res.status}: ${err.error?.message?.slice(0, 80)}`);
      }
    } catch (e) {
      console.log(`- Model ${m} error: ${e.message}`);
    }
  }
}

findWorkingModel();
