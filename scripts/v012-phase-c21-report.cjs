// C.2.1 report generator. Reads only the local simulation JSON.
'use strict';
const fs=require('node:fs');
const input=process.argv[2]||'/tmp/wanderer-phase-c21-results.json';
const output=process.argv[3]||'docs/v012-phase-c21-legendary-calibration-results.md';
const result=JSON.parse(fs.readFileSync(input,'utf8'));
if(!result.complete||result.phase!=='C2.1'||!Array.isArray(result.rows))throw Error('Invalid audit result');
const rows=result.rows;
if(!rows.length||rows.some(r=>r.error||r.timeout))throw Error('Incomplete C.2.1 matrix');
const sums=new Map();
const key=(E,b,p,a)=>[E,b,p,a].join('|');
for(const r of rows){
 const k=key(r.E,r.build,r.profile,r.arm);
 if(!sums.has(k))sums.set(k,[]);
 sums.get(k).push(r);
}
const mean=(arr,k)=>arr.reduce((n,r)=>n+(Number(r[k])||0),0)/arr.length;
const metric=(E,b,p,a)=>{
 const rr=sums.get(key(E,b,p,a));if(!rr)return null;
 return {n:rr.length,wins:rr.filter(r=>r.win).length,barrier:mean(rr,'barrier'),heal:mean(rr,'heal'),
  dps:mean(rr,'dps'),realm:mean(rr,'reached'),ehp:mean(rr,'ehp')};
};
const fmt=n=>n.toFixed(1);
const groups=[...new Map(rows.filter(r=>r.arm==='base').map(r=>[[r.build,r.profile].join('|'),{build:r.build,profile:r.profile}])).values()];
const pairs=groups.filter(g=>g.profile.includes('+')),singles=groups.filter(g=>g.profile!=='none'&&!g.profile.includes('+'));
const report=[];
const add=(...lines)=>report.push(...lines);
add('# Wanderer v0.12 — C.2.1: calibração isolada Veil e Heartroot','',
 'Data: 2026-10-21. Branch: development. Simulador: scripts/v012-phase-c21-legendary-calibration.cjs.','',
 '**Simulação medida, não autorização para alterar os poderes.**','',
 '## Método','',
 '- Runtime real executado em VM isolada; ficheiro de combate modificado apenas em memória.',
 '- Gear sintético com atributos Epic equivalentes, Runas fixas, sem poções, upgrades de loot nem benefícios de eventos.',
 '- E50/E100/E200, 7 builds, estratégias triple/random, 64 seeds por política e perfis até 2 Legendaries.',
 '- Cada variante usa seeds pareadas; sobrevivência diferente pode alterar passivos/rotas posteriores.',
 '- Estes resultados não são taxas reais de vitória de jogadores. Sem alterações a main, Firebase, Railway ou saves.',
 '',
 '## Valores experimentais','',
 '| Efeito | Base | Experiência C.2.1 |','|---|---|---|',
 '| Veil Barrier (normal/Aegis) | 4% / 6% MaxHP | 2,5% / 4% MaxHP |',
 '| Veil bónus de ataque (normal/Aegis) | 30% / 45% base | 20% / 30% base |',
 '| Heartroot cura (normal/Vitality) | 0,30% / 0,45% HP/s | 0,20% / 0,30% HP/s |',
 '| Heartroot cap por Realm | 15% MaxHP | 10% MaxHP |','',
 'Total: **'+rows.length+' corridas**; 0 erros/timeouts.','',
 '## Pares prioritários — clears em 128 corridas','',
 '— = ajuste não aplicável ao perfil. Os valores de Barrier/s e Heal/s comparam base com a variante ajustada disponível.','');
for(const E of result.levels){
 add('### E'+E,'',
 '| Build | Dois Legendaries | Base | Veil | Heartroot | Ambos | Barrier/s | Cura/s |',
 '|---|---|---:|---:|---:|---:|---:|---:|');
 for(const g of pairs){
  const b=metric(E,g.build,g.profile,'base'),v=metric(E,g.build,g.profile,'veil'),
   h=metric(E,g.build,g.profile,'heartroot'),both=metric(E,g.build,g.profile,'both');
  const target=both||v||h;
  if(!b||!target||b.n!==128||target.n!==128)throw Error('Missing / incomplete pair '+E+g.build+g.profile);
  add('| '+g.build+' | '+g.profile+' | '+b.wins+' | '+(v?.wins??'—')+' | '+(h?.wins??'—')+
   ' | '+(both?.wins??'—')+' | '+fmt(b.barrier)+' → '+fmt(target.barrier)+
   ' | '+fmt(b.heal)+' → '+fmt(target.heal)+' |');
 }
 add('');
}
add('## Poderes isolados — clears em 128 corridas','',
 '| E | Build | Poder | Base → calibrado | Barrier/s base → calibrado | Cura/s base → calibrado |',
 '|---|---|---|---:|---:|---:|');
for(const E of result.levels)for(const g of singles){
 const arm=g.profile==='veil-thousand-seals'?'veil':'heartroot';
 const a=metric(E,g.build,g.profile,arm),b=metric(E,g.build,g.profile,'base');
 if(!a||!b||a.n!==128||b.n!==128)throw Error('Incomplete isolated case '+E+g.build+g.profile);
 add('| E'+E+' | '+g.build+' | '+g.profile+' | '+b.wins+' → '+a.wins+
  ' | '+fmt(b.barrier)+' → '+fmt(a.barrier)+' | '+fmt(b.heal)+' → '+fmt(a.heal)+' |');
}
let controls=0,changes=0;
for(const E of result.levels){
 const p='gravewake+eye-of-morrow',build='Leather Two-Handed';
 const base=sums.get(key(E,build,p,'base'))||[];
 const variant=new Map((sums.get(key(E,build,p,'both'))||[]).map(r=>[r.policy+'|'+r.seed,r]));
 for(const b of base){
  const a=variant.get(b.policy+'|'+b.seed);controls++;
  if(!a||a.win!==b.win||a.reached!==b.reached||a.dps!==b.dps||a.heal!==b.heal||a.barrier!==b.barrier)changes++;
 }
}
if(changes||controls!==384)throw Error('Negative control mismatch: '+changes+'/'+controls);
add('','## Controlo de regressão','',
 'Gravewake + Eye of Morrow, sem qualquer poder afetado pelos ajustes: **'+controls+' corridas pareadas, '+changes+' divergências**.','',
 '## Interpretação e decisão','',
 '- Comparar dispersão das vitórias e sustentação de cada build antes de escolher valores definitivos.',
 '- Prioridade: Verdant + Veil, Oathwall + Veil, Veil + Heartroot e Voidglass + Veil; preservar builds Cloth já fracas.',
 '- O controlo garante que as alterações não mudam builds sem os poderes ajustados nos cenários testados.',
 '- **Não alterar coeficientes de produção automaticamente.** Nenhum deploy, mudança de odds, saves ou Firebase.',
 '',
 'Os dados completos constam do artefacto GitHub Actions da C.2.1.','');
fs.writeFileSync(output,report.join('\n')+'\n');
console.log('C21_REPORT '+JSON.stringify({runs:rows.length,pairs:pairs.length,singles:singles.length,controls,changes,path:output}));
