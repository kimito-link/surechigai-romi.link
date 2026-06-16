#!/usr/bin/env node
/**
 * すれちがいロミ LP 用 実写背景の一括生成（ローカル AUTOMATIC1111 API）
 * 使い方:
 *   node scripts/lp-sd-gen.mjs            … 全部生成（既存はスキップ）
 *   node scripts/lp-sd-gen.mjs yukiguni   … 指定idだけ生成
 *   node scripts/lp-sd-gen.mjs --force    … 既存も上書き
 * 出力: public/lp/img/<id>.png
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_DIR = path.resolve(__dirname, '../public/lp/img');
const API = 'http://127.0.0.1:7860';

const NEG = 'text, letters, watermark, signature, people, person, human, hands, modern buildings, cars, power lines, neon, oversaturated, lowres, blurry, jpeg artifacts, cartoon, anime, illustration, 3d render, deformed';

// 各章の情景。横長16:9基調。墨ベール越しに薄く敷く前提で、静けさ・余白を重視。
const JOBS = [
  { id:'yukiguni', w:768, h:432, prompt:'a lone snow-covered mountain pass at dusk in deep winter, soft falling snow, faint blue twilight, distant ridgeline, quiet and desolate, japanese landscape, photorealistic, atmospheric, muted cold tones, film grain, cinematic, serene' },
  { id:'kisha', w:768, h:432, prompt:'an old black steam locomotive crossing a vast bright snowy plain in clear daylight, big plume of white steam and smoke, blue winter sky, distant snowy mountains, bright snow reflecting sunlight, nostalgic showa era japan, photorealistic, cinematic, wide shot, airy and luminous, film grain' },
  { id:'yukimichi', w:768, h:432, prompt:'a single narrow path through deep white snow, a line of fresh footprints leading into the distance, bare trees, overcast winter sky, silent countryside, japanese landscape, photorealistic, melancholic, soft diffused light, film grain' },
  { id:'shishiodoshi', w:768, h:432, prompt:'a traditional japanese garden shishi-odoshi bamboo water fountain over a stone basin, moss, wet stones, raked gravel, soft shade, water droplets, wabi-sabi, tranquil tea garden, photorealistic, shallow depth of field, gentle natural light, film grain, serene' },
  { id:'onsen-saru', w:512, h:512, prompt:'a japanese macaque snow monkey relaxing in a steaming natural hot spring, snow around the rocks, rising steam, winter, jigokudani, close-up, photorealistic, soft warm light against cold snow, film grain, peaceful' },
  { id:'tekiya', w:768, h:432, prompt:'japanese summer festival night street stalls, red paper lanterns glowing warm, takoyaki and yakisoba stands, bokeh lights, deep blue night, festive nostalgic atmosphere at dusk, photorealistic, warm lantern glow, film grain' },
  { id:'hanabi', w:768, h:432, prompt:'large japanese fireworks blooming in a deep indigo night sky over a dark rural town silhouette, golden and red sparks falling, summer festival, reflection, photorealistic, cinematic, atmospheric, film grain' },
];

async function setModelReady(){
  // モデルが実写系か確認（違えば切替）
  const o = await fetch(`${API}/sdapi/v1/options`).then(r=>r.json());
  if(!/beautifulRealistic/i.test(o.sd_model_checkpoint||'')){
    console.log('switching model to beautifulRealistic_v7 ...');
    await fetch(`${API}/sdapi/v1/options`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sd_model_checkpoint:'beautifulRealistic_v7' }) });
  }
}

async function gen(job){
  const body = {
    prompt: job.prompt,
    negative_prompt: NEG,
    width: job.w, height: job.h,
    steps: 28, cfg_scale: 6.5,
    sampler_name: 'DPM++ 2M Karras',
    seed: -1,
    batch_size: 1, n_iter: 1,
  };
  const t0 = Date.now();
  const res = await fetch(`${API}/sdapi/v1/txt2img`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  if(!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  const b64 = data.images && data.images[0];
  if(!b64) throw new Error('no image in response');
  const out = path.join(IMG_DIR, `${job.id}.png`);
  fs.writeFileSync(out, Buffer.from(b64, 'base64'));
  const kb = Math.round(fs.statSync(out).size/1024);
  console.log(`  ✓ ${job.id}.png  (${kb}KB, ${((Date.now()-t0)/1000).toFixed(1)}s)`);
}

async function main(){
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const only = args.filter(a=>!a.startsWith('--'));
  await setModelReady();
  const jobs = only.length ? JOBS.filter(j=>only.includes(j.id)) : JOBS;
  if(!jobs.length){ console.log('no matching jobs. ids:', JOBS.map(j=>j.id).join(', ')); return; }
  for(const job of jobs){
    const out = path.join(IMG_DIR, `${job.id}.png`);
    if(!force && fs.existsSync(out)){ console.log(`  - ${job.id}.png exists, skip`); continue; }
    console.log(`generating ${job.id} ...`);
    try{ await gen(job); }
    catch(e){ console.log(`  ✗ ${job.id} FAILED: ${e.message}`); }
  }
  console.log('done.');
}
main();
