# Independent Rot checkpoint and native E1–E10 validation

Approved mechanics consolidated at f7913e80084af6f575d1a860f57d1e06c8fc99ef; updated agent policy at 7117582890c3d29c9358cc012584f0233884ffdb.
Historical experiment scripts/reports remain in Git. To reproduce source-anchor experiments, check out their original commits rather than running against the consolidated runtime:
- 9636d56 persistence (run 45605747112)
- 337f560 factorial (run 45608526787)
- 72aa5d4 shared Overflow (run 45613266585)
- 887de3b independent sources (run 45615951176)
- 8b0d75d full integration/calibration (run 45621778271, 21600 encounters)
No Rot85/Burst75/Combined balance reduction applied. Bleed, Fire, Boon mechanics and rune rarity/category scaling unchanged. Only previously integrated Contagious Touch spread is 100%; other spread coefficients were not consolidated here.
New natural cohort: 22 profiles, 20 accounts each; 12 attempts per E, 60 total, through E10 if naturally unlocked. No fabricated gear, XP, runes, or unlocks. Agent preferred gear may not be acquired. Old historical diagnostic tests target older source anchors and need their original revision. Current mechanics have updated regression assertions.
