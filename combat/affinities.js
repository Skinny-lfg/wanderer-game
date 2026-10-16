(function(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.WandererAffinities = api;
})(globalThis, function() {
  "use strict";
  const DEFINITIONS = {
    poison: { name: "Poison", base: { poisonMultiplier: 0.15 }, tiers: { 2: "+15% Poison damage.", 3: "Poison stacks reduce enemy direct damage by 1% each (max 6%); ends with the stacks.", 5: "Venom Burst: at 6 stacks, consume all stacks for 60% of remaining Poison damage, capped at one normal hit. 10s cooldown." }, signature: "Venom Burst", cooldown: 10 },
    bleed: { name: "Bleed", base: { bleedMultiplier: 0.15 }, tiers: { 2: "+15% Bleed damage.", 3: "Main hits against Bleeding targets grant +5% speed for 3s, up to 3 stacks; one stack per second.", 5: "Blood Hunt: against a Bleeding enemy at or below 30% HP, the next main hit deals +40% of a normal hit. 12s cooldown." }, signature: "Blood Hunt", cooldown: 12 },
    sunder: { name: "Sunder", base: { sunderBonus: 2 }, tiers: { 2: "+2 Armor reduction per Sunder application; enemy Armor cannot fall below 25% of its original value.", 3: "Enemies at or below half their original Armor take +8% direct damage.", 5: "Armor Shatter: a main hit against a vulnerable enemy removes Barrier up to one normal hit and delays its attack by 0.5s (boss: 0.2s). 12s cooldown; shared 4s delay immunity." }, signature: "Armor Shatter", cooldown: 12 },
    crit: { name: "Critical", base: { critBonus: 8 }, tiers: { 2: "+8 points to the Critical formula, before its speed adjustment; final chance remains capped at 65%.", 3: "Main-hit Criticals grant Focus, max 3; one charge per second. Focus expires after 6s without a gain.", 5: "Perfect Strike: consume 3 Focus for a guaranteed 1.75\xD7 critical main hit. 10s cooldown; this strike grants no Focus." }, signature: "Perfect Strike", cooldown: 10 },
    shield: { name: "Shield", base: { shieldBonus: 3 }, tiers: { 2: "+3 Barrier generation; also grants 3 Barrier per main attack. Total Barrier is capped at 30% max HP.", 3: "A Block primes a counter for 4s: 25% of blocked damage, capped at 25% of a normal hit. Does not stack; 3s cooldown.", 5: "Last Bastion: after receiving an attack with at least 10% max HP in Barrier remaining, prime a counter for 4s. The next main hit spends half the remaining Barrier for damage, capped at 50% of a normal hit. 12s cooldown." }, signature: "Last Bastion", cooldown: 12 },
    regen: { name: "Regen", base: { regenBonus: 2 }, tiers: { 2: "Recover 2 HP per second during combat.", 3: "25% of overhealing becomes Barrier; max 1% max HP per second and 10% per encounter. Total Barrier remains capped at 30%.", 5: "Second Wind: survive one lethal hit at 1 HP and gain 8% max HP as Barrier. Once per expedition, not per encounter; no invulnerability." }, signature: "Second Wind", cooldown: 0 },
    burn: { name: "Fire", base: { burnMultiplier: 0.15 }, tiers: { 2: "+15% Burn damage.", 3: "A damaging Burn tick grants 1 Heat per second regardless of stacks, max 5. Heat expires after 5s without a damaging Burn tick.", 5: "Flashover: consume 5 Heat on the next main hit for +50% of a normal hit. 10s cooldown; the explosion cannot create Burn or Heat." }, signature: "Flashover", cooldown: 10 },
    slow: { name: "Frost", base: { slowBonus: 0.25 }, tiers: { 2: "Slow increases the enemy attack interval by 25%; each application lasts 2.9s.", 3: "Chilled enemies deal 8% less direct damage. Combined set damage reduction is capped at 15%.", 5: "Deep Freeze: after 3s of continuous Chill, delay the next attack by 0.75s (boss: 0.25s). 12s cooldown; shared 4s delay immunity." }, signature: "Deep Freeze", cooldown: 12 },
    drain: { name: "Dark", base: { drainBonus: 0.15 }, tiers: { 2: "+15% life recovered by Drain.", 3: "Drain that restores HP grants a Soul Charge, max 3; one charge per second. Charges expire after 6s without a gain.", 5: "Soul Pact: with 3 charges and more than 40% HP, the next main hit spends 3% max HP to deal +40% of a normal hit. Recover 25% of its actual damage, capped at 4% max HP. 12s cooldown; cannot generate charges." }, signature: "Soul Pact", cooldown: 12 },
    nature: { name: "Nature", base: { natureBonus: 0.25 }, tiers: { 2: "+25% Nature healing proc.", 3: "Nature healing is 50% stronger below half HP.", 5: "Verdant Renewal: after surviving a hit at or below 35% HP, heal 8% max HP once per encounter." }, signature: "Verdant Renewal", cooldown: 0 },
    shock: { name: "Storm", base: { shockBonus: 0.25 }, tiers: { 2: "+25% Storm direct damage proc.", 3: "Every third main attack adds 15% base damage.", 5: "Thunderclap: every sixth main attack adds 35% base damage, 10s cooldown." }, signature: "Thunderclap", cooldown: 10 },
    tide: { name: "Tide", base: { tideBonus: 0.25 }, tiers: { 2: "+25% Tide Barrier proc.", 3: "While Barrier remains, enemy direct damage is reduced by 5% (15% combined cap).", 5: "High Tide: after surviving a hit with under 5% HP in Barrier, gain 8% max HP Barrier once per encounter." }, signature: "High Tide", cooldown: 0 }
  };
  const has = (r, e, tier) => Number(r.stats?.counts?.[e] || 0) >= tier;
  function bonuses(counts) {
    const list = [], values = {};
    for (const [effect, d] of Object.entries(DEFINITIONS)) {
      const tiers = [2, 3, 5].filter((t) => (counts[effect] || 0) >= t);
      if (!tiers.length) continue;
      Object.assign(values, d.base);
      if (tiers.includes(3)) values[effect + "Mechanic"] = true;
      if (tiers.includes(5)) values[effect + "Signature"] = true;
      list.push({ effect, title: d.name + " Set", tiers, desc: tiers.map((t) => t + " pieces: " + d.tiers[t]).join(" ") });
    }
    return { list, values };
  }
  function describe(effect, values) {
    const d = DEFINITIONS[effect];
    if (!d) return "";
    const active = Object.keys(d.base).some((k) => values[k] !== void 0);
    return active ? [d.tiers[2], values[effect + "Mechanic"] ? "3 pieces: " + d.tiers[3] : "", values[effect + "Signature"] ? "5 pieces: " + d.tiers[5] : ""].filter(Boolean).join(" ") : "No active bonus";
  }
  function state(r) {
    return r.affinityState || (r.affinityState = { time: 0, cooldowns: {}, secondWindUsed: false, natureRenewalUsed: false, tideSurgeUsed: false, shockHits: 0, focus: 0, focusUntil: 0, heat: 0, heatUntil: 0, souls: 0, soulsUntil: 0, speed: [], counter: 0, counterUntil: 0, bastionUntil: 0, chillHeld: 0, delayImmuneUntil: 0, regenGenerated: 0, regenWindow: -1, regenInWindow: 0, lastFocus: -1e9, lastSoul: -1e9, lastBleed: -1e9, lastHeat: -1e9, events: [] });
  }
  function emit(r, text, effect) {
    const a = state(r);
    a.events.push({ text, effect });
    if (a.events.length > 40) a.events.shift();
  }
  function drainEvents(r) {
    return state(r).events.splice(0);
  }
  function ready(r, e) {
    return (state(r).cooldowns[e] || 0) <= state(r).time;
  }
  function activate(r, e) {
    state(r).cooldowns[e] = state(r).time + DEFINITIONS[e].cooldown;
  }
  function beginEncounter(r) {
    const a = state(r);
    Object.assign(a, { shockHits: 0, natureRenewalUsed: false, tideSurgeUsed: false, focus: 0, heat: 0, souls: 0, speed: [], counter: 0, counterUntil: 0, bastionUntil: 0, chillHeld: 0, delayImmuneUntil: 0, regenGenerated: 0, regenWindow: -1, regenInWindow: 0, lastFocus: -1e9, lastSoul: -1e9, lastBleed: -1e9, lastHeat: -1e9 });
  }
  function barrier(r, amount) {
    const before = r.barrier || 0;
    r.barrier = Math.min(r.maxhp * 0.3, before + Math.max(0, amount));
    return r.barrier - before;
  }
  function heal(r, amount, source = "other") {
    const a = state(r), requested = Math.max(0, amount), actual = Math.min(Math.max(0, r.maxhp - r.hp), requested);
    r.hp += actual;
    if (has(r, "regen", 3)) {
      const window = Math.floor(a.time + 1e-7);
      if (a.regenWindow !== window) {
        a.regenWindow = window;
        a.regenInWindow = 0;
      }
      const gained = barrier(r, Math.max(0, Math.min((requested - actual) * 0.25, r.maxhp * 0.01 - a.regenInWindow, r.maxhp * 0.1 - a.regenGenerated)));
      a.regenInWindow += gained;
      a.regenGenerated += gained;
      if (gained > 0) emit(r, "Overhealing \u2192 +" + gained.toFixed(1) + " Barrier", "regen");
    }
    if (source === "drain" && actual > 0 && has(r, "drain", 3) && a.time - a.lastSoul >= 1 - 1e-7) {
      a.lastSoul = a.time;
      a.souls = Math.min(3, a.souls + 1);
      a.soulsUntil = a.time + 6;
      emit(r, "Soul Charge " + a.souls + "/3", "drain");
    }
    return actual;
  }
  function vulnerable(r) {
    return has(r, "sunder", 3) && r.enemy.baseDef > 0 && r.enemy.def <= r.enemy.baseDef * 0.5;
  }
  function incomingMultiplier(r) {
    const e = r.enemy, poison = has(r, "poison", 3) ? Math.min(6, e.dots?.poison?.length || 0) * 0.01 : 0, frost = has(r, "slow", 3) && e.slowTime > 0 ? 0.08 : 0, tide = has(r, "tide", 3) && r.barrier > 0 ? 0.05 : 0;
    return 1 - Math.min(0.15, poison + frost + tide);
  }
  function delay(r, normal, boss) {
    const a = state(r);
    if (a.time < a.delayImmuneUntil) return false;
    const amount = r.enemy.boss ? boss : normal;
    r.tEnemy = (r.tEnemy || 0) - amount;
    a.delayImmuneUntil = a.time + 4;
    return true;
  }
  function tick(r, dt) {
    const a = state(r);
    a.time += dt;
    a.speed = a.speed.filter((end) => end > a.time);
    if (a.time >= a.focusUntil) a.focus = 0;
    if (a.time >= a.soulsUntil) a.souls = 0;
    if (a.time >= a.heatUntil) a.heat = 0;
    if (a.time >= a.counterUntil) a.counter = 0;
    if (r.enemy.slowTime > 0) a.chillHeld += Math.min(dt, r.enemy.slowTime);
    else a.chillHeld = 0;
    if (has(r, "slow", 5) && a.chillHeld >= 3 && ready(r, "slow") && delay(r, 0.75, 0.25)) {
      activate(r, "slow");
      a.chillHeld = 0;
      emit(r, "Deep Freeze: next enemy attack delayed", "slow");
    }
  }
  function speedMultiplier(r) {
    return 1 + state(r).speed.length * 0.05;
  }
  function dotTick(r, burnDamage) {
    const a = state(r);
    if (burnDamage > 0 && has(r, "burn", 3) && Math.floor(a.time + 1e-7) > Math.floor(a.lastHeat + 1e-7)) {
      a.lastHeat = a.time;
      a.heat = Math.min(5, a.heat + 1);
      a.heatUntil = a.time + 5;
      emit(r, "Heat " + a.heat + "/5", "burn");
    }
  }
  function deal(r, damage) {
    let amount = Math.max(0, damage) * (vulnerable(r) ? 1.08 : 1), e = r.enemy;
    const absorbed = Math.min(e.barrier || 0, amount);
    e.barrier = (e.barrier || 0) - absorbed;
    amount = Math.min(Math.max(0, e.hp), amount - absorbed);
    e.hp -= amount;
    return amount;
  }
  function beforeAttack(r, base) {
    const a = state(r), e = r.enemy, out = { perfect: false, extra: [] };
    if (has(r, "shock", 3)) {
      a.shockHits++;
      if (a.shockHits % 3 === 0) out.extra.push({ effect: "shock", name: "Storm Rhythm", damage: base * 0.15 });
      if (has(r, "shock", 5) && a.shockHits % 6 === 0 && ready(r, "shock")) {
        activate(r, "shock");
        out.extra.push({ effect: "shock", name: "Thunderclap", damage: base * 0.35 });
      }
    }
    if (has(r, "sunder", 5) && vulnerable(r) && ready(r, "sunder")) {
      const broken = Math.min(e.barrier || 0, base);
      e.barrier = (e.barrier || 0) - broken;
      const staggered = delay(r, 0.5, 0.2);
      if (broken > 0 || staggered) {
        activate(r, "sunder");
        emit(r, "Armor Shatter: \u2212" + Math.round(broken) + " Barrier" + (staggered ? " \xB7 attack delayed" : ""), "sunder");
      }
    }
    if (has(r, "crit", 5) && a.focus >= 3 && ready(r, "crit")) {
      a.focus = 0;
      activate(r, "crit");
      out.perfect = true;
      emit(r, "Perfect Strike: empowered guaranteed Critical", "crit");
    }
    if (has(r, "bleed", 5) && (e.dots?.bleed?.length || 0) > 0 && e.hp <= e.maxhp * 0.3 && ready(r, "bleed")) {
      activate(r, "bleed");
      out.extra.push({ effect: "bleed", name: "Blood Hunt", damage: base * 0.4 });
    }
    if (a.counter > 0) {
      out.extra.push({ effect: "shield", name: "Block Counter", damage: Math.min(a.counter, base * 0.25) });
      a.counter = 0;
    }
    if (has(r, "shield", 5) && a.bastionUntil > a.time) {
      const spent = (r.barrier || 0) * 0.5;
      r.barrier -= spent;
      a.bastionUntil = 0;
      out.extra.push({ effect: "shield", name: "Last Bastion", damage: Math.min(spent, base * 0.5) });
    }
    if (has(r, "burn", 5) && a.heat >= 5 && ready(r, "burn")) {
      a.heat = 0;
      activate(r, "burn");
      out.extra.push({ effect: "burn", name: "Flashover", damage: base * 0.5 });
    }
    if (has(r, "drain", 5) && a.souls >= 3 && r.hp > r.maxhp * 0.4 && ready(r, "drain")) {
      r.hp -= r.maxhp * 0.03;
      a.souls = 0;
      activate(r, "drain");
      out.extra.push({ effect: "drain", name: "Soul Pact", damage: base * 0.4 });
    }
    return out;
  }
  function finishAttack(r, base, critical, prepared, wasBleeding) {
    const a = state(r);
    if (has(r, "bleed", 3) && wasBleeding && a.time - a.lastBleed >= 1 - 1e-7) {
      a.lastBleed = a.time;
      if (a.speed.length < 3) a.speed.push(a.time + 3);
      else a.speed[a.speed.indexOf(Math.min(...a.speed))] = a.time + 3;
      emit(r, "Blood Tempo: +" + a.speed.length * 5 + "% speed (3s)", "bleed");
    }
    if (has(r, "crit", 3) && critical && !prepared.perfect && a.time - a.lastFocus >= 1 - 1e-7) {
      a.lastFocus = a.time;
      a.focus = Math.min(3, a.focus + 1);
      a.focusUntil = a.time + 6;
      emit(r, "Focus " + a.focus + "/3", "crit");
    }
    for (const x of prepared.extra) {
      if (r.enemy.hp <= 0) break;
      const dealt = deal(r, x.damage);
      if (x.effect === "drain" && x.name === "Soul Pact") {
        const restored = heal(r, Math.min(r.maxhp * 0.04, dealt * 0.25), "signature");
        emit(r, "Soul Pact: " + Math.round(dealt) + " damage \xB7 +" + restored.toFixed(1) + " HP", "drain");
      } else emit(r, x.name + ": " + Math.round(dealt) + " damage", x.effect);
    }
    venomBurst(r, base);
  }
  function venomBurst(r, base) {
    const stacks = r.enemy.dots?.poison || [];
    if (!has(r, "poison", 5) || stacks.length < 6 || !ready(r, "poison") || r.enemy.hp <= 0) return;
    const remaining = stacks.reduce((sum, x) => sum + x.damage * x.remaining, 0);
    stacks.length = 0;
    activate(r, "poison");
    const dealt = deal(r, Math.min(base, remaining * 0.6));
    emit(r, "Venom Burst: stacks consumed \xB7 " + Math.round(dealt) + " damage", "poison");
  }
  function onBlock(r, blocked) {
    const a = state(r);
    if (has(r, "shield", 3) && blocked > 0 && a.time >= (a.cooldowns.counter || 0)) {
      a.counter = Math.max(a.counter, blocked * 0.25);
      a.counterUntil = a.time + 4;
      a.cooldowns.counter = a.time + 3;
      emit(r, "Block Counter ready (4s)", "shield");
    }
  }
  function survive(r) {
    const a = state(r);
    if (r.hp <= 0 && has(r, "regen", 5) && !a.secondWindUsed) {
      a.secondWindUsed = true;
      r.hp = 1;
      barrier(r, r.maxhp * 0.08);
      emit(r, "Second Wind: lethal hit prevented \xB7 1 HP", "regen");
      return true;
    }
    return false;
  }
  function afterIncoming(r) {
    const a = state(r);
    survive(r);
    if (r.hp > 0 && has(r, "nature", 5) && !a.natureRenewalUsed && r.hp <= r.maxhp * 0.35) {
      a.natureRenewalUsed = true;
      const restored = heal(r, r.maxhp * 0.08);
      emit(r, "Verdant Renewal: +" + restored.toFixed(1) + " HP", "nature");
    }
    if (r.hp > 0 && has(r, "tide", 5) && !a.tideSurgeUsed && r.barrier < r.maxhp * 0.05) {
      a.tideSurgeUsed = true;
      const gained = barrier(r, r.maxhp * 0.08);
      emit(r, "High Tide: +" + gained.toFixed(1) + " Barrier", "tide");
    }
    if (r.hp > 0 && has(r, "shield", 5) && (r.barrier || 0) >= r.maxhp * 0.1 && ready(r, "shield")) {
      a.bastionUntil = a.time + 4;
      activate(r, "shield");
      emit(r, "Last Bastion ready (4s)", "shield");
    }
  }
  function indicators(r) {
    const a = state(r), out = [];
    const reduction = Math.round((1 - incomingMultiplier(r)) * 100);
    if (reduction) out.push("Enemy direct damage \u2212" + reduction + "%");
    if (vulnerable(r)) out.push("Armor broken: +8% direct damage");
    if (a.delayImmuneUntil > a.time) out.push("Delay immunity \xB7 " + Math.ceil(a.delayImmuneUntil - a.time) + "s");
    if (a.speed.length) out.push("Speed +" + a.speed.length * 5 + "% \xB7 " + Math.ceil(Math.max(...a.speed) - a.time) + "s");
    for (const [key, name, max] of [["focus", "Focus", 3], ["heat", "Heat", 5], ["souls", "Soul", 3]]) if (a[key]) out.push(name + " " + a[key] + "/" + max + " \xB7 " + Math.max(0, Math.ceil(a[key + "Until"] - a.time)) + "s");
    if (a.counter > 0) out.push("Block Counter \xB7 " + Math.ceil(a.counterUntil - a.time) + "s");
    if (a.bastionUntil > a.time) out.push("Last Bastion \xB7 " + Math.ceil(a.bastionUntil - a.time) + "s");
    if (has(r, "regen", 5)) out.push("Second Wind " + (a.secondWindUsed ? "used" : "ready"));
    for (const [effect, d] of Object.entries(DEFINITIONS)) if (has(r, effect, 5) && d.cooldown) {
      const left = Math.max(0, Math.ceil((a.cooldowns[effect] || 0) - a.time));
      out.push(d.signature + ": " + (left ? left + "s" : "ready"));
    }
    return out;
  }
  return { DEFINITIONS, bonuses, describe, state, beginEncounter, barrier, heal, vulnerable, incomingMultiplier, tick, speedMultiplier, dotTick, deal, beforeAttack, finishAttack, venomBurst, onBlock, afterIncoming, survive, indicators, drainEvents };
});
