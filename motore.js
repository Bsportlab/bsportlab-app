import AsyncStorage from '@react-native-async-storage/async-storage';

export const DOCTOR_PASS = 'ADMIN-BS';
export const STORAGE_KEY = '@bsportlab_v10';

export const MEALS = ['Colazione', 'Pranzo', 'Merenda', 'Cena'];
export const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
export const WORKOUT_SLOTS = [
  ['none', '🛌 Nessun allenamento'],
  ['fasted', '🌅 Digiuno (Pre-Colazione)'],
  ['morning', '☀️ Mattina (Dopo Colazione)'],
  ['lunch', '🕛 Pausa Pranzo'],
  ['afternoon', '🌇 Pomeriggio (Pre-Cena)'],
  ['evening', '🌙 Sera (Dopo Cena)'],
];
export const MOODS = [
  ['ready', '⚡ Già pronto / Zero fornelli (2 min)', 'Solo piatti freddi o assemblaggi senza cottura'],
  ['cook', '👨‍🍳 Ho voglia di cucinare', 'Piatti caldi, gourmet e ricette ai fornelli'],
  ['box', '🥡 Schiscetta / Fuori casa', 'Comodi da preparare e portare al lavoro o uni'],
  ['all', '🎲 Sorprendimi (Tutte le idee)', 'Mostra tutto il ricettario B-sportlab'],
];
export const SWEET_SAVORY = [['all', '🌍 Tutte'], ['sweet', '🍯 Dolce'], ['savory', '🥑 Salato']];
export const SEASONS = [['all', '🌍 Tutte le Stagioni'], ['summer', '☀️ Estate / Primavera'], ['winter', '❄️ Autunno / Inverno']];
export const FILTERS = [['gf', 'Senza Glutine'], ['lf', 'Senza Lattosio'], ['veg', 'Vegetariano'], ['vegan', 'Vegano']];

const GF_ITEMS = ['avena', 'gnocchi', 'gallette', 'crackers'];
const LF_ITEMS = ['yogurt greco', 'fiocchi di latte', 'ricotta', 'feta'];

export const fmtName = (name, flt = []) => {
  let res = String(name || '');
  if (flt.includes('gf') && GF_ITEMS.some((k) => res.toLowerCase().includes(k))) res += ' (Senza Glutine)';
  if (flt.includes('lf') && LF_ITEMS.some((k) => res.toLowerCase().includes(k))) res += ' (Senza Lattosio)';
  return res;
};

const toNum = (v) => parseFloat(String(v ?? 0).replace(',', '.')) || 0;
const round5 = (n) => Math.round(n / 5) * 5;

