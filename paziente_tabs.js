import React from 'react';
import { Text, View, TextInput, TouchableOpacity } from 'react-native';
import { s } from './stile';
import * as M from './motore';
import { UI, trFood, trRecipeText } from './lingue';

export function RecipeCard({ it, isBest, isPeriWorkout, isAdded, isFav, shopDay, flt, showMacro, lang = 'it', onAdd, onToggleFav }) {
  const t = UI[lang] || UI.it;
  const seaKey = it.sea.includes('summer') ? 'summer' : it.sea.includes('winter') ? 'winter' : 'all';
  const seaLabel = t.seaBadges[seaKey];
  const mealLabel = (t.meals[it.m] || it.m).toUpperCase();
  const dayLabel = t.days[shopDay] || shopDay;
  const trRec = trRecipeText(it, lang);

  const dosi = [];
  if (it.gP > 0) dosi.push(`${it.gP}g ${trFood(M.fmtName(it.nomeP, flt), lang)}`);
  if (it.gC > 0) dosi.push(`${it.gC}g ${trFood(M.fmtName(it.nomeC, flt), lang)}`);
  if (it.gF > 0) dosi.push(`${it.gF}g ${trFood(it.nomeF, lang)}`);
  if (it.gV > 10) dosi.push(`${it.gV}g ${trFood(it.nomeV, lang)}`);

  return (
    <View style={[s.rCard, isBest && s.best]}>
      <View style={[s.banner, { backgroundColor: it.bg }]}>
        <Text style={s.ico}>{it.ico}</Text>
        <Text style={s.seaPill}>{seaLabel}</Text>
        <Text style={s.mealPill}>{mealLabel}</Text>
      </View>
      <View style={s.rBody}>
        <View style={s.rowBet}>
          <View style={{ flex: 1 }}>
            {it.hits > 0 ? <Text style={s.gBadge}>{t.inPantry} ({it.hits})</Text> : null}
            {isPeriWorkout ? <Text style={s.badge}>{t.periBadge}</Text> : null}
            <Text style={s.rTitle}>{trRec.title}</Text>
          </View>
          <TouchableOpacity onPress={onToggleFav} style={{ paddingLeft: 8 }}>
            <Text style={{ fontSize: 22 }}>{isFav ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
        {showMacro ? (
          <Text style={s.rTag}>~{it.kcal} kcal • P: {it.totP}g | L: {it.totF}g | C: {it.totC}g</Text>
        ) : null}
        <Text style={s.bold}>{t.prepTitle}</Text>
        <Text style={[s.txt, { marginBottom: 6 }]}>
          <Text style={s.bTxt}>{t.useWord} </Text>{dosi.join(', ')}.
        </Text>
        <Text style={s.txt}>{trRec.steps}</Text>
        <TouchableOpacity style={[s.sBtn, isAdded && s.sBtnOk]} onPress={onAdd}>
          <Text style={s.sBtnTxt}>
            {isAdded ? `${t.addedMenuBtn} (${dayLabel})` : `${t.addMenuBtn} (${dayLabel})`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function WeightTab({ paziente, pesoOggi, setPesoOggi, handleSaveWeight, pesoMsg, lang = 'it' }) {
  const t = UI[lang] || UI.it;
  const startW = parseFloat(String(paziente.peso_visita || '0').replace(',', '.')) || 0;
  const diary = paziente.diario_peso || [];
  const lastW = diary.length > 0 ? Number(diary.at(-1).peso) : null;
  const diffW = lastW !== null && startW > 0 ? (lastW - startW).toFixed(1) : null;

  return (
    <View>
      <Text style={s.sec}>{t.weightTitle}</Text>
      <View style={s.card}>
        <View style={s.row}>
          <TextInput style={[s.inp, { flex: 1, marginRight: 8 }]} keyboardType="numeric" placeholder="71.4" value={pesoOggi} onChangeText={setPesoOggi} />
          <TouchableOpacity style={[s.btn, { marginTop: 0, paddingHorizontal: 18 }]} onPress={handleSaveWeight}><Text style={s.btnTxt}>{t.saveBtn}</Text></TouchableOpacity>
        </View>
        {pesoMsg ? <Text style={{ color: '#2F855A', fontWeight: 'bold', marginTop: 4 }}>{t.weightSaved}</Text> : null}
      </View>
      <View style={s.card}>
        <View style={s.rowBet}>
          <Text style={s.bold}>{t.historyLbl}</Text>
          {diffW !== null ? (
            <Text style={{ fontWeight: 'bold', color: '#2B6CB0', fontSize: 12 }}>
              Start: {startW} kg ({Number(diffW) > 0 ? `+${diffW}` : diffW} kg)
            </Text>
          ) : null}
        </View>
        {diary.length === 0 ? (
          <Text style={s.txt}>{t.noWeights}</Text>
        ) : (
          diary.slice().reverse().map((item, idx) => {
            const pct = startW > 0 ? Math.max(20, Math.min(100, Math.round((Number(item.peso) / (startW * 1.15)) * 100))) : 60;
            return (
              <View key={idx} style={{ marginTop: 6 }}>
                <View style={s.rowBet}>
                  <Text style={s.txt}>📅 {item.data}</Text>
                  <Text style={s.bTxt}>{item.peso} kg</Text>
                </View>
                <View style={{ height: 6, backgroundColor: '#EDF2F7', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${pct}%`, height: '100%', backgroundColor: '#2B6CB0' }} />
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

export function PrefsTab({ season, setSeason, flt, setFlt, bad, setBad, lang = 'it' }) {
  const t = UI[lang] || UI.it;
  return (
    <View>
      <Text style={s.sec}>{t.prefsTitle}</Text>
      <View style={s.card}>
        <Text style={s.lbl}>{t.seasonLbl}</Text>
        <View style={s.chips}>
          {M.SEASONS.map(([k]) => (
            <TouchableOpacity key={k} style={[s.chip, season === k && s.chipAct]} onPress={() => setSeason(k)}>
              <Text style={[s.cTxt, season === k && s.cTxtAct]}>{t.seasons[k]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.lbl}>{t.fltLbl}</Text>
        <View style={s.chips}>
          {M.FILTERS.map(([k]) => (
            <TouchableOpacity key={k} style={[s.chip, flt.includes(k) && s.chipAct]} onPress={() => setFlt((p) => (p.includes(k) ? p.filter((i) => i !== k) : [...p, k]))}>
              <Text style={[s.cTxt, flt.includes(k) && s.cTxtAct]}>{t.filters[k]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.lbl}>{t.badLbl}</Text>
        <TextInput style={s.tInp} placeholder={t.badPh} value={bad} onChangeText={setBad} />
      </View>
    </View>
  );
}

export function FavsTab({ recipes, favs, setFavs, meal, setMeal, daily, shopDay, weekPlan, setWeekPlan, flt, showMacro, lang = 'it' }) {
  const t = UI[lang] || UI.it;
  const curTarget = daily.mealTargets[meal];
  const favRecipes = recipes
    .filter((r) => favs.includes(r.id))
    .map((r) => M.calcOne(r, curTarget.c, curTarget.p, curTarget.f));

  return (
    <View>
      <Text style={s.sec}>{t.favTitle}</Text>
      <View style={s.row}>
        {M.MEALS.map((m) => (
          <TouchableOpacity key={m} style={[s.mBtn, meal === m && s.mAct]} onPress={() => setMeal(m)}>
            <Text style={[s.mTxt, meal === m && s.mTxtAct]}>{t.meals[m] || m}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {favRecipes.length === 0 ? (
        <View style={s.card}>
          <Text style={s.txt}>{t.favEmpty}</Text>
        </View>
      ) : (
        favRecipes.map((it) => (
          <RecipeCard
            key={it.id}
            it={it}
            isBest={false}
            isPeriWorkout={curTarget.isPeriWorkout}
            isAdded={weekPlan[shopDay]?.[meal]?.id === it.id}
            isFav={true}
            shopDay={shopDay}
            flt={flt}
            showMacro={showMacro}
            lang={lang}
            onToggleFav={() => setFavs((p) => p.filter((x) => x !== it.id))}
            onAdd={() => setWeekPlan((p) => ({ ...p, [shopDay]: { ...p[shopDay], [meal]: it } }))}
          />
        ))
      )}
    </View>
  );
}

export function ShopTab({ shopDay, setShopDay, weekPlan, setWeekPlan, flt, lang = 'it' }) {
  const t = UI[lang] || UI.it;
  const items = M.getWeekShop(weekPlan, flt);
  return (
    <View>
      <Text style={s.sec}>{t.shopTitle}</Text>
      <View style={s.row}>
        {M.DAYS.map((d) => (
          <TouchableOpacity key={d} style={[s.dBtn, shopDay === d && s.mAct]} onPress={() => setShopDay(d)}>
            <Text style={[s.dTxt, shopDay === d && s.mTxtAct]}>{t.days[d] || d}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.card}>
        <Text style={s.bold}>{t.menuLbl} {t.days[shopDay] || shopDay}:</Text>
        {M.MEALS.map((m) => (
          <View key={m} style={s.sRow}>
            <Text style={s.bTxt}>{t.meals[m] || m}: </Text>
            <Text style={{ flex: 1 }}>{weekPlan[shopDay]?.[m] ? trRecipeText(weekPlan[shopDay][m], lang).title : t.noneLbl}</Text>
            {weekPlan[shopDay]?.[m] ? (
              <TouchableOpacity onPress={() => setWeekPlan((p) => ({ ...p, [shopDay]: { ...p[shopDay], [m]: null } }))}>
                <Text style={{ color: '#E53E3E', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </View>
      <View style={s.card}>
        <Text style={s.bold}>{t.shopListLbl}</Text>
        {items.length === 0 ? (
          <Text style={s.txt}>{t.shopEmpty}</Text>
        ) : (
          items.map(([k, g]) => <Text key={k} style={s.sItem}>☑️ {trFood(k, lang)}: <Text style={s.bTxt}>{g}g</Text></Text>)
        )}
      </View>
    </View>
  );
}
