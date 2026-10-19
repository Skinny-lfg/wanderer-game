// Server-side access gate for the isolated Wanderer v0.12 online playtest.
// It NEVER reads/writes Firebase credentials or production saves.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const COOKIE='wanderer_preview_session';
const SESSION_MS=12*60*60*1000;
const RATE_WINDOW_MS=15*60*1000;
const LOGIN_MAX_BYTES=4096;
const LIMIT=12;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.ico':'image/x-icon','.json':'application/json','.woff':'font/woff','.woff2':'font/woff2','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const digest=v=>createHash('sha256').update(String(v)).digest();
const same=(a,b)=>timingSafeEqual(digest(a),digest(b));
const loginHTML=(error='')=>\`<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wanderer — Private Playtest</title><style>
html{font-family:system-ui,sans-serif;background:#0d0e15;color:#eee;color-scheme:dark}
body{min-height:100svh;display:grid;place-items:center;margin:0;padding:20px;box-sizing:border-box;background:radial-gradient(ellipse at 50% 0,#352639,#101119 66%)}
main{max-width:390px;width:100%;box-sizing:border-box;padding:30px;border:1px solid #5b4e65;background:#1b1a26;border-radius:15px;box-shadow:0 12px 50px #0008}
h1{font-family:Georgia,serif;color:#e7c9a8;letter-spacing:.10em;text-align:center;margin:0 0 7px}
small,p{color:#bcb5c3}p{text-align:center;line-height:1.6;font-size:14px;margin-bottom:22px}
label{display:block;font-size:13px;margin:15px 0 7px;color:#dfd4e1}
input{box-sizing:border-box;width:100%;border-radius:9px;border:1px solid #766484;background:#11121c;color:#fff;padding:13px;font:inherit}
button{width:100%;border-radius:9px;border:1px solid #aa8fbb;background:#695478;color:#fff;padding:13px;font:700 15px system-ui,sans-serif;margin-top:22px;cursor:pointer}
strong{display:block;color:#f2a7a7;margin-top:16px;font-size:13px;text-align:center}
</style></head><body><main><h1>WANDERER</h1><p>Private v0.12 Playtest<br>Access restricted to the tester.</p><form method="post" action="/__preview/login" autocomplete="off"><label for="user">Username</label><input id="user" name="username" required maxlength="128" autocomplete="username" spellcheck="false"><label for="pass">Password</label><input id="pass" name="password" type="password" required maxlength="256" autocomplete="current-password"><button type="submit">Enter Playtest</button></form>\${error?'<strong>Invalid credentials or too many attempts.</strong>':''}<p><small>This prototype does not use production player saves.</small></p></main></body></html>\`;
function securityHeaders(res){
 res.setHeader('Cache-Control','no-store, private');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('X-Frame-Options','DENY');
 res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('Permissions-Policy','camera=(),microphone=(),geolocation=()');
 res.setHeader('Content-Security-Policy',"default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self'");
}
function send(res,status,type,body,method='GET'){
 res.statusCode=status;res.setHeader('Content-Type',type);
 res.end(method==='HEAD'?'':body);
}
function redirect(res,url){res.statusCode=303;res.setHeader('Location',url);res.end();}
function parseCookies(s){
 const o={};for(const token of (s||'').split(';')){const i=token.indexOf('=');if(i>0)o[token.slice(0,i).trim()]=token.slice(i+1).trim();}
 return o;
}
function serveGuardError(res,status,msg,method){send(res,status,'text/plain; charset=utf-8',msg,method);}
async function formBody(req){
 let bytes=0,parts=[];
 for await(const c of req){bytes+=c.length;if(bytes>LOGIN_MAX_BYTES)throw Error('Form too large');parts.push(c);}
 return new URLSearchParams(Buffer.concat(parts).toString('utf8'));
}
const allowedFolders=['assets','online','combat'];
export function createPrivatePreviewServer({
 root=ROOT,
 username=process.env.PREVIEW_USERNAME,
 password=process.env.PREVIEW_PASSWORD,
 allowLocalHttp=process.env.PREVIEW_DEV_HTTP==='1',
}={}){
 if(typeof username!=='string'||!username||username.length>128)throw Error('Set PREVIEW_USERNAME in hosting secret environment variables');
 if(typeof password!=='string'||password.length<12||password.length>256)throw Error('Set a strong PREVIEW_PASSWORD (12–256 characters) in hosting secret environment variables');
 root=path.resolve(root);
 const sessions=new Map(), attempts=new Map();
 const authHash=digest(password),userHash=digest(username);
 function validSession(req){
  const token=parseCookies(req.headers.cookie)[COOKIE];
  if(!token||!(/^[a-f0-9]{64}$/.test(token)))return false;
  const hash=digest(token).toString('hex'),until=sessions.get(hash);
  if(!until||until<Date.now()){sessions.delete(hash);return false;}
  return true;
 }
 function rateKey(req){return req.socket.remoteAddress||'anonymous';}
 function rateLimit(req){
  const key=rateKey(req),now=Date.now(),v=attempts.get(key)||{count:0,start:now};
  if(now-v.start>RATE_WINDOW_MS){v.count=0;v.start=now;}
  attempts.set(key,v);return v;
 }
 return http.createServer(async(req,res)=>{
  securityHeaders(res);
  const method=req.method||'GET';
  const sourceUrl=req.url||'/';
  let pathname;
  try{pathname=new URL(sourceUrl,'http://preview.local').pathname;}catch{return serveGuardError(res,400,'Bad request',method);}
  const isLogin=pathname==='/__preview/login';
  // HTTPS is mandatory on the public host. Use PREVIEW_DEV_HTTP=1 only for local tests.
  const encrypted=req.socket.encrypted||String(req.headers['x-forwarded-proto']||'').split(',')[0].trim()==='https';
  if(!encrypted&&!allowLocalHttp)return serveGuardError(res,403,'HTTPS required',method);
  if(isLogin){
   if(method==='GET')return send(res,200,'text/html; charset=utf-8',loginHTML(),method);
   if(method!=='POST')return serveGuardError(res,405,'Method not allowed',method);
   const bucket=rateLimit(req);
   if(bucket.count>=LIMIT)return send(res,429,'text/html; charset=utf-8',loginHTML('rate'),method);
   try{
    const origin=req.headers.origin;
    if(origin){const expected=(encrypted?'https://':'http://')+req.headers.host;if(origin!==expected)return serveGuardError(res,403,'Origin mismatch',method);}
    const form=await formBody(req);
    const sentUser=digest(form.get('username')||''),sentPassword=digest(form.get('password')||'');
    if(!timingSafeEqual(sentUser,userHash)||!timingSafeEqual(sentPassword,authHash)){
     bucket.count++;return send(res,401,'text/html; charset=utf-8',loginHTML('wrong'),method);
    }
    bucket.count=0;
    const token=randomBytes(32).toString('hex');
    sessions.set(digest(token).toString('hex'),Date.now()+SESSION_MS);
    if(sessions.size>4096)for(const [key,expiry] of sessions)if(expiry<Date.now())sessions.delete(key);
    res.setHeader('Set-Cookie',\`\${COOKIE}=\${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200\${allowLocalHttp?'':'; Secure'}\`);
    return redirect(res,'/?playtest=v012');
   }catch{return serveGuardError(res,400,'Invalid login request',method);}
  }
  if(!validSession(req))return redirect(res,'/__preview/login');
  if(pathname==='/__preview/logout'){
   if(method!=='POST')return serveGuardError(res,405,'Method not allowed',method);
   const token=parseCookies(req.headers.cookie)[COOKIE];if(token)sessions.delete(digest(token).toString('hex'));
   res.setHeader('Set-Cookie',\`\${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0\${allowLocalHttp?'':'; Secure'}\`);
   return redirect(res,'/__preview/login');
  }
  if(!['GET','HEAD'].includes(method))return serveGuardError(res,405,'Method not allowed',method);
  let relative=pathname==='/'?'index.html':pathname.slice(1);
  try{relative=decodeURIComponent(relative);}catch{return serveGuardError(res,400,'Invalid path',method);}
  if(relative.includes('..')||relative.includes('\\\\')||relative.includes('\0'))return serveGuardError(res,403,'Forbidden',method);
  if(relative!=='index.html'&&!allowedFolders.includes(relative.split('/')[0]))return serveGuardError(res,404,'Not found',method);
  const file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep))return serveGuardError(res,403,'Forbidden',method);
  try{
   const st=await stat(file);if(!st.isFile())return serveGuardError(res,404,'Not found',method);
   const ext=path.extname(file);
   const type=MIME[ext];if(!type)return serveGuardError(res,404,'Not found',method);
   let body=await readFile(file);
   if(relative==='index.html'){
    let html=body.toString('utf8');
    // Disable classic Firebase authentication on this domain entirely; start the isolated playtest.
    html=html.replace(/<script type="module" src="online\/app\.mjs[^"]*"><\/script>/,'');
    body=Buffer.from(html,'utf8');
   }
   send(res,200,type,body,method);
  }catch{return serveGuardError(res,404,'Not found',method);}
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||8080);
 const server=createPrivatePreviewServer();
 server.listen(port,'0.0.0.0',()=>process.stdout.write('Protected Wanderer preview listening on port '+server.address().port+'\n'));
}