export const computeDailyTargets = (paziente, { dayType, dayName, slots }) => {
  const peso = toNum(paziente.peso_visita) || 70;
  const coeff = toNum(paziente.coeff_carbo) || 2.0;
  const piano = paziente.piano_dati || {};
  const peri = paziente.peri_workout || {};

  let totP = 0;
  let totF = 0;
  let totC = 0;
  let kjOggi = 0;

  if (paziente.metodo === 'KJ') {
    const base = piano.base || { p: 140, f: 60, c: 200 };
    kjOggi = toNum(piano.kj?.[dayName]);
    const extraCarbo = Math.round((kjOggi * 1.1) / 4);
    totP = toNum(base.p);
    totF = toNum(base.f);
    totC = toNum(base.c) + extraCarbo;
  } else {
    const src = dayType === 'ON' ? (piano.on || { p: 150, f: 60, c: 280 }) : (piano.off || { p: 150, f: 65, c: 160 });
    totP = toNum(src.p);
    totF = toNum(src.f);
    totC = toNum(src.c);
  }

  const activeSlots = slots.filter((x) => x !== 'none');
  const hasWorkout = paziente.metodo === 'KJ' ? kjOggi > 0 : (dayType === 'ON' && activeSlots.length > 0);

  let intraP = 0;
  let intraF = 0;
  let intraC = 0;
  let postP = 0;
  let postF = 0;
  let postC = 0;

  if (hasWorkout) {
    if (paziente.metodo === 'KJ' && peri.byDay?.[dayName]) {
      const dayPeri = peri.byDay[dayName];
      intraP = toNum(dayPeri.intra?.p);
      intraF = toNum(dayPeri.intra?.f);
      intraC = toNum(dayPeri.intra?.c);
      postP = toNum(dayPeri.post?.p);
      postF = toNum(dayPeri.post?.f);
      postC = toNum(dayPeri.post?.c);
    } else {
      intraP = toNum(peri.intra?.p);
      intraF = toNum(peri.intra?.f);
      intraC = toNum(peri.intra?.c);
      postP = toNum(peri.post?.p);
      postF = toNum(peri.post?.f);
      postC = toNum(peri.post?.c);
    }
  }

  const remP = Math.max(0, totP - intraP - postP);
  const remF = Math.max(0, totF - intraF - postF);
  const remC = Math.max(0, totC - intraC - postC);

  const protectedMeals = new Set();
  if (hasWorkout) {
    activeSlots.forEach((sl) => {
      if (sl === 'fasted') protectedMeals.add('Colazione');
      if (sl === 'morning') { protectedMeals.add('Colazione'); protectedMeals.add('Pranzo'); }
      if (sl === 'lunch') { protectedMeals.add('Colazione'); protectedMeals.add('Pranzo'); }
      if (sl === 'afternoon') { protectedMeals.add('Pranzo'); protectedMeals.add('Merenda'); protectedMeals.add('Cena'); }
      if (sl === 'evening') { protectedMeals.add('Merenda'); protectedMeals.add('Cena'); }
    });
  }

  const targetPeriCarbo = Math.round(peso * coeff);
  const mealTargets = {};
  const weightsP = { Colazione: 0.22, Pranzo: 0.33, Merenda: 0.15, Cena: 0.30 };
  const weightsF = { Colazione: 0.20, Pranzo: 0.35, Merenda: 0.15, Cena: 0.30 };

  const protArray = Array.from(protectedMeals);
  const maxProtEach = protArray.length > 0 ? Math.min(targetPeriCarbo, Math.floor(remC / protArray.length)) : 0;
  const usedProtectedC = maxProtEach * protArray.length;
  const nonProtMeals = MEALS.filter((m) => !protectedMeals.has(m));
  const cPerOther = nonProtMeals.length > 0 ? Math.max(0, Math.round((remC - usedProtectedC) / nonProtMeals.length)) : 0;

  MEALS.forEach((m) => {
    const isProt = protectedMeals.has(m);
    mealTargets[m] = {
      p: Math.round(remP * weightsP[m]),
      f: Math.round(remF * weightsF[m]),
      c: isProt ? maxProtEach : cPerOther,
      isPeriWorkout: isProt,
    };
  });

  const waterBase = peso * 33;
  const waterExtra = hasWorkout ? (paziente.metodo === 'KJ' ? Math.round(kjOggi * 0.6) : activeSlots.length * 600) : 0;
  const waterLiters = ((waterBase + waterExtra) / 1000).toFixed(1);

  return { mealTargets, remP, remF, remC, waterLiters, hasWorkout, kjOggi, totP, totF, totC };
};
export const calcOne = (r, tC, tP, tF) => {
  const vArr = Array.isArray(r.v) ? r.v : [r.v, 0, 0, 0, 0];
  const cArr = Array.isArray(r.c) ? r.c : [r.c, 0, 0, 0];
  const pArr = Array.isArray(r.p) ? r.p : [r.p, 0, 0, 0];
  const fArr = Array.isArray(r.f) ? r.f : [r.f, 0, 0, 0];

  const nomeC = String(cArr.at(0) || '');
  const nomeP = String(pArr.at(0) || '');
  const nomeF = String(fArr.at(0) || '');
  const nomeV = String(vArr.at(0) || '');

  const vG = Number(vArr.at(1)) || 0;
  const vC = Number(vArr.at(2)) || 0;
  const vP = Number(vArr.at(3)) || 0;
  const vF = Number(vArr.at(4)) || 0;

  const cC = Number(cArr.at(1)) || 0;
  const cP = Number(cArr.at(2)) || 0;
  const cF = Number(cArr.at(3)) || 0;

  const pC = Number(pArr.at(1)) || 0;
  const pP = Number(pArr.at(2)) || 0;
  const pF = Number(pArr.at(3)) || 0;

  const fC = Number(fArr.at(1)) || 0;
  const fP = Number(fArr.at(2)) || 0;
  const fF = Number(fArr.at(3)) || 0;

  const isOlio = nomeF.toLowerCase().includes('olio');
  const maxC = cC < 25 ? 250 : 140;
  const maxP = pP < 15 ? 250 : 220;
  const maxF = isOlio ? 20 : (fF < 25 ? 80 : 35);

  // Arrotondamento carboidrati sempre a 0 o 5 finali
  const rawGC = cC >= 5 ? Math.max(0, Math.min(maxC, ((tC - vC) / cC) * 100)) : 0;
  const gC = Math.min(maxC, round5(rawGC));
  const protFromC = (gC / 100) * cP;
  const fatFromC = (gC / 100) * cF;

    const rawGP = pP >= 4 ? Math.max(0, Math.min(maxP, ((tP - vP - protFromC) / pP) * 100)) : 0;
  const gP = Math.min(maxP, round5(rawGP));
  const carbFromP = (gP / 100) * pC;
  const fatFromP = (gP / 100) * pF;

  const rawGF = fF >= 8 ? Math.max(0, Math.min(maxF, ((tF - vF - fatFromC - fatFromP) / fF) * 100)) : 0;
  const gF = Math.min(maxF, round5(rawGF));
  const carbFromF = (gF / 100) * fC;
  const protFromF = (gF / 100) * fP;


  const totC = Math.round(vC + (gC / 100) * cC + carbFromP + carbFromF);
  const totP = Math.round(vP + protFromC + (gP / 100) * pP + protFromF);
  const totF = Math.round(vF + fatFromC + fatFromP + (gF / 100) * fF);

  return {
    ...r,
    nomeC,
    nomeP,
    nomeF,
    nomeV,
    gC,
    gP,
    gF,
        gV: round5(vG),

    totC,
    totP,
    totF,
    kcal: Math.round(totC * 4 + totP * 4 + totF * 9),
    diff: Math.abs(totC - tC) + Math.abs(totP - tP) + Math.abs(totF - tF),
  };
};

