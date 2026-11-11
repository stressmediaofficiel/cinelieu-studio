import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.mp4':'video/mp4','.xml':'application/xml','.txt':'text/plain'};
const root=path.resolve('public');
const port=Number(process.env.PORT||4173);
createServer(async(req,res)=>{
 try{
 const p=new URL(req.url,'http://localhost').pathname;
 if(p==='/api/contact'){res.writeHead(200,{'Content-Type':'application/json'}).end('{"enabled":false}');return}
 const target=path.resolve(root,'.'+decodeURIComponent(p==='/'?'/index.html':p));
 if(!target.startsWith(root+path.sep))throw Error();
 const body=await readFile(target);
 const headers={'Content-Type':mime[path.extname(target)]||'application/octet-stream','Accept-Ranges':'bytes'};
 const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
 if(range){const start=Number(range[1]),end=Math.min(range[2]?Number(range[2]):body.length-1,body.length-1);if(start>end){res.writeHead(416,{'Content-Range':'bytes */'+body.length}).end();return}
 res.writeHead(206,{...headers,'Content-Range':'bytes '+start+'-'+end+'/'+body.length,'Content-Length':end-start+1}).end(req.method==='HEAD'?undefined:body.subarray(start,end+1));return}
 res.writeHead(200,{...headers,'Content-Length':body.length}).end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(404).end('Page introuvable')}
}).listen(port,'0.0.0.0',()=>console.log('Preview http://localhost:'+port));
