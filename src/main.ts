import './css/style.css'
import { getAllEmojis, type EmojiResult } from './emojis.ts';
import { embeddingGemma, encodeDocuments, encodeQuery, getEmbedder } from './ai.ts';
import { createBatches, sleep } from "./utils.ts";
import { insertEmoji, queryEmojis } from "./db.ts";
import { addEmoji, getEmoji, getEmojis } from './firebase.ts';

const search = document.querySelector('#search') as HTMLInputElement;
const suggestions = document.querySelector('#suggestions')!;
const emojis = document.querySelector('#emojis')!;
const update = document.querySelector('#update')!;
const download = document.querySelector('#download')!;

const embedder = await getEmbedder(embeddingGemma);

update.addEventListener('click', () => updateEmojis());
download.addEventListener('click', () => downloadEmojis());

async function downloadEmojis() {
  const emojisRemote = await getEmojis();
  for (const e of emojisRemote) {
    if (e.embedding) {
      insertEmoji(e, new Float32Array(e.embedding))
    } else {
      insertEmoji(e)
    }
  }

  if (emojisRemote.length > 0) {
    search.removeAttribute('disabled');
  }
}

async function updateEmojis() {
  let p = suggestions.querySelector('progress') as HTMLProgressElement | null;
  if (!p) {
    p = document.createElement('progress');
    p.id = 'progress';
    suggestions.append(p);
  }

  console.log('fetching emojis..');
  const emojisResults = await getAllEmojis();
  console.log('emojis: ', emojisResults.length);
  const missingEmojis: EmojiResult[] = [];

  for (let i = 0; i < emojisResults.length; i++) {
    const emoji = emojisResults[i];
    const option = document.createElement('option');
    option.value = emoji.emoji;
    option.label = emoji.description;
    emojis.append(option);
    p.value = (i + 1) / emojisResults.length;
    const r = await getEmoji(emoji.emoji);
    console.log('checking emoji', emoji.emoji, r?.embedding?.length);
    if (r) continue;
    missingEmojis.push(emoji);
  }

  p.value = 0;
  console.log('embedding emojis..', missingEmojis.length);
  const target = createBatches(missingEmojis, 25);
  for (let i = 0; i < target.length; i++) {
    const batch = target[i];
    const results = await encodeDocuments(embedder, batch.map(e => e.description));
    for (let r = 0; r < results.length; r++) {
      const emoji = batch[r];
      const res = results[r];
      await addEmoji(emoji, new Float32Array(res))
      p.value = (i + 1) / target.length;
      console.log('embedded emoji', emoji.emoji);
    }
    await sleep(50);
  }
  p.remove();
  console.log('emojis embedded!');

  await downloadEmojis();
}

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