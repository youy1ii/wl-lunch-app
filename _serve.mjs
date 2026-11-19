import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve('dist/client');
const PREFIX = '/wl-lunch-app/';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.jpg':'image/jpeg' };
http.createServer((req,res)=>{
  let url = decodeURIComponent(req.url.split('?')[0]);
  if(!url.startsWith(PREFIX)&&url!=='/wl-lunch-app'){res.writeHead(404);res.end('no');return;}
  let rel=url.slice(PREFIX.length); let file=path.join(ROOT,rel);
  if(!rel||!fs.existsSync(file)||fs.statSync(file).isDirectory()) file=path.join(ROOT,'index.html');
  res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream'});
  res.end(fs.readFileSync(file));
}).listen(4174,'127.0.0.1',()=>console.log('serving 4174'));
