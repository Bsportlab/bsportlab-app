import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { s } from './stile';
import { getAllPazienti, savePaziente } from './supabase';
import AdminForm from './admin_form';

const NEW_PAZ = {
  codice: '',
  attivo: true,
  peso_visita: '70',
  metodo: 'ON_OFF',
  coeff_carbo: '2.0',
  note_dottore: '',
  intolleranze: [],
  stagione: 'all',
  piano_dati: {
    mostra_macro: true,
    lingua: 'it',
    on: { p: '150', f: '60', c: '280' },
    off: { p: '150', f: '65', c: '160' },
    base: { p: '140', f: '60', c: '200' },
    kj: { Lun: '0', Mar: '1200', Mer: '0', Gio: '1400', Ven: '800', Sab: '2000', Dom: '0' },
  },
  peri_workout: {
    intra: { nome: 'Zucchero', p: '0', f: '0', c: '40' },
    post: { nome: 'Recovery', p: '36', f: '3', c: '41' },
  },
  diario_peso: [],
};

export default function AdminPanel({ onLogout }) {
  const [list, setList] = useState([]);
  const [cur, setCur] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const loadList = async () => {
    setLoading(true);
    try {
      setList((await getAllPazienti()) || []);
    } catch (e) {
      setMsg('Errore Supabase.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadList();
  }, []);

  const openEdit = (p) => {
    setMsg('');
    if (!p) {
      setCur(JSON.parse(JSON.stringify(NEW_PAZ)));
      return;
    }
    setCur({
      ...NEW_PAZ,
      ...p,
      peso_visita: String(p.peso_visita ?? 70),
      coeff_carbo: String(p.coeff_carbo ?? 2.0),
      piano_dati: {
        ...NEW_PAZ.piano_dati,
        ...(p.piano_dati || {}),
        kj: { ...NEW_PAZ.piano_dati.kj, ...(p.piano_dati?.kj || {}) },
      },
      peri_workout: {
        intra: { ...NEW_PAZ.peri_workout.intra, ...(p.peri_workout?.intra || {}) },
        post: { ...NEW_PAZ.peri_workout.post, ...(p.peri_workout?.post || {}) },
      },
    });
  };

  const handleSave = async () => {
    if (!cur.codice.trim()) {
      setMsg('Inserisci un Codice Paziente.');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      await savePaziente(cur);
      await loadList();
      setMsg('✅ Scheda salvata!');
    } catch (e) {
      setMsg('❌ Errore salvataggio.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={s.bg}>
      <View style={s.top}>
        <Image
          source={require('./assets/logo.png')}
          style={{ width: 42, height: 42, borderRadius: 8, marginRight: 10, backgroundColor: '#000' }}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }}>
          <Text style={s.brand}>B-sportlab • Dottore</Text>
          <Text style={s.doc}>Dr. Baldassarre Federico</Text>
        </View>
        <TouchableOpacity onPress={onLogout}>
          <Text style={s.saveBadge}>🔒 Esci</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.pad}>
        {!cur ? (
          <View>
            <View style={s.rowBet}>
              <Text style={s.sec}>Pazienti ({list.length})</Text>
              <TouchableOpacity
                style={[s.btn, { marginTop: 0, paddingVertical: 8, paddingHorizontal: 14 }]}
                onPress={() => openEdit(null)}
              >
                <Text style={s.btnTxt}>+ Nuovo</Text>
              </TouchableOpacity>
            </View>
            {loading ? <ActivityIndicator size="large" color="#2B6CB0" style={{ marginVertical: 16 }} /> : null}
            {msg ? <Text style={s.errTxt}>{msg}</Text> : null}
            {list.map((p) => (
              <TouchableOpacity
                key={p.codice}
                style={[s.card, { borderLeftWidth: 4, borderColor: p.attivo ? '#2F855A' : '#E53E3E' }]}
                onPress={() => openEdit(p)}
              >
                <View style={s.rowBet}>
                  <Text style={s.rTitle}>{p.codice}</Text>
                  <Text style={{ fontWeight: 'bold', color: p.attivo ? '#2F855A' : '#E53E3E' }}>
                    {p.attivo ? '● ATTIVO' : '● BLOCCATO'}
                  </Text>
                </View>
                <Text style={s.txt}>
                  {p.peso_visita} kg • {p.metodo === 'KJ' ? '⚡ kJ' : '🔄 Allenamento/Riposo'} • Peri-WO: {p.coeff_carbo} g/kg
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <AdminForm
            cur={cur}
            setCur={setCur}
            onBack={() => setCur(null)}
            onSave={handleSave}
            loading={loading}
            msg={msg}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
