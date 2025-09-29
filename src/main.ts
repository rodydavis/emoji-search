import './css/style.css'
import { getAllEmojis } from './emojis.ts';
import { embeddingGemma, encodeDocuments, encodeQuery, getEmbedder } from './ai.ts';
import { createBatches, sleep } from "./utils.ts";
import { insertEmoji, queryEmojis } from "./db.ts";

const search = document.querySelector('#search') as HTMLInputElement;
const suggestions = document.querySelector('#suggestions')!;
const emojis = document.querySelector('#emojis')!;

console.log('fetching emojis..');
const emojisResults = await getAllEmojis();
emojis.innerHTML = '';
for (const emoji of emojisResults) {
  const option = document.createElement('option');
  option.value = emoji.emoji;
  option.label = emoji.description;
  emojis.append(option);
}
console.log('emojis', emojisResults.length);

console.log('fetching embedder..');
const embedder = await getEmbedder(embeddingGemma);
console.log('embedder created!');

console.log('embedding emojis..');
const target = createBatches(emojisResults, 40);
const p = suggestions.querySelector('progress') as HTMLProgressElement;
for (let i = 0; i < target.length; i++) {
  const batch = target[i];
  const results = await encodeDocuments(embedder, batch.map(e => e.description));
  for (let r = 0; r < results.length; r++) {
    const emoji = batch[r];
    const res = results[r];
    insertEmoji(emoji, new Float32Array(res))
    p.value = (i + 1) / target.length;
    console.log('embedded emoji', emoji.emoji);
  }
  await sleep(50);
}
p.remove();
console.log('emojis embedded!');

search.removeAttribute('disabled');
search.addEventListener('change', async () => {
  const value = search.value;
  console.log('search', value);
  suggestions.innerHTML = '';
  if (value === '') {
    return;
  }

  const res = await encodeQuery(embedder, value);
  const results = queryEmojis(new Float32Array(res));
  const list = document.createElement('ul');

  for (const val of results) {
    const el = document.createElement('li');
    el.innerText = `${val.emoji} - ${val.description}`;
    list.append(el);
  }

  suggestions.append(list);
});