const SUPABASE_URL = 'https://jkfhpjtzbkhjtxuktjag.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-ZcWi99q9MV9fUfhAX31Mg_74vG3Xrr';


const cleanUrl = SUPABASE_URL.trim().replace(/\/+$/, '');
const cleanKey = SUPABASE_KEY.trim();

const headers = {
  apikey: cleanKey,
  ...(cleanKey.startsWith('eyJ') ? { Authorization: `Bearer ${cleanKey}` } : {}),
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

export async function getPaziente(codice) {
  const clean = codice.trim().toUpperCase();
  const res = await fetch(`${cleanUrl}/rest/v1/pazienti?codice=eq.${encodeURIComponent(clean)}&select=*`, { headers });
  if (!res.ok) throw new Error('Errore connessione database');
  const rows = await res.json();
  return rows.length > 0 ? rows[0] : null;
}

export async function getAllPazienti() {
  const res = await fetch(`${cleanUrl}/rest/v1/pazienti?select=*&order=aggiornato_il.desc`, { headers });
  if (!res.ok) throw new Error('Errore lettura pazienti');
  return await res.json();
}

export async function savePaziente(paziente) {
  const pesoNum = parseFloat(String(paziente.peso_visita || '70').replace(',', '.')) || 70;
  const coeffNum = parseFloat(String(paziente.coeff_carbo || '2.0').replace(',', '.')) || 2.0;

  const payload = {
    codice: paziente.codice.trim().toUpperCase(),
    attivo: Boolean(paziente.attivo),
    peso_visita: pesoNum,
    metodo: paziente.metodo || 'ON_OFF',
    coeff_carbo: coeffNum,
    note_dottore: paziente.note_dottore || '',
    intolleranze: paziente.intolleranze || [],
    stagione: paziente.stagione || 'all',
    piano_dati: paziente.piano_dati || {},
    peri_workout: paziente.peri_workout || {},
    diario_peso: paziente.diario_peso || [],
    aggiornato_il: new Date().toISOString(),
  };

  const res = await fetch(`${cleanUrl}/rest/v1/pazienti?on_conflict=codice`, {
    method: 'POST',
    headers: {
      apikey: cleanKey,
      ...(cleanKey.startsWith('eyJ') ? { Authorization: `Bearer ${cleanKey}` } : {}),
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.log('Dettaglio errore Supabase:', errText);
    throw new Error(errText);
  }
  return await res.json();
}
