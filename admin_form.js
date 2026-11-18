import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, Linking } from 'react-native';
import { s } from './stile';
import * as M from './motore';

export default function AdminForm({ cur, setCur, onBack, onSave, loading, msg }) {
  const [appUrl, setAppUrl] = useState('https://vercel.app');

  const updPiano = (sec, k, v) =>
    setCur({ ...cur, piano_dati: { ...cur.piano_dati, [sec]: { ...cur.piano_dati[sec], [k]: v } } });

  const updPeri = (sec, k, v) =>
    setCur({ ...cur, peri_workout: { ...cur.peri_workout, [sec]: { ...cur.peri_workout[sec], [k]: v } } });

  const updDayPeri = (day, sec, k, v) => {
    const byDay = cur.peri_workout.byDay || {};
    const curDay = byDay[day] || {
      intra: { nome: 'Zucchero', p: '0', f: '0', c: '40' },
      post: { nome: 'Recovery', p: '36', f: '3', c: '41' },
    };
    setCur({
      ...cur,
      peri_workout: {
        ...cur.peri_workout,
        byDay: { ...byDay, [day]: { ...curDay, [sec]: { ...curDay[sec], [k]: v } } },
      },
    });
  };

  const sendWhatsApp = () => {
    const code = cur.codice.trim().toUpperCase();
    if (!code) return;
    const l = cur.piano_dati.lingua || 'it';
    let text = `Ciao! Ecco il tuo accesso personale al piano nutrizionale B-sportlab (Dr. Federico Baldassarre).\n\n🔗 Link App: ${appUrl}\n🔑 Codice personale: ${code}`;
    if (l === 'en') {
      text = `Hi! Here is your personal access to your B-sportlab nutrition plan (Dr. Federico Baldassarre).\n\n🔗 App Link: ${appUrl}\n🔑 Personal Code: ${code}`;
    } else if (l === 'fr') {
      text = `Bonjour ! Voici votre accès personnel à votre plan nutritionnel B-sportlab (Dr. Federico Baldassarre).\n\n🔗 Lien App : ${appUrl}\n🔑 Code personnel : ${code}`;
    }
    Linking.openURL(`https://wa.me{encodeURIComponent(text)}`);
  };

  const showMacro = cur.piano_dati.mostra_macro !== false;
  const activeKjDays = M.DAYS.filter((d) => (parseFloat(String(cur.piano_dati.kj?.[d] || '0').replace(',', '.')) || 0) > 0);
  const startWeight = parseFloat(String(cur.peso_visita || '0').replace(',', '.')) || 0;
  const diary = cur.diario_peso || [];
  const lastWeight = diary.length > 0 ? Number(diary.at(-1).peso) : null;
  const diffWeight = lastWeight !== null && startWeight > 0 ? (lastWeight - startWeight).toFixed(1) : null;
  return (
    <View>
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 10 }}>
        <Text style={{ color: '#2B6CB0', fontWeight: 'bold' }}>← Torna all’elenco pazienti</Text>
      </TouchableOpacity>

      <View style={s.card}>
        <Text style={s.sec}>1. Anagrafica & Condivisione</Text>
        <Text style={s.lbl}>Codice Paziente:</Text>
        <TextInput style={s.tInp} autoCapitalize="characters" placeholder="es. BS-101" value={cur.codice} onChangeText={(v) => setCur({ ...cur, codice: v })} />
        <View style={s.row}>
          <View style={s.col}>
            <Text style={s.lbl}>Peso Visita (kg):</Text>
            <TextInput style={s.inp} keyboardType="numeric" value={cur.peso_visita} onChangeText={(v) => setCur({ ...cur, peso_visita: v })} />
          </View>
          <View style={s.col}>
            <Text style={s.lbl}>Carbo Pre/Post (g/kg):</Text>
            <TextInput style={s.inp} keyboardType="numeric" value={cur.coeff_carbo} onChangeText={(v) => setCur({ ...cur, coeff_carbo: v })} />
          </View>
        </View>

        <Text style={s.lbl}>Lingua predefinita paziente:</Text>
        <View style={s.row}>
          {[['it', '🇮🇹 Italiano'], ['en', '🇬🇧 English'], ['fr', '🇫🇷 Français']].map(([k, l]) => (
            <TouchableOpacity
              key={k}
              style={[s.mBtn, (cur.piano_dati.lingua || 'it') === k && s.mAct]}
              onPress={() => setCur({ ...cur, piano_dati: { ...cur.piano_dati, lingua: k } })}
            >
              <Text style={[s.mTxt, (cur.piano_dati.lingua || 'it') === k && s.mTxtAct]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[s.sBtn, { backgroundColor: showMacro ? '#EBF8FF' : '#EDF2F7' }]}
          onPress={() => setCur({ ...cur, piano_dati: { ...cur.piano_dati, mostra_macro: !showMacro } })}
        >
          <Text style={s.sBtnTxt}>
            {showMacro ? '👁️ Macro e Kcal VISIBILI al paziente' : '🙈 Macro e Kcal NASCOSTI (solo dosi a crudo)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.sBtn, { backgroundColor: cur.attivo ? '#C6F6D5' : '#FED7D7' }]} onPress={() => setCur({ ...cur, attivo: !cur.attivo })}>
          <Text style={s.sBtnTxt}>{cur.attivo ? '✅ ATTIVO (Tocca per bloccare)' : '⛔ BLOCCATO (Tocca per riattivare)'}</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderColor: '#E2E8F0' }}>
          <Text style={s.lbl}>Link App da inviare al paziente:</Text>
          <TextInput style={s.tInp} value={appUrl} onChangeText={setAppUrl} placeholder="https://..." />
          <TouchableOpacity style={[s.sBtn, { backgroundColor: '#25D366' }]} onPress={sendWhatsApp}>
            <Text style={[s.sBtnTxt, { color: '#FFF' }]}>📲 Invia Codice & Link su WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.sec}>2. Metodo Energetico (Valori in grammi)</Text>
        <View style={s.row}>
          {[['ON_OFF', '🔄 Allenamento / Riposo'], ['KJ', '⚡ Periodizzazione kJ']].map(([k, l]) => (
            <TouchableOpacity key={k} style={[s.mBtn, cur.metodo === k && s.mAct]} onPress={() => setCur({ ...cur, metodo: k })}>
              <Text style={[s.mTxt, cur.metodo === k && s.mTxtAct]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {cur.metodo === 'ON_OFF' ? (
          <View>
            <Text style={s.bold}>Giorno di Allenamento (grammi totali):</Text>
            <View style={s.row}>
              {[['p', 'Prot (g)'], ['f', 'Lip (g)'], ['c', 'Carb (g)']].map(([k, l]) => (
                <View key={k} style={s.col}><Text style={s.lbl}>{l}</Text><TextInput style={s.inp} keyboardType="numeric" value={String(cur.piano_dati.on[k])} onChangeText={(v) => updPiano('on', k, v)} /></View>
              ))}
            </View>
            <Text style={s.bold}>Giorno di Riposo (grammi totali):</Text>
            <View style={s.row}>
              {[['p', 'Prot (g)'], ['f', 'Lip (g)'], ['c', 'Carb (g)']].map(([k, l]) => (
                <View key={k} style={s.col}><Text style={s.lbl}>{l}</Text><TextInput style={s.inp} keyboardType="numeric" value={String(cur.piano_dati.off[k])} onChangeText={(v) => updPiano('off', k, v)} /></View>
              ))}
            </View>
          </View>
        ) : (
          <View>
            <Text style={s.bold}>Base Riposo 0 kJ (grammi totali):</Text>
            <View style={s.row}>
              {[['p', 'Prot (g)'], ['f', 'Lip (g)'], ['c', 'Carb (g)']].map(([k, l]) => (
                <View key={k} style={s.col}><Text style={s.lbl}>{l}</Text><TextInput style={s.inp} keyboardType="numeric" value={String(cur.piano_dati.base[k])} onChangeText={(v) => updPiano('base', k, v)} /></View>
              ))}
            </View>
            <Text style={s.bold}>kJ Allenamento Settimana (× 1,1 → g extra Carbo):</Text>
            <View style={s.chips}>
              {M.DAYS.map((d) => (
                <View key={d} style={{ width: 85 }}><Text style={s.lbl}>{d} (kJ)</Text><TextInput style={s.inp} keyboardType="numeric" value={String(cur.piano_dati.kj[d] || '0')} onChangeText={(v) => updPiano('kj', d, v)} /></View>
              ))}
            </View>
          </View>
        )}
      </View>
      <View style={s.card}>
        <Text style={s.sec}>3. Intra & Post-Workout (Scalati in automatico)</Text>
        {cur.metodo === 'ON_OFF' ? (
          <View>
            <Text style={s.bold}>Intra-Workout (Giorno Allenamento):</Text>
            <TextInput style={s.tInp} placeholder="Prodotto" value={cur.peri_workout.intra.nome} onChangeText={(v) => updPeri('intra', 'nome', v)} />
            <View style={s.row}>
              {[['p', 'Prot (g)'], ['f', 'Lip (g)'], ['c', 'Carb (g)']].map(([k, l]) => (
                <View key={k} style={s.col}><Text style={s.lbl}>{l}</Text><TextInput style={s.inp} keyboardType="numeric" value={String(cur.peri_workout.intra[k])} onChangeText={(v) => updPeri('intra', k, v)} /></View>
              ))}
            </View>
            <Text style={s.bold}>Post-Workout (Giorno Allenamento):</Text>
            <TextInput style={s.tInp} placeholder="Prodotto" value={cur.peri_workout.post.nome} onChangeText={(v) => updPeri('post', 'nome', v)} />
            <View style={s.row}>
              {[['p', 'Prot (g)'], ['f', 'Lip (g)'], ['c', 'Carb (g)']].map(([k, l]) => (
                <View key={k} style={s.col}><Text style={s.lbl}>{l}</Text><TextInput style={s.inp} keyboardType="numeric" value={String(cur.peri_workout.post[k])} onChangeText={(v) => updPeri('post', k, v)} /></View>
              ))}
            </View>
          </View>
        ) : activeKjDays.length === 0 ? (
          <Text style={s.txt}>Inserisci i kJ maggiori di 0 nei giorni della settimana qui sopra per impostare Intra e Post-Workout giornalieri.</Text>
        ) : (
          activeKjDays.map((d) => {
            const dPeri = cur.peri_workout.byDay?.[d] || {
              intra: { nome: 'Zucchero', p: '0', f: '0', c: '40' },
              post: { nome: 'Recovery', p: '36', f: '3', c: '41' },
            };
            return (
              <View key={d} style={{ borderTopWidth: 1, borderColor: '#E2E8F0', paddingTop: 8, marginTop: 8 }}>
                <Text style={[s.rTitle, { color: '#2B6CB0', fontSize: 15 }]}>📅 {d} ({cur.piano_dati.kj[d]} kJ)</Text>
                <Text style={s.lbl}>Intra-Workout {d}:</Text>
                <TextInput style={s.tInp} placeholder="Prodotto Intra" value={dPeri.intra.nome} onChangeText={(v) => updDayPeri(d, 'intra', 'nome', v)} />
                <View style={s.row}>
                  {[['p', 'Prot (g)'], ['f', 'Lip (g)'], ['c', 'Carb (g)']].map(([k, l]) => (
                    <View key={k} style={s.col}><Text style={s.lbl}>{l}</Text><TextInput style={s.inp} keyboardType="numeric" value={String(dPeri.intra[k])} onChangeText={(v) => updDayPeri(d, 'intra', k, v)} /></View>
                  ))}
                </View>
                <Text style={s.lbl}>Post-Workout {d}:</Text>
                <TextInput style={s.tInp} placeholder="Prodotto Post" value={dPeri.post.nome} onChangeText={(v) => updDayPeri(d, 'post', 'nome', v)} />
                <View style={s.row}>
                  {[['p', 'Prot (g)'], ['f', 'Lip (g)'], ['c', 'Carb (g)']].map(([k, l]) => (
                    <View key={k} style={s.col}><Text style={s.lbl}>{l}</Text><TextInput style={s.inp} keyboardType="numeric" value={String(dPeri.post[k])} onChangeText={(v) => updDayPeri(d, 'post', k, v)} /></View>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={s.card}>
        <Text style={s.sec}>4. Stagione, Note & Intolleranze</Text>
        <Text style={s.lbl}>Stagionalità predefinita:</Text>
        <View style={s.chips}>
          {M.SEASONS.map(([k, l]) => (
            <TouchableOpacity key={k} style={[s.chip, (cur.stagione || 'all') === k && s.chipAct]} onPress={() => setCur({ ...cur, stagione: k })}>
              <Text style={[s.cTxt, (cur.stagione || 'all') === k && s.cTxtAct]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.lbl}>Nota generale (sempre visibile al paziente):</Text>
        <TextInput style={[s.tInp, { height: 56 }]} multiline placeholder="Indicazioni generali della settimana..." value={cur.note_dottore} onChangeText={(v) => setCur({ ...cur, note_dottore: v })} />

        {cur.metodo === 'ON_OFF' ? (
          <View>
            <Text style={s.lbl}>🔥 Nota SOLO per il Giorno di Allenamento:</Text>
            <TextInput
              style={[s.tInp, { height: 56 }]}
              multiline
              placeholder="Visibile solo quando il paziente sceglie Giorno di Allenamento..."
              value={cur.piano_dati.nota_allenamento || ''}
              onChangeText={(v) => setCur({ ...cur, piano_dati: { ...cur.piano_dati, nota_allenamento: v } })}
            />
          </View>
        ) : (
          <View>
            <Text style={s.lbl}>⚡ Nota SOLO per i giorni con kJ maggiori di 0:</Text>
            <TextInput
              style={[s.tInp, { height: 56 }]}
              multiline
              placeholder="Visibile solo nei giorni della settimana con kJ > 0..."
              value={cur.piano_dati.nota_kj || ''}
              onChangeText={(v) => setCur({ ...cur, piano_dati: { ...cur.piano_dati, nota_kj: v } })}
            />
          </View>
        )}

        <Text style={s.lbl}>Intolleranze preimpostate:</Text>
        <View style={s.chips}>
          {M.FILTERS.map(([k, l]) => (
            <TouchableOpacity key={k} style={[s.chip, cur.intolleranze?.includes(k) && s.chipAct]} onPress={() => setCur({ ...cur, intolleranze: cur.intolleranze.includes(k) ? cur.intolleranze.filter((x) => x !== k) : [...cur.intolleranze, k] })}>
              <Text style={[s.cTxt, cur.intolleranze?.includes(k) && s.cTxtAct]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {msg ? <Text style={{ fontWeight: 'bold', color: '#2B6CB0', marginVertical: 6 }}>{msg}</Text> : null}
        <TouchableOpacity style={s.btn} onPress={onSave} disabled={loading}>
          <Text style={s.btnTxt}>{loading ? 'Salvataggio...' : '💾 Salva Scheda'}</Text>
        </TouchableOpacity>
      </View>

      {diary.length > 0 ? (
        <View style={s.card}>
          <Text style={s.sec}>📊 Andamento Peso Paziente</Text>
          <Text style={[s.rTag, { marginBottom: 8 }]}>
            Visita: {startWeight} kg • Ultimo: {lastWeight} kg ({Number(diffWeight) > 0 ? `+${diffWeight}` : diffWeight} kg)
          </Text>
          {diary.slice(-10).reverse().map((e, i) => {
            const pct = Math.max(20, Math.min(100, Math.round((Number(e.peso) / (startWeight * 1.15)) * 100)));
            return (
              <View key={i} style={{ marginBottom: 6 }}>
                <View style={s.rowBet}>
                  <Text style={s.txt}>📅 {e.data}</Text>
                  <Text style={s.bTxt}>{e.peso} kg</Text>
                </View>
                <View style={{ height: 6, backgroundColor: '#EDF2F7', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${pct}%`, height: '100%', backgroundColor: '#2B6CB0' }} />
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
