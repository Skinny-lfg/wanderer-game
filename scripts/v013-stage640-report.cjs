'use strict';

const fs = require('node:fs');
const path = require('node:path');
const [beforeFile, afterFile, matchedBeforeFile, matchedAfterFile, outDir] = process.argv.slice(2);
if (!outDir) throw Error('Usage: node scripts/v013-stage640-report.cjs BASE.json CANDIDATE.json FIXED_BASE.json FIXED_CANDIDATE.json OUT_DIR');
const read = file => JSON.parse(fs.readFileSync(file));
const baseline = read(beforeFile), candidate = read(afterFile);
const fixed = [read(matchedBeforeFile), read(matchedAfterFile)];
const profiles = ['balanced', 'smart-fury-bow', 'leather-duelist', 'plate-warden', 'hexblade-hybrid'];
const key = a => a.id + '/' + a.seed;
const accountKeys = run => run.accounts.map(key).sort().join(',');
if (baseline.accounts.length !== 500 || candidate.accounts.length !== 500 ||
    new Set(baseline.accounts.map(key)).size !== 500 || accountKeys(baseline) !== accountKeys(candidate))
  throw Error('Expected 500 identical, distinct profile/seed pairs');
if (fixed[0].snapshots !== fixed[1].snapshots || fixed.some(run => run.rooms.length !== 525))
  throw Error('Expected matched native snapshots, 25 x 21 fights');
if (fixed[0].source !== baseline.source || fixed[1].source !== candidate.source)
  throw Error('Natural and matched source fingerprints differ');
const roomKey = r => [r.id, r.seed, r.encounter, r.gear].join('/');
if (fixed[0].rooms.map(roomKey).sort().join(',') !== fixed[1].rooms.map(roomKey).sort().join(','))
  throw Error('Mismatched gear or missing pair');
const sets = [baseline, candidate].map(run => run.accounts.flatMap(a => a.rooms.map(r => ({...r, id:a.id}))));
const lines = [], csv = [['stage', 'E', 'profile', 'encounter', 'wins', 'resolved', 'censored']];
function stats(rows) {
  const wins = rows.filter(r => r.won).length;
  const resolved = rows.filter(r => r.won || r.died).length;
  return { wins, resolved, censored: rows.length - resolved };
}
function rate(rows) {
  const {wins,resolved,censored} = stats(rows);
  return (resolved ? wins + '/' + resolved + ' (' + (100*wins/resolved).toFixed(1) + '%)' : '—') +
    (censored ? ' +' + censored + ' cens.' : '');
}
const pair = rows => rows.map(rate).join(' → ');
function table(headers, body) {
  for (const row of [headers, headers.map(()=>'---'), ...body]) lines.push('| '+row.join(' | ')+' |');
  lines.push('');
}
const specific = r => r.kind === 'combat' ? 'normal-' + Math.min(5,r.size) : r.kind+'-'+(r.elite || r.boss);
const encounters = [...new Set(sets.flat().map(specific))].sort();
const categories = ['combat', 'elite', 'boss', ...encounters];
const match = (r,c) => r.kind === c || specific(r) === c;
const levelSets = level => sets.map(rows => rows.filter(r => r.level === level));
lines.push('# Stage 6.40 — resultados de combate', '',
  'Cada célula apresenta vitórias do jogador / combates resolvidos, antes → depois. As contas começam na E1, usam equipamento, talentos, poções e decisões do agente adaptativo e só chegam à E2 por vitória real. Cada versão tem 100 estratégias × cinco sementes ('+baseline.seeds.join(', ')+'), até 12 tentativas por nível. Os mesmos agentes podem encontrar salas diferentes depois da calibração. Uma conta pode contribuir com várias salas.', '',
  'Fonte nativa 6.39: `'+baseline.source+'`. Fonte 6.40: `'+candidate.source+'`. Checkpoints emparelhados: `'+fixed[0].snapshots+'`.', '',
  '## Progressão natural', '',
  'Alcançaram a E2 '+baseline.accounts.filter(a=>a.reachedE2).length+'/500 → '+candidate.accounts.filter(a=>a.reachedE2).length+'/500 contas. Os valores E2 referem-se aos sobreviventes de cada versão.', '');
table(['Encontro', 'E1 antes → depois', 'E2 antes → depois'], categories.map(c=>[c,...[1,2].map(e=>pair(levelSets(e).map(rs=>rs.filter(r=>match(r,c)))))]));
lines.push('## Tamanho e composição das salas normais', '',
  'Contagem inicial do motor, incluindo reservas. A composição distingue salas com pelo menos metade de Minions das restantes. A linha 5+ da tabela anterior junta todos os tamanhos a partir de cinco.', '');
const groups=[];
for (const n of Array.from({length:22},(_,i)=>i+1)) {
  const row = [String(n)];
  for (const e of [1,2]) row.push(pair(levelSets(e).map(rs=>rs.filter(r=>r.kind==='combat'&&r.size===n))));
  groups.push(row);
}
table(['Inimigos iniciais','E1','E2'],groups);
table(['Composição E1','Sem AoE equipado','Com AoE equipado'],['2–4','5+'].flatMap((bucket,i)=>[false,true].map(many=>[
  bucket+' / '+(many?'≥50% Minions':'<50% Minions'), ...[false,true].map(aoe=>pair(levelSets(1).map(rs=>rs.filter(r=>r.kind==='combat'&&r.size>=2&&(i?r.size>=5:r.size<=4)&&(r.minions*2>=r.size)===many&&r.aoe===aoe))))])));
