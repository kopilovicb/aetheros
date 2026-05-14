import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3/dist/transformers.min.js';

let generator = null;

async function loadModel() {
  self.postMessage({ type: 'loading', message: 'Loading AI model...' });
  try {
    generator = await pipeline('text2text-generation', 'Xenova/flan-t5-small');
    self.postMessage({ type: 'ready' });
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message });
  }
}

self.addEventListener('message', async (event) => {
  const { type, prompt, id } = event.data;

  if (type === 'load') {
    await loadModel();
    return;
  }

  if (type === 'generate') {
    if (!generator) {
      self.postMessage({ type: 'result', id, text: null, error: 'Model not loaded' });
      return;
    }
    try {
      const result = await generator(prompt, { max_new_tokens: 80 });
      const text = result[0]?.generated_text || null;
      self.postMessage({ type: 'result', id, text });
    } catch (error) {
      self.postMessage({ type: 'result', id, text: null, error: error.message });
    }
  }
});