export const filterRecipes = (recipes, { meal, prepMode, mealKinds, flt, season = 'all', bad, pantry, targetObj, excludeIds = [] }) => {
  const tP = parseFloat(targetObj.p) || 0;
  const tF = parseFloat(targetObj.f) || 0;
  const tC = parseFloat(targetObj.c) || 0;
  if (!tC && !tP && !tF) return [];

  const bW = bad.toLowerCase().split(',').map((x) => x.trim()).filter(Boolean);
  const gW = (pantry[meal] || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean);
  const allowSoy = flt.includes('veg') || flt.includes('vegan');
  const kind = mealKinds[meal] || 'all';
  const isMorningGroup = meal === 'Colazione' || meal === 'Merenda';

  const basePool = recipes.filter((r) => {
    const rIsMorning = r.m === 'Colazione' || r.m === 'Merenda';
    if (isMorningGroup !== rIsMorning) return false;
    if (isMorningGroup && kind !== 'all' && r.kind !== kind) return false;
    if (r.soy && !allowSoy) return false;
    if (targetObj.isPeriWorkout && ['ceci', 'lenticchie', 'fagioli', 'lupini'].some((leg) => r.n.toLowerCase().includes(leg))) return false;
    for (let k of flt) {
      if (!r.t.includes(k)) return false;
    }
    const txt = `${r.n} ${r.c?.at(0)} ${r.p?.at(0)} ${r.f?.at(0)} ${r.v?.at(0)}`.toLowerCase();
    for (let w of bW) {
      if (txt.includes(w)) return false;
    }
    return true;
  });

  const matchPrep = (r) => {
    if (prepMode === 'all') return true;
    if (prepMode === 'ready') return r.prep && r.prep.includes('fast');
    return r.prep && r.prep.includes(prepMode);
  };

  // Crea un bacino ampio di piatti compatibili e dà priorità a quelli NON appena mostrati
  const freshPool = basePool.filter((r) => !excludeIds.includes(r.id));
  const poolToUse = freshPool.length >= 3 ? freshPool : basePool;

  return poolToUse
    .map((r) => {
      const txt = `${r.n} ${r.c?.at(0)} ${r.p?.at(0)} ${r.f?.at(0)} ${r.v?.at(0)}`.toLowerCase();
      const seasonPriority = season !== 'all' && r.sea.includes(season) ? 1 : 0;
      const prepPriority = matchPrep(r) ? 1 : 0;
      return {
        ...calcOne(r, tC, tP, tF),
        hits: gW.filter((w) => txt.includes(w)).length,
        seasonPriority,
        prepPriority,
        rnd: Math.random(),
      };
    })
    .sort((a, b) => (b.hits - a.hits) || (b.seasonPriority - a.seasonPriority) || (b.prepPriority - a.prepPriority) || (b.rnd - a.rnd))
    .slice(0, 3);
};