lines.push('## Estratégias e AoE na progressão natural', '',
  'Balanced representa o generalista inicial, smart-fury-bow procura AoE com Bow, leather-duelist prioriza alvo único, plate-warden privilegia defesa/sustain e hexblade-hybrid mistura combate físico e mágico. O nome da estratégia expressa uma preferência. A capacidade de AoE é medida por sala, a partir da arma e dos talentos efetivamente equipados. Sem AoE e single-target podem coincidir. O ficheiro CSV contém contagens por estratégia, nível e encontro, incluindo células vazias.', '');
const profileRows=[...profiles.map(id=>[id,r=>r.id===id]),['Sem AoE efetivo',r=>!r.aoe],['Com AoE efetivo',r=>r.aoe]];
table(['Perfil / condição E1','Normal','Elite','Boss'], profileRows.map(([id,fn])=>[id,...['combat','elite','boss'].map(k=>pair(levelSets(1).map(rs=>rs.filter(r=>r.kind===k&&fn(r)))))]));
lines.push('## Repetição com equipamento e personagem fixos', '',
  '25 personagens reais da 6.39, cinco estratégias × cinco sementes. Para cada uma, usou-se o acampamento da primeira tentativa que chegou ao Boss, ou o da última tentativa disponível. Cada personagem foi repetida contra sete tamanhos de grupo, oito Elites e seis Bosses em cada versão, com o mesmo equipamento, talentos, XP, nível, Risk 1 e semente. O replay controlado simula combate isolado a partir de HP cheio, sem poções automáticas. A progressão natural da secção anterior inclui preparação, consumíveis e desgaste da dungeon.', '');
const fixedRows = fixed.map(x=>x.rooms.map(r=>({...r,died:!r.won})));
const ids = [...new Set(fixedRows[0].map(r=>r.encounter))];
table(['Encontro E1','Todos',...profiles],ids.map(id=>[id,...[null,...profiles].map(p=>pair(fixedRows.map(rs=>rs.filter(r=>r.encounter===id&&(!p||r.id===p)))))]));
const mean = (rs, fn) => rs.length ? (rs.reduce((n,r)=>n+fn(r),0)/rs.length).toFixed(1) : '—';
lines.push('### Duração, pressão e atributos dos líderes', '',
  'Médias sobre os 25 combates de cada identidade, incluindo derrotas. Dano é o total recebido pelo jogador, incluindo escoltas e habilidades. O intervalo indicado é o ataque básico do líder; as habilidades têm os seus próprios temporizadores.', '');
const named = ids.filter(id=>!id.startsWith('group-'));
table(['Identidade','HP base','ATK','DEF','Intervalo (s)','Duração (s)','Dano recebido','Ativações de inimigos','Invocações'],named.map(id=>{
  const rows=fixedRows.map(rs=>rs.filter(r=>r.encounter===id));
  const fields=[r=>r.leader.maxHp,r=>r.leader.attack,r=>r.leader.defense,r=>r.leader.attackEvery,
    r=>r.seconds,r=>r.damage,r=>r.casts,r=>r.summons];
  return [id,...fields.map(fn=>rows.map(rs=>mean(rs,fn)).join(' → '))];
}));
lines.push('### Acesso efetivo a AoE nos checkpoints fixos', '',
  'Cada grupo usa as mesmas personagens antes e depois; as personagens com e sem AoE têm equipamento e progressão diferentes entre si. O ensaio não identifica um efeito causal de ter AoE.', '');
table(['Tamanho','Sem AoE','Com AoE'],ids.filter(id=>id.startsWith('group-')).map(id=>[id,...[false,true].map(flag=>pair(fixedRows.map(rs=>rs.filter(r=>r.encounter===id&&r.aoe===flag))))]));
lines.push('## Alcance da medição', '',
  'Percentagens por identidade podem ser instáveis com poucas observações, sobretudo nos cinco confrontos por estratégia do ensaio emparelhado. O estudo natural usa agentes heurísticos e cinco sementes, com exposição desigual aos reinos e repetição de salas por personagem. As metas são referências para a população de progressão normal.', '');
for (const [i, stage] of ['6.39','6.40'].entries()) {
  for (const e of [1,2]) for(const id of new Set(baseline.accounts.map(a=>a.id))) {
    const subset=sets[i].filter(r=>r.level===e&&r.id===id);
    for(const c of categories) {
      const s=stats(subset.filter(r=>match(r,c)));
      csv.push([stage,e,id,c,s.wins,s.resolved,s.censored]);
    }
  }
}
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'v013-stage640-calibration-results.md'),lines.join('\n')+'\n');
fs.writeFileSync(path.join(outDir,'v013-stage640-profile-counts.csv'),csv.map(row=>row.join(',')).join('\n')+'\n');
