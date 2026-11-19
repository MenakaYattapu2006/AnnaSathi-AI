// Live AI Providers Verification Script
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { NvidiaNimProvider, GeminiProvider } from '../src/services/aiService.js';

async function testLiveProviders() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('   TESTING LIVE AI PROVIDERS (NVIDIA NIM & GEMINI)');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // 1. Test NVIDIA NIM
  console.log('--- 1. Testing NVIDIA NIM Live API ---');
  const nimKey = process.env.NVIDIA_NIM_API_KEY;
  if (!nimKey) {
    console.log('❌ NVIDIA_NIM_API_KEY is missing from environment.');
  } else {
    try {
      console.log(`Connecting to NVIDIA NIM (${process.env.NVIDIA_NIM_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b'})...`);
      const nim = new NvidiaNimProvider(nimKey);
      const prompt = 'In 2 sentences, explain why immediate temperature logging is critical for food rescue redistribution.';
      const res = await nim.generate(
        [{ sender: 'user', content: prompt }],
        'You are AnnaSathi AI, a food safety redistribution intelligence assistant.'
      );
      console.log('✓ NVIDIA NIM LIVE API SUCCESS!');
      console.log('--- Response Preview ---');
      console.log(res.trim());
      console.log('------------------------\n');
    } catch (err) {
      console.error('❌ NVIDIA NIM Live API call failed:', err.message);
    }
  }

  // 2. Test Gemini API
  console.log('--- 2. Testing Gemini Live API ---');
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.log('❌ GEMINI_API_KEY is missing from environment.');
  } else {
    try {
      console.log(`Connecting to Gemini API (${process.env.GEMINI_MODEL || 'gemini-1.5-flash'})...`);
      const gemini = new GeminiProvider(geminiKey);
      const prompt = 'In 2 sentences, summarize how zero-waste technology helps feed hungry families.';
      const res = await gemini.generate(
        [{ sender: 'user', content: prompt }],
        'You are AnnaSathi AI, a food rescue assistant.'
      );
      console.log('✓ GEMINI LIVE API SUCCESS!');
      console.log('--- Response Preview ---');
      console.log(res.trim());
      console.log('------------------------\n');
    } catch (err) {
      console.error('❌ Gemini Live API call failed:', err.message);
    }
  }

  process.exit(0);
}

testLiveProviders().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
