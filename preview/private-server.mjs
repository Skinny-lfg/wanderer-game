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
const loginHTML=(error='',csrf='')=>`<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wanderer — Private Playtest</title><style>
html{font-family:system-ui,sans-serif;background:#0d0e15;color:#eee;color-scheme:dark}
body{min-height:100svh;display:grid;place-items:center;margin:0;padding:20px;box-sizing:border-box;background:radial-gradient(ellipse at 50% 0,#352639,#101119 66%)}
main{max-width:390px;width:100%;box-sizing:border-box;padding:30px;border:1px solid #5b4e65;background:#1b1a26;border-radius:15px;box-shadow:0 12px 50px #0008}
h1{font-family:Georgia,serif;color:#e7c9a8;letter-spacing:.10em;text-align:center;margin:0 0 7px}
small,p{color:#bcb5c3}p{text-align:center;line-height:1.6;font-size:14px;margin-bottom:22px}
label{display:block;font-size:13px;margin:15px 0 7px;color:#dfd4e1}
input{box-sizing:border-box;width:100%;border-radius:9px;border:1px solid #766484;background:#11121c;color:#fff;padding:13px;font:inherit}
button{width:100%;border-radius:9px;border:1px solid #aa8fbb;background:#695478;color:#fff;padding:13px;font:700 15px system-ui,sans-serif;margin-top:22px;cursor:pointer}
strong{display:block;color:#f2a7a7;margin-top:16px;font-size:13px;text-align:center}
</style></head><body><main><h1>WANDERER</h1><p>Private v0.12 Playtest<br>Access restricted to the tester.</p><form method="post" action="/__preview/login" autocomplete="off"><input type="hidden" name="_csrf" value="${csrf}"><label for="user">Username</label><input id="user" name="username" required maxlength="128" autocomplete="username" spellcheck="false"><label for="pass">Password</label><input id="pass" name="password" type="password" required maxlength="256" autocomplete="current-password"><button type="submit">Enter Playtest</button></form>${error?'<strong>Invalid credentials, expired form, or too many attempts. Retry or reload.</strong>':''}<p><small>This playtest uses isolated local saves.</small></p></main></body></html>`;
const PLAYTEST_URL='/?expeditionPhase1=1&expeditionSave=1';
function securityHeaders(res){
 res.setHeader('Cache-Control','no-store, private');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('X-Frame-Options','DENY');
 res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('Permissions-Policy','camera=(),microphone=(),geolocation=()');
 res.setHeader('Content-Security-Policy',"default-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self'");
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
 const sessions=new Map(), attempts=new Map(), formTokens=new Map();
 const authHash=digest(password),userHash=digest(username);
 function showLogin(res,status=200,error='',method='GET'){
  const now=Date.now();
  for(const [key,expiry] of formTokens)if(expiry<=now)formTokens.delete(key);
  while(formTokens.size>=1024)formTokens.delete(formTokens.keys().next().value);
  const token=randomBytes(24).toString('hex');
  formTokens.set(digest(token).toString('hex'),now+10*60*1000);
  return send(res,status,'text/html; charset=utf-8',loginHTML(error,token),method);
 }
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
   if(method==='GET')return showLogin(res,200,'',method);
   if(method!=='POST')return serveGuardError(res,405,'Method not allowed',method);
   const bucket=rateLimit(req);
   if(bucket.count>=LIMIT)return showLogin(res,429,'rate',method);
   try{
    // A one-use form token protects this endpoint without relying on browser
    // Origin headers, which can be rewritten or sent as "null" in embedded browsers.
    const form=await formBody(req);
    const csrf=String(form.get('_csrf')||'');
    const csrfHash=digest(csrf).toString('hex');
    const expiry=formTokens.get(csrfHash);
    formTokens.delete(csrfHash);
    if(!/^[a-f0-9]{48}$/.test(csrf)||!expiry||expiry<Date.now()){
     return showLogin(res,403,'form',method);
    }
    const sentUser=digest(form.get('username')||''),sentPassword=digest(form.get('password')||'');
    if(!timingSafeEqual(sentUser,userHash)||!timingSafeEqual(sentPassword,authHash)){
     bucket.count++;return showLogin(res,401,'wrong',method);
    }
    bucket.count=0;
    const token=randomBytes(32).toString('hex');
    sessions.set(digest(token).toString('hex'),Date.now()+SESSION_MS);
    if(sessions.size>4096)for(const [key,expiry] of sessions)if(expiry<Date.now())sessions.delete(key);
    res.setHeader('Set-Cookie',`${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${allowLocalHttp?'':'; Secure'}`);
    return redirect(res,PLAYTEST_URL);
   }catch{return serveGuardError(res,400,'Invalid login request',method);}
  }
  if(!validSession(req))return redirect(res,'/__preview/login');
  if(pathname==='/__preview/logout'){
   if(method!=='POST')return serveGuardError(res,405,'Method not allowed',method);
   const token=parseCookies(req.headers.cookie)[COOKIE];if(token)sessions.delete(digest(token).toString('hex'));
   res.setHeader('Set-Cookie',`${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${allowLocalHttp?'':'; Secure'}`);
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
    const query=new URL(sourceUrl,'http://preview.local').searchParams;
    if(query.get('expeditionPhase1')!=='1'||query.get('expeditionSave')!=='1')return redirect(res,PLAYTEST_URL);
    // Defense in depth: the private preview never loads the account or prototype bootstraps.
    body=Buffer.from(body.toString('utf8')
     .replace(/<script\b[^>]*id=["'](?:onlineAccountLoader|v012PrototypeLoader)["'][^>]*>[\s\S]*?<\/script>/gi,'')
     .replace(/<script\b[^>]*src=["'][^"']*online\/(?:app|v012-prototype)\.mjs[^"']*["'][^>]*>[\s\S]*?<\/script>/gi,''),'utf8');
   }
   if(relative==='index.html'){
    // The integrated game lives in a trusted inline script. CSP script-src
    // 'self' alone blocks that script on Safari (blank app after login).
    // Allow only the actual served script by its SHA-256, not unsafe-inline.
    const html=body.toString('utf8');
    const hashes=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
     .filter(([,attributes,code])=>!/\bsrc\s*=/.test(attributes)&&code.trim())
     .map(([, ,code])=>"'sha256-"+createHash('sha256').update(code,'utf8').digest('base64')+"'");
    if(hashes.length){
     const policy=String(res.getHeader('Content-Security-Policy')||'');
     res.setHeader('Content-Security-Policy',policy.replace("script-src 'self'","script-src 'self' "+hashes.join(' ')));
    }
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
