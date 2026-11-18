import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { ALL_RECIPES as RECIPES } from './ricette';
import { s } from './stile';
import * as M from './motore';
import { getPaziente, savePaziente } from './supabase';
import AdminPanel from './admin';
import { RecipeCard, WeightTab, PrefsTab, FavsTab, ShopTab } from './paziente_tabs';
import { LANGS, UI } from './lingue';

export default function App() {
  const [lang, setLang] = useState('it');
  const [role, setRole] = useState(null);
  const [paziente, setPaziente] = useState(null);
  const [passInput, setPassInput] = useState('');
  const [passErr, setPassErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [prepMode, setPrepMode] = useState('all');
  const [tab, setTab] = useState('calc');
  const [meal, setMeal] = useState('Colazione');
  const [mealKinds, setMealKinds] = useState({ Colazione: 'all', Merenda: 'all' });
  const [dayType, setDayType] = useState('ON');
  const [dayName, setDayName] = useState(M.DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [slot1, setSlot1] = useState('afternoon');
  const [slot2, setSlot2] = useState('none');
  const [pesoOggi, setPesoOggi] = useState('');
  const [pesoMsg, setPesoMsg] = useState('');
  const [pantry, setPantry] = useState({ Colazione: '', Pranzo: '', Merenda: '', Cena: '' });
  const [results, setResults] = useState({ Colazione: [], Pranzo: [], Merenda: [], Cena: [] });
  const [flt, setFlt] = useState([]);
  const [season, setSeason] = useState('all');
  const [bad, setBad] = useState('');
  const [weekPlan, setWeekPlan] = useState({ Lun: {}, Mar: {}, Mer: {}, Gio: {}, Ven: {}, Sab: {}, Dom: {} });
  const [shopDay, setShopDay] = useState('Lun');
  const [favs, setFavs] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const t = UI[lang] || UI.it;

  const langBar = (
    <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center', marginBottom: 8 }}>
      {LANGS.map(([k, lbl]) => (
        <TouchableOpacity
          key={k}
          onPress={() => setLang(k)}
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            backgroundColor: lang === k ? '#2B6CB0' : '#EDF2F7',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: lang === k ? '#FFF' : '#2D3748' }}>{lbl}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const syncPaziente = async (code) => {
    setLoading(true);
    try {
      const data = await getPaziente(code);
      if (!data || !data.attivo) {
        setRole(null);
        setPassErr(t.loginErr);
      } else {
        setPaziente(data);
        setFlt(data.intolleranze || []);
        setSeason(data.stagione || 'all');
        if (data.piano_dati?.lingua) setLang(data.piano_dati.lingua);
        setRole('patient');
        setPassErr('');
      }
    } catch (e) {
      setPassErr(t.connErr);
    }
    setLoading(false);
  };

  useEffect(() => {
    M.loadLocal().then((d) => {
      if (d) {
        if (d.lang) setLang(d.lang);
        if (d.pantry) setPantry(d.pantry);
        if (d.bad) setBad(d.bad);
        if (d.weekPlan) setWeekPlan(d.weekPlan);
        if (d.favs) setFavs(d.favs);
        if (d.savedRole === 'doctor') setRole('doctor');
        else if (d.savedCode) syncPaziente(d.savedCode);
      }
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loaded) M.saveLocal({ lang, savedRole: role, savedCode: paziente?.codice || '', pantry, bad, weekPlan, favs });
  }, [lang, role, paziente, pantry, bad, weekPlan, favs, loaded]);

  const handleLogin = async () => {
    const clean = passInput.trim().toUpperCase();
    if (!clean) return;
    if (clean === M.DOCTOR_PASS) {
      setRole('doctor');
      setPassErr('');
      return;
    }
    await syncPaziente(clean);
  };

  const handleSaveWeight = async () => {
    const val = parseFloat(pesoOggi.replace(',', '.'));
    if (!val || val < 30 || val > 250) return;
    const todayStr = new Date().toLocaleDateString('it-IT');
    const updatedPaz = { ...paziente, diario_peso: [...(paziente.diario_peso || []).filter((x) => x.data !== todayStr), { data: todayStr, peso: val }] };
    setPaziente(updatedPaz);
    setPesoOggi('');
    setPesoMsg(t.weightSaved);
    try { await savePaziente(updatedPaz); } catch (e) { console.log(e); }
  };
  if (role === 'doctor') return <AdminPanel onLogout={() => { setRole(null); setPassInput(''); }} />;

  if (role !== 'patient' || !paziente) {
    return (
      <SafeAreaView style={s.lockBg}>
        <View style={s.lockCard}>
          {langBar}
          <Image
            source={'./logo.png'}
            style={{ width: 96, height: 96, borderRadius: 16, marginBottom: 14, backgroundColor: '#000' }}
            resizeMode="contain"
          />
          <Text style={s.lockBrand}>B-sportlab</Text>
          <Text style={s.lockDoc}>{t.subtitle}</Text>
          <Text style={s.lockDesc}>{t.loginDesc}</Text>
          <TextInput style={s.lockInp} placeholder={t.loginPlaceholder} autoCapitalize="characters" value={passInput} onChangeText={setPassInput} />
          {passErr ? <Text style={s.errTxt}>{passErr}</Text> : null}
          <TouchableOpacity style={[s.btn, { width: '100%' }]} onPress={handleLogin} disabled={loading}>{loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnTxt}>{t.loginBtn}</Text>}</TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const daily = M.computeDailyTargets(paziente, { dayType, dayName, slots: [slot1, slot2] });
  const showMacro = Boolean(paziente.piano_dati?.mostra_macro);

  const startWithQuiz = (selectedMood) => {
    setPrepMode(selectedMood);
    setResults(M.generateAllMeals(RECIPES, { daily, prepMode: selectedMood, mealKinds, flt, season, bad, pantry }));
    setQuizDone(true);
  };

  if (!quizDone) {
    return (
      <SafeAreaView style={s.bg}>
        <View style={s.top}>
          <Image
            source={'./logo.png'}
            style={{ width: 42, height: 42, borderRadius: 8, marginRight: 10, backgroundColor: '#000' }}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}><Text style={s.brand}>B-sportlab</Text><Text style={s.doc}>{t.patientLbl}: {paziente.codice}</Text></View>
          <TouchableOpacity onPress={() => { setRole(null); setPaziente(null); setPassInput(''); }}><Text style={s.saveBadge}>{t.changeBtn}</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.pad}>
          {langBar}
          <View style={s.wBox}><Text style={s.wTit}>{t.quizTitle}</Text><Text style={s.wSub}>{t.quizSub}</Text></View>

          <View style={s.card}>
            {paziente.metodo === 'ON_OFF' ? (
              <View>
                <Text style={s.bold}>{t.q1OnOff}</Text>
                <View style={s.row}>
                  {[['ON', t.dayOn], ['OFF', t.dayOff]].map(([k, l]) => (
                    <TouchableOpacity key={k} style={[s.mBtn, dayType === k && s.mAct]} onPress={() => setDayType(k)}><Text style={[s.mTxt, dayType === k && s.mTxtAct]}>{l}</Text></TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View>
                <Text style={s.bold}>{t.q1Kj}</Text>
                <View style={s.row}>
                  {M.DAYS.map((d) => (
                    <TouchableOpacity key={d} style={[s.dBtn, dayName === d && s.mAct]} onPress={() => setDayName(d)}><Text style={[s.dTxt, dayName === d && s.mTxtAct]}>{t.days[d] || d}</Text></TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {(paziente.metodo === 'KJ' || dayType === 'ON') ? (
              <View style={{ marginTop: 8 }}>
                <Text style={s.bold}>{t.q2Title}</Text>
                <Text style={s.lbl}>{t.w1}</Text>
                <View style={s.chips}>{M.WORKOUT_SLOTS.map(([k]) => (<TouchableOpacity key={k} style={[s.chip, slot1 === k && s.chipAct]} onPress={() => setSlot1(k)}><Text style={[s.cTxt, slot1 === k && s.cTxtAct]}>{t.slots[k]}</Text></TouchableOpacity>))}</View>
                <Text style={s.lbl}>{t.w2}</Text>
                <View style={s.chips}>{M.WORKOUT_SLOTS.map(([k]) => (<TouchableOpacity key={k} style={[s.chip, slot2 === k && s.chipAct]} onPress={() => setSlot2(k)}><Text style={[s.cTxt, slot2 === k && s.cTxtAct]}>{t.slots[k]}</Text></TouchableOpacity>))}</View>
              </View>
            ) : null}
          </View>

          <Text style={s.bold}>{t.q3Title}</Text>
          {M.MOODS.map(([k]) => (
            <TouchableOpacity key={k} style={[s.card, { borderLeftWidth: 4, borderColor: '#2B6CB0', marginTop: 6 }]} onPress={() => startWithQuiz(k)}>
              <Text style={[s.rTitle, { marginBottom: 4 }]}>{t.moods[k]?.at(0)}</Text><Text style={s.txt}>{t.moods[k]?.at(1)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const curTarget = daily.mealTargets[meal];
  const shuffleMeal = () =>
    setResults((p) =>
      M.shuffleAndRebalance(RECIPES, p, meal, { daily, prepMode, mealKinds, flt, season, bad, pantry })
    );

  const currentDayLabel = paziente.metodo === 'KJ' ? (t.days[dayName] || dayName) : (dayType === 'ON' ? t.dayOn : t.dayOff);

  return (
    <SafeAreaView style={s.bg}>
      <View style={s.top}>
        <Image
          source={'./logo.png'}
          style={{ width: 42, height: 42, borderRadius: 8, marginRight: 10, backgroundColor: '#000' }}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }}><Text style={s.brand}>B-sportlab</Text><Text style={s.doc}>{t.patientLbl}: {paziente.codice}</Text></View>
        <TouchableOpacity onPress={() => setQuizDone(false)} style={{ marginRight: 6 }}><Text style={s.saveBadge}>{t.dayBtn}</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => { setRole(null); setPaziente(null); setPassInput(''); setQuizDone(false); }}><Text style={s.saveBadge}>{t.exitBtn}</Text></TouchableOpacity>
      </View>

      <View style={s.nav}>
        {[
          ['calc', t.tabPlan],
          ['weight', t.tabWeight],
          ['prefs', t.tabPrefs],
          ['favs', t.tabFavs],
          ['shop', t.tabShop],
        ].map(([k, l]) => (
          <TouchableOpacity key={k} style={[s.nBtn, tab === k && s.nAct]} onPress={() => setTab(k)}>
            <Text style={[s.nTxt, tab === k && s.nTxtAct, { fontSize: 11 }]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.pad}>
        {langBar}
        {tab === 'calc' ? (
          <View>
            {paziente.note_dottore ? (<View style={[s.wBox, { backgroundColor: '#FEFCBF', borderColor: '#D69E2E' }]}><Text style={[s.wTit, { color: '#744210' }]}>{t.notesTitle}</Text><Text style={[s.wSub, { color: '#744210' }]}>{paziente.note_dottore}</Text></View>) : null}

            {paziente.metodo === 'ON_OFF' && dayType === 'ON' && paziente.piano_dati?.nota_allenamento ? (
              <View style={[s.wBox, { backgroundColor: '#EBF8FF', borderColor: '#3182CE' }]}>
                <Text style={[s.wTit, { color: '#2C5282' }]}>{t.noteTrainTitle}</Text>
                <Text style={[s.wSub, { color: '#2C5282' }]}>{paziente.piano_dati.nota_allenamento}</Text>
              </View>
            ) : null}

            {paziente.metodo === 'KJ' && daily.kjOggi > 0 && paziente.piano_dati?.nota_kj ? (
              <View style={[s.wBox, { backgroundColor: '#EBF8FF', borderColor: '#3182CE' }]}>
                <Text style={[s.wTit, { color: '#2C5282' }]}>{t.noteTrainTitle} ({daily.kjOggi} kJ):</Text>
                <Text style={[s.wSub, { color: '#2C5282' }]}>{paziente.piano_dati.nota_kj}</Text>
              </View>
            ) : null}

            <View style={s.card}>
              <View style={s.rowBet}><Text style={s.bold}>{t.waterTitle}</Text><Text style={[s.rTitle, { color: '#2B6CB0' }]}>{daily.waterLiters} {t.liters}</Text></View>
              <Text style={s.hint}>{t.setOnText} {currentDayLabel} {t.tapDayHint}</Text>
            </View>

            <View style={s.row}>{M.MEALS.map((m) => (<TouchableOpacity key={m} style={[s.mBtn, meal === m && s.mAct]} onPress={() => setMeal(m)}><Text style={[s.mTxt, meal === m && s.mTxtAct]}>{t.meals[m] || m}</Text></TouchableOpacity>))}</View>

            <View style={s.card}>
              {showMacro ? <Text style={s.rTag}>{t.meals[meal] || meal}: P {curTarget.p}g | L {curTarget.f}g | C {curTarget.c}g</Text> : null}
              {(meal === 'Colazione' || meal === 'Merenda') ? (<View style={s.row}>{M.SWEET_SAVORY.map(([k]) => (<TouchableOpacity key={k} style={[s.mBtn, mealKinds[meal] === k && s.mAct]} onPress={() => setMealKinds((p) => ({ ...p, [meal]: k }))}><Text style={[s.mTxt, mealKinds[meal] === k && s.mTxtAct]}>{t.kinds[k]}</Text></TouchableOpacity>))}</View>) : null}
              <Text style={s.lbl}>{t.pantryLbl} {(t.meals[meal] || meal).toLowerCase()}?</Text>
              <TextInput style={s.tInp} placeholder={t.pantryPh} value={pantry[meal]} onChangeText={(v) => setPantry((p) => ({ ...p, [meal]: v }))} />
              <TouchableOpacity style={s.btn} onPress={shuffleMeal}><Text style={s.btnTxt}>{t.shuffleBtn} ({t.meals[meal] || meal})</Text></TouchableOpacity>
            </View>

            {(results[meal] || []).map((it, i) => (
              <RecipeCard
                key={it.id}
                it={it}
                isBest={i === 0}
                isPeriWorkout={curTarget.isPeriWorkout}
                isAdded={weekPlan[shopDay]?.[it.m]?.id === it.id}
                isFav={favs.includes(it.id)}
                shopDay={shopDay}
                flt={flt}
                showMacro={showMacro}
                lang={lang}
                onToggleFav={() => setFavs((p) => (p.includes(it.id) ? p.filter((x) => x !== it.id) : [...p, it.id]))}
                onAdd={() => setWeekPlan((p) => ({ ...p, [shopDay]: { ...p[shopDay], [it.m]: it } }))}
              />
            ))}
          </View>
        ) : null}

        {tab === 'weight' ? <WeightTab paziente={paziente} pesoOggi={pesoOggi} setPesoOggi={setPesoOggi} handleSaveWeight={handleSaveWeight} pesoMsg={pesoMsg} lang={lang} /> : null}
        {tab === 'prefs' ? <PrefsTab season={season} setSeason={setSeason} flt={flt} setFlt={setFlt} bad={bad} setBad={setBad} lang={lang} /> : null}
        {tab === 'favs' ? (
          <FavsTab
            recipes={RECIPES}
            favs={favs}
            setFavs={setFavs}
            meal={meal}
            setMeal={setMeal}
            daily={daily}
            shopDay={shopDay}
            weekPlan={weekPlan}
            setWeekPlan={setWeekPlan}
            flt={flt}
            showMacro={showMacro}
            lang={lang}
          />
        ) : null}
        {tab === 'shop' ? <ShopTab shopDay={shopDay} setShopDay={setShopDay} weekPlan={weekPlan} setWeekPlan={setWeekPlan} flt={flt} lang={lang} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