export const generateAllMeals = (recipes, params) => {
  const { daily } = params;
  const out = {};
  let usedP = 0;
  let usedF = 0;

  MEALS.forEach((m, idx) => {
    const remainingMeals = MEALS.slice(idx);
    const baseT = daily.mealTargets[m];
    const remP = Math.max(0, daily.remP - usedP);
    const remF = Math.max(0, daily.remF - usedF);

    const adjTarget = {
      ...baseT,
      p: idx === 0 ? baseT.p : Math.round(remP / remainingMeals.length),
      f: idx === 0 ? baseT.f : Math.round(remF / remainingMeals.length),
    };

    const usedIds = Object.values(out).flat().map((x) => x.id);
    const list = filterRecipes(recipes, { ...params, meal: m, targetObj: adjTarget, excludeIds: usedIds });
    out[m] = list;

    if (list.length > 0) {
      usedP += list.at(0).totP;
      usedF += list.at(0).totF;
    }
  });

  return out;
};

export const shuffleAndRebalance = (recipes, currentResults, targetMeal, params) => {
  const { daily } = params;
  const prevIds = (currentResults[targetMeal] || []).map((x) => x.id);
  const newList = filterRecipes(recipes, {
    ...params,
    meal: targetMeal,
    targetObj: daily.mealTargets[targetMeal],
    excludeIds: prevIds,
  });
  const updated = { ...currentResults, [targetMeal]: newList };

  if (newList.length === 0) return updated;

  const chosen = newList.at(0);
  const otherMeals = MEALS.filter((m) => m !== targetMeal);
  const remP = Math.max(0, daily.remP - chosen.totP);
  const remF = Math.max(0, daily.remF - chosen.totF);

  otherMeals.forEach((m) => {
    const baseT = daily.mealTargets[m];
    const adjTarget = {
      ...baseT,
      p: Math.round(remP / otherMeals.length),
      f: Math.round(remF / otherMeals.length),
    };
    const existing = updated[m] || [];
    if (existing.length > 0) {
      updated[m] = existing.map((r) => ({
        ...calcOne(r, adjTarget.c, adjTarget.p, adjTarget.f),
        hits: r.hits,
        seasonPriority: r.seasonPriority,
        prepPriority: r.prepPriority,
      }));
    } else {
      updated[m] = filterRecipes(recipes, { ...params, meal: m, targetObj: adjTarget });
    }
  });

  return updated;
};
export const getWeekShop = (weekPlan, flt) => {
  const tot = {};
  DAYS.forEach((d) => {
    MEALS.forEach((m) => {
      const r = weekPlan[d]?.[m];
      if (!r) return;
      const items = [
        [fmtName(r.nomeC || r.c?.at(0), flt), r.gC],
        [fmtName(r.nomeP || r.p?.at(0), flt), r.gP],
        [r.nomeF || r.f?.at(0), r.gF],
        [r.nomeV || r.v?.at(0), r.gV || 0],
      ];
      items.forEach(([k, g]) => {
        if (g > 0 && k) tot[k] = (tot[k] || 0) + g;
      });
    });
  });
  return Object.entries(tot);
};

export const loadLocal = () => AsyncStorage.getItem(STORAGE_KEY).then((raw) => (raw ? JSON.parse(raw) : null)).catch(() => null);
export const saveLocal = (data) => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
