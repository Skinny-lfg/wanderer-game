// Private v0.12 preview. Credentials are environment variables, never embedded in public files.
import {createServer} from 'node:http';
import {createReadStream, statSync} from 'node:fs';
import {resolve, extname, relative, sep} from 'node:path';
import {createHmac,timingSafeEqual,scryptSync,randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const {PREVIEW_USERNAME:user,PREVIEW_PASSWORD_HASH:stored,PREVIEW_COOKIE_KEY:key}=process.env;
const prod=process.env.NODE_ENV==='production',port=Number(process.env.PORT||8080);
if(!user||!stored||!key||!/^[a-z0-9_-]{6,40}$/i.test(user)||!/^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(stored)||key.length<40){
 console.error('Private preview credentials missing or invalid; refusing to serve.');process.exit(1);
}
const [salt,hash]=stored.split(':'),expected=Buffer.from(hash,'hex');
const cookieName='__Host-wanderer_preview',ttl=8*60*60,tries=new Map();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.woff':'font/woff','.woff2':'font/woff2','.ico':'image/x-icon','.json':'application/json; charset=utf-8'};
function headers(res){res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');}
function send(res,status,msg,type='text/plain; charset=utf-8'){res.writeHead(status,{'Content-Type':type});res.end(msg);}
function sign(raw){return createHmac('sha256',key).update(raw).digest('base64url');}
function token(){const data=Buffer.from(JSON.stringify({exp:Date.now()+ttl*1000,nonce:randomBytes(12).toString('hex')})).toString('base64url');return data+'.'+sign(data);}
function authorized(req){const x=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='));if(!x)return false;const t=x.slice(cookieName.length+1);if(t.length>400)return false;const i=t.lastIndexOf('.');if(i<1)return false;const a=Buffer.from(sign(t.slice(0,i))),b=Buffer.from(t.slice(i+1));if(a.length!==b.length||!timingSafeEqual(a,b))return false;try{let p=JSON.parse(Buffer.from(t.slice(0,i),'base64url'));return Number.isSafeInteger(p.exp)&&p.exp>Date.now()&&p.exp<Date.now()+ttl*1000+60000;}catch{return false;}}
function sessionCookie(t,age=ttl){return cookieName+'='+t+'; Path=/; Max-Age='+age+'; HttpOnly; Secure; SameSite=Strict';}
function login(failed=false){return '<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wanderer Private Playtest</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#12131b;color:#f3e0c7;font-family:system-ui}main{width:min(420px,calc(100% - 40px));padding:28px;border:1px solid #5f5272;background:#252433;border-radius:12px;box-sizing:border-box}h1{font-family:Georgia,serif}label{display:block;margin-top:14px}input{width:100%;box-sizing:border-box;margin-top:6px;padding:12px;background:#131521;border:1px solid #80708f;color:#fff;border-radius:6px;font:inherit}button{width:100%;margin-top:22px;padding:12px;border-radius:7px;background:#775a93;color:white;font:inherit;font-weight:bold;cursor:pointer}p{color:#c5bacc}.error{color:#ffbbbb}</style></head><body><main><h1>WANDERER</h1><p>Private development playtest · v0.12</p>'+(failed?'<p class="error">Credenciais inválidas ou demasiadas tentativas.</p>':'')+'<form action="/login" method="POST"><label>Nome<input name="username" required autocomplete="username"></label><label>Password<input type="password" name="password" required autocomplete="current-password"></label><button type="submit">Entrar</button></form></main></body></html>';}
function checkOrigin(req){try{const u=new URL(req.headers.origin);return u.host.toLowerCase()===String(req.headers.host||'').toLowerCase()&&(u.protocol==='https:'||(!prod&&u.protocol==='http:'));}catch{return false;}}
function ip(req){return String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0].trim().slice(0,100);}
function staticFile(req,res,pathname){
 let decoded;try{decoded=decodeURIComponent(pathname);}catch{return send(res,400,'Bad URL');}
 if(decoded.includes('\0')||decoded.includes('\\'))return send(res,400,'Bad URL');
 const name=decoded==='/'?'index.html':decoded.replace(/^\/+/,'');
 if(name.split('/').some(p=>p.startsWith('.')||['preview','tests','docs','scripts','node_modules','package.json','package-lock.json','firebase.json','firestore.rules','firestore.indexes.json'].includes(p)))return send(res,404,'Not found');
 const full=resolve(root,name),rel=relative(root,full);
 if(rel==='..'||rel.startsWith('..'+sep)||rel.startsWith('/'))return send(res,404,'Not found');
 const type=types[extname(full)];if(!type)return send(res,404,'Not found');
 try{const stat=statSync(full);if(!stat.isFile())return send(res,404,'Not found');res.writeHead(200,{'Content-Type':type,'Content-Length':stat.size});if(req.method==='HEAD'){res.end();return;}createReadStream(full).on('error',()=>res.destroy()).pipe(res);}catch{send(res,404,'Not found');}
}
const server=createServer(async(req,res)=>{
 headers(res);const url=new URL(req.url||'/','http://localhost'),pathname=url.pathname;
 if(pathname==='/__health')return send(res,200,'OK');
 if(prod&&req.headers['x-forwarded-proto']!=='https')return send(res,403,'HTTPS required');
 if(pathname==='/login'&&req.method==='GET'){if(authorized(req)){res.writeHead(303,{Location:'/?playtest=v012'});return res.end();}res.setHeader('Content-Security-Policy',"default-src 'none';style-src 'unsafe-inline';form-action 'self';base-uri 'none';frame-ancestors 'none'");return send(res,200,login(),'text/html; charset=utf-8');}
 if(pathname==='/login'&&req.method==='POST'){
  if(!checkOrigin(req))return send(res,403,'Origin denied');
  const k=ip(req),now=Date.now();for(const [a,b] of tries)if(b.until<now)tries.delete(a);
  const t=tries.get(k);if(t&&t.n>=6&&t.until>now)return send(res,429,login(true),'text/html; charset=utf-8');
  let form='';try{for await(const chunk of req){form+=chunk;if(form.length>2048)return send(res,413,'Too large');}}catch{return send(res,400,'Bad request');}
  const data=new URLSearchParams(form),u=String(data.get('username')||'').slice(0,128),p=String(data.get('password')||'').slice(0,128);
  const actual=scryptSync(p,salt,64),ok=timingSafeEqual(actual,expected)&&u===user;
  if(!ok){if(!t||t.until<now)tries.set(k,{n:1,until:now+15*60*1000});else t.n++;return send(res,401,login(true),'text/html; charset=utf-8');}
  tries.delete(k);res.writeHead(303,{Location:'/?playtest=v012','Set-Cookie':sessionCookie(token())});return res.end();
 }
 if(pathname==='/logout'&&req.method==='POST'){if(!checkOrigin(req))return send(res,403,'Origin denied');res.writeHead(303,{Location:'/login','Set-Cookie':sessionCookie('',0)});return res.end();}
 if(!authorized(req)){if((req.method==='GET'||req.method==='HEAD')&&(pathname==='/'||pathname.endsWith('.html'))){res.writeHead(303,{Location:'/login'});return res.end();}return send(res,401,'Sign in required');}
 if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,'Method not allowed');
 return staticFile(req,res,pathname);
});
server.listen(port,'0.0.0.0',()=>console.log('Wanderer private preview ready on port '+port));
