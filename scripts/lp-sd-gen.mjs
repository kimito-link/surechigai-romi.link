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
  { id:'shishiodoshi', w:768, h:432, prompt:'a japanese sozu shishi-odoshi: a pivoting bamboo tube on a wooden fulcrum that fills with water from a spout and tips down to strike a flat stone, water pouring from the bamboo, droplets, moss-covered rock and stone basin, tea garden, bamboo pipe, side view showing the tilting tube and the stone it hits, wabi-sabi, photorealistic, shallow depth of field, soft natural light, film grain, tranquil' },
  { id:'onsen-saru', w:512, h:512, prompt:'a japanese macaque snow monkey relaxing in a steaming natural hot spring, snow around the rocks, rising steam, winter, jigokudani, close-up, photorealistic, soft warm light against cold snow, film grain, peaceful' },
  { id:'tekiya', w:768, h:432, prompt:'japanese summer festival night street stalls, red paper lanterns glowing warm, takoyaki and yakisoba stands, bokeh lights, deep blue night, festive nostalgic atmosphere at dusk, photorealistic, warm lantern glow, film grain' },
  { id:'hanabi', w:768, h:432, prompt:'large japanese fireworks blooming in a deep indigo night sky over a dark rural town silhouette, golden and red sparks falling, summer festival, reflection, photorealistic, cinematic, atmospheric, film grain' },
  { id:'nyudogumo', w:768, h:432, prompt:'a towering cumulonimbus thundercloud (nyudogumo) rising over a green rural japanese landscape in midsummer, brilliant blue sky, rice fields, bright sunlight, vivid white billowing cloud, nostalgic japanese summer, photorealistic, cinematic, luminous, film grain' },
  { id:'yukinohara', w:768, h:432, prompt:'a vast silent snowfield under a soft pale winter sky, gently falling snow, distant snow-laden trees, untouched white snow stretching to the horizon, serene and quiet, japanese landscape, photorealistic, luminous soft light, film grain' },
  { id:'kawa', w:768, h:432, prompt:'a clear shallow mountain stream flowing over smooth stones in summer, sparkling water, dappled sunlight through green leaves, a small fish leaping above the water surface with splash, lush riverbank, japanese countryside, photorealistic, fresh and cool, film grain' },
  { id:'momiji', w:768, h:432, prompt:'a path covered with fallen autumn leaves in a japanese forest, brilliant red and orange maple trees, soft afternoon light, fallen leaves on the ground, nostalgic, photorealistic, warm autumn tones, film grain, serene' },
  { id:'kakigori', w:768, h:432, prompt:'a glass bowl of japanese shaved ice kakigori with bright red strawberry syrup, melting ice, a red droplet of syrup running down, condensation on the glass, bright summer light by a window, close-up, photorealistic, vivid, refreshing yet bittersweet, shallow depth of field, film grain' },
  { id:'matsuri-hito', w:768, h:432, prompt:'a crowded japanese summer festival at night seen from behind, people in yukata walking among glowing red lanterns and food stalls, warm bokeh lights, one person turning away into the crowd, deep blue night, photorealistic, nostalgic, atmospheric, film grain' },
  { id:'ashiato', w:768, h:432, prompt:'a single line of footprints in fresh deep snow stretching into the distance, soft overcast winter light, untouched white snowfield, quiet and lonely, japanese landscape, photorealistic, melancholic, film grain' },
  { id:'rikisha', w:768, h:432, prompt:'a traditional japanese rickshaw (jinrikisha) on an old town street lined with cherry blossom trees in spring, falling petals, soft afternoon light, nostalgic taisho era atmosphere, photorealistic, warm tones, film grain', neg_extra:'' },
  { id:'mugiwara', w:768, h:432, prompt:'a straw hat (mugiwara boushi) flying through the air caught by the summer wind over a green field, blue sky with clouds, motion blur, sense of a gust of wind, nostalgic japanese summer, photorealistic, bright and airy, film grain' },
  { id:'takoyaki', w:768, h:432, prompt:'close-up of a japanese festival food stall at night, freshly made takoyaki and yakisoba on a hot griddle, steam rising, red paper lanterns glowing warm above, bokeh festival lights, deep blue night, photorealistic, appetizing, warm lantern glow, film grain' },
  { id:'senkohanabi', w:768, h:432, prompt:'a single senko hanabi sparkler held in the dark, tiny crackling orange sparks bursting from a glowing ball at the tip, a spark about to fall, deep black background, intimate and fleeting, japanese summer night, photorealistic, bokeh, shallow depth of field, film grain' },
  { id:'futari-ashiato', w:768, h:432, prompt:'two separate lines of footprints on a path at dawn, overlapping and crossing on the same road, soft pre-dawn blue and gold light, a quiet country road, sense of two people who walked the same way at different times, photorealistic, poetic, atmospheric, film grain' },
  { id:'yoake', w:768, h:432, prompt:'a serene pre-dawn sky over a calm landscape, fading stars and a soft band of golden light on the horizon, a single faint trail of light across the sky like a path, deep blue to gold gradient, tranquil, photorealistic, cinematic, hopeful, film grain' },
  { id:'yakiimo', w:768, h:432, prompt:'a japanese roasted sweet potato (yaki-imo) stone-roasting cart at dusk in autumn, warm steam rising from baked sweet potatoes, glowing embers, fallen autumn leaves around, nostalgic showa atmosphere, deep amber light, photorealistic, warm and cozy, film grain' },
  // 八章の結び（アプリの本質＝歩いた人生が消えない一本の線になる）
  { id:'hitosuji', w:768, h:432, prompt:'a single continuous winding road seen from a high aerial view, the path glowing with a soft luminous trail of light tracing every step of a long journey, the landscape around it blending through four seasons: snow, cherry blossoms, summer green, autumn red, the line of light unbroken from the snowy distance to the foreground, twilight sky, photorealistic landscape with a gentle glowing route line, cinematic, poetic, film grain, sense of a whole life traced as one unerasable line' },
  { id:'kiseki', w:768, h:432, prompt:'a long footpath stretching to the horizon at golden hour, a soft glowing line of light following the path into the far distance, gentle hills, a sense of looking back over the entire way one has walked, warm nostalgic light, photorealistic, hopeful and emotional, the road never disappearing, film grain' },
  // 結章：夜の富士＋湖に逆さに映る月＋流れ星（アプリの一番のメッセージ）
  { id:'fuji-yoru', w:768, h:432, prompt:'mount fuji at night under a clear starry sky, a bright full moon reflected upside down on the calm mirror-like surface of a lake in the foreground, a single shooting star streaking across the deep indigo night sky, serene, snow-capped peak faintly lit, deep blue and silver tones, photorealistic, cinematic, breathtaking, film grain, tranquil and hopeful' },
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
