// Private administrator utility: export Firestore playtest feedback into a private Google Sheet.
// Requires npm packages firebase-admin and googleapis in the admin environment.
// Never import this file in browser code.
import {initializeApp,cert} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {google} from 'googleapis';

const json=process.env.WANDERER_FEEDBACK_SERVICE_ACCOUNT_JSON;
const spreadsheetId=process.env.WANDERER_FEEDBACK_SHEET_ID;
if(!json||!spreadsheetId)throw new Error('Missing service account secret or feedback Sheet ID');
const serviceAccount=JSON.parse(json);
const auth=new google.auth.JWT({email:serviceAccount.client_email,key:serviceAccount.private_key,scopes:['https://www.googleapis.com/auth/spreadsheets']});
const sheets=google.sheets({version:'v4',auth});
const db=getFirestore(initializeApp({credential:cert(serviceAccount)}));

const sheetRange='Respostas!A:O',idRange='Respostas!A2:A';
const existing=(await sheets.spreadsheets.values.get({spreadsheetId,range:idRange})).data.values||[];
const exported=new Set(existing.flat().map(String).filter(Boolean));
let cursor=null,seen=0,added=0;
const nicknameCache=new Map();
async function nickname(uid){
 if(nicknameCache.has(uid))return nicknameCache.get(uid);
 const profile=await db.doc('publicProfiles/'+uid).get();
 const value=profile.exists?String(profile.data()?.nickname||''):'';
 nicknameCache.set(uid,value);return value;
}
while(true){
 let query=db.collection('feedbackInbox').orderBy('createdAt','asc').limit(300);
 if(cursor)query=query.startAfter(cursor);
 const snapshot=await query.get();
 if(snapshot.empty)break;
 const rows=[];
 for(const doc of snapshot.docs){
  seen++;
  if(exported.has(doc.id))continue;
  const d=doc.data(),created=d.createdAt?.toDate?.();
  rows.push([doc.id,created?created.toISOString():'',await nickname(d.uid),d.category||'',
    d.rating||'',d.combat||'',d.difficulty||'',d.likes||'',d.problems||'',d.ideas||'',
    d.maxDungeon||'',d.characterId||'',d.uid||'',d.appVersion||'','Novo']);
  exported.add(doc.id);
 }
 if(rows.length){
  await sheets.spreadsheets.values.append({
   spreadsheetId,range:sheetRange,valueInputOption:'RAW',insertDataOption:'INSERT_ROWS',
   requestBody:{values:rows}
  });
  added+=rows.length;
 }
 cursor=snapshot.docs.at(-1);
 if(snapshot.size<300)break;
}
console.log('Feedback exported. Checked:',seen,'Added:',added);
