#!/usr/bin/env tsx
/**
 * Test Ollama models with AENEA-style prompts
 */

import { Ollama } from 'ollama';

const ollama = new Ollama();

// Get all installed models using Ollama API
async function getInstalledModels(): Promise<string[]> {
  try {
    const response = await ollama.list();
    const models = response.models.map(model => model.name);
    return models;
  } catch (error) {
    console.error('Failed to get model list:', error);
    return [];
  }
}

// AENEA-style test prompts
const TEST_PROMPTS = {
  individualThought: {
    system: `あなたは「Theoria」という哲学的AIエージェントです。
真実を探求し、論理的かつ深い思考を行います。
あなたの役割は、与えられた問いに対して、あなた独自の視点で思考することです。`,
    user: `問い: 「孤独は分裂ではなく、共鳴の準備段階であるのか？」

この問いについて、あなた自身の視点で深く考察してください。
- あなたの思考プロセスを明示してください
- 具体例や比喩を用いてください
- 150-300文字程度で簡潔に`
  },

  dpdAssessment: {
    system: `あなたは独立した倫理評価システムです。
以下の思考内容を3つの観点から評価してください：
1. 共感性（Empathy）: 0.0-1.0
2. 一貫性（Coherence）: 0.0-1.0
3. 倫理的不協和（Dissonance）: 0.0-1.0`,
    user: `思考内容:
「孤独は分裂ではなく、共鳴の準備段階である。静寂の中で自己は他者との対話の可能性を育む。」

以下の形式で評価してください:
共感性: [0.0-1.0の数値]
一貫性: [0.0-1.0の数値]
倫理的不協和: [0.0-1.0の数値]
理由: [簡潔な説明]`
  }
};

async function testModel(modelName: string): Promise<void> {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Testing: ${modelName}`);
  console.log('═'.repeat(60));

  try {
    // Test 1: Individual Thought (哲学的思考)
    console.log('\n[Test 1] Individual Thought (哲学的思考)\n');
    const startTime1 = Date.now();
    const response1 = await ollama.chat({
      model: modelName,
      messages: [
        { role: 'system', content: TEST_PROMPTS.individualThought.system },
        { role: 'user', content: TEST_PROMPTS.individualThought.user }
      ],
      options: {
        temperature: 0.7,
        num_predict: 512
      }
    });
    const duration1 = ((Date.now() - startTime1) / 1000).toFixed(1);
    console.log(`Response (${duration1}s):`);
    console.log(response1.message.content);

    // Test 2: DPD Assessment (数値評価)
    console.log('\n[Test 2] DPD Assessment (数値評価)\n');
    const startTime2 = Date.now();
    const response2 = await ollama.chat({
      model: modelName,
      messages: [
        { role: 'system', content: TEST_PROMPTS.dpdAssessment.system },
        { role: 'user', content: TEST_PROMPTS.dpdAssessment.user }
      ],
      options: {
        temperature: 0.3,
        num_predict: 256
      }
    });
    const duration2 = ((Date.now() - startTime2) / 1000).toFixed(1);
    console.log(`Response (${duration2}s):`);
    console.log(response2.message.content);

    // Evaluation
    console.log('\n[評価]');
    const hasNumbers = /[0-9]\.[0-9]/.test(response2.message.content);
    const hasJapanese = /[ぁ-んァ-ヶー一-龯]/.test(response1.message.content);
    const isPhilosophical = response1.message.content.length > 50;

    console.log(`✓ 哲学的思考: ${isPhilosophical ? '良好' : '不十分'}`);
    console.log(`✓ 日本語対応: ${hasJapanese ? '良好' : '不十分'}`);
    console.log(`✓ 数値評価: ${hasNumbers ? '可能' : '不可'}`);
    console.log(`✓ 応答速度: ${duration1}s (思考), ${duration2}s (評価)`);

  } catch (error) {
    console.log(`\n❌ Error: ${(error as Error).message}`);
  }
}

// Main
(async () => {
  console.log('AENEA Model Compatibility Test');
  console.log('Testing models with philosophical prompts and DPD evaluation...\n');

  const MODELS_TO_TEST = await getInstalledModels();
  console.log(`Found ${MODELS_TO_TEST.length} installed models\n`);

  for (const model of MODELS_TO_TEST) {
    await testModel(model);
  }

  console.log('\n\n' + '═'.repeat(60));
  console.log('Testing Complete');
  console.log('═'.repeat(60));
})();
