// Render compact tables from the B.3 paired aggregate; output is reviewed in docs/.
const data=require(process.argv[2]||'/tmp/v012-phase-b3-aggregate.json');
const sum=(rows,key)=>rows.reduce((n,r)=>n+r[key],0);
const avg=(rows,key)=>+(sum(rows,key)/rows.length).toFixed(1);
const winHp=rows=>sum(rows,'wins')?+(rows.reduce((n,r)=>n+r.hpRemainingWins*r.wins,0)/sum(rows,'wins')).toFixed(1):0;
const same=(rows,key)=>sum(rows,key)+'/128';
const pair=(a,b)=>`${a} → ${b}`;
const buildOrder=['Staff','Wand + Orb','Sword + Shield','Mace + Shield','Dual Daggers','Bow','Two-Handed'];
let out='### Efeito do perfil de affinities, sem alterar armas\n\n';
out+='Cada célula mostra vitórias/128 (triple + random), Realm média, DPS e HP restante médio nas vitórias. As políticas mantêm 64 seeds cada.\n\n';
out+='| E | Arma | Perfil A: vitórias · Realm · DPS · HP | Perfil B: vitórias · Realm · DPS · HP |\n|--:|:--|:--|:--|\n';
for(const E of [50,100,200])for(const build of buildOrder){
 const rows=data.profiles.filter(r=>r.E===E&&r.build===build);
 if(!rows.length){const s=data.summaries.filter(r=>r.E===E&&r.build===build&&r.mode==='control');out+=`| ${E} | ${build} | ${sum(s,'wins')}/128 · ${avg(s,'realm')} · ${avg(s,'dps')} · ${winHp(s)} | controlo único |\n`;continue;}
 const summaries=[0,1].map(i=>{const s=data.summaries.filter(r=>r.E===E&&r.build===build&&r.mode==='control'&&r.profile===(i?rows[0].profileB:rows[0].profileA));return `${sum(s,'wins')}/128 · ${avg(s,'realm')} · ${avg(s,'dps')} · ${winHp(s)}`;});
 out+=`| ${E} | ${build} | ${summaries[0]} | ${summaries[1]} |\n`;
}
out+='\n### Candidatos isolados contra o controlo atual\n\n';
out+='Cada linha reúne 128 pares (64 triple + 64 random). Vitórias mostram o total e, entre parênteses, triple/random separadamente. HP é a média nas vitórias; dano recebido e Barrier/s são médias de todas as corridas. Prefixo mostra quantos dos 128 pares mantiveram as mesmas escolhas de rotas e passivos enquanto ambas as runs estavam ativas.\n\n';
out+='| E | Arma · perfil | Vitórias C → V (triple/random) | Realm C → V | DPS C → V | HP C → V | Dano recebido C → V | Barrier/s C → V | Prefixo rota/passivo |\n|--:|:--|:--|:--|:--|:--|:--|:--|:--|\n';
for(const E of [50,100,200])for(const build of buildOrder){
 const profileNames=[...new Set(data.pairs.filter(r=>r.E===E&&r.build===build).map(r=>r.profile))];
 for(const profile of profileNames){const rows=data.pairs.filter(r=>r.E===E&&r.build===build&&r.profile===profile),c=rows.map(r=>r.control),v=rows.map(r=>r.candidate),tr=rows.find(r=>r.policy==='triple'),ra=rows.find(r=>r.policy==='random');
  const wins=`${sum(c,'wins')}/128 → ${sum(v,'wins')}/128 (${tr.control.wins}→${tr.candidate.wins} / ${ra.control.wins}→${ra.candidate.wins})`;
  out+=`| ${E} | ${build} · ${profile} | ${wins} | ${pair(avg(c,'realm'),avg(v,'realm'))} | ${pair(avg(c,'dps'),avg(v,'dps'))} | ${pair(winHp(c),winHp(v))} | ${pair(avg(c,'damageReceived'),avg(v,'damageReceived'))} | ${pair(avg(c,'barrier'),avg(v,'barrier'))} | ${sum(rows,'routePrefix')}/${sum(rows,'passivePrefix')} |\n`;
 }
}
out+='\nNota: a média de HP das vitórias pode mudar quando o conjunto de vencedores muda. A diferença de HP pareada com derrotas a zero, as mudanças de Realm e dano recebido foram consultadas antes das decisões.\n';
process.stdout.write(out);
