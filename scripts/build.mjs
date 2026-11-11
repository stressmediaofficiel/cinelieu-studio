import { cp, readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
const origin=new URL(process.env.CINELIEU_SITE_URL||'https://cinelieu-studio.pages.dev').origin;
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});
await cp('scripts/contact.mjs','dist/_worker.js');
for(const file of ['index.html','sitemap.xml','robots.txt']){
 const text=await readFile('dist/'+file,'utf8');await writeFile('dist/'+file,text.replaceAll('https://cinelieu-studio.pages.dev',origin));
}
const html=await readFile('dist/index.html','utf8');
for(const [,ref] of html.matchAll(/(?:href|src|srcset|data-src)="(\/[^"#? ]+)"/g)){
 if(ref.startsWith('/api/'))continue;
 await readFile(path.join('dist',ref));
}
const assets=await readdir('dist/assets');console.log('Vitrine prête :',assets.length,'ressources optimisées');
