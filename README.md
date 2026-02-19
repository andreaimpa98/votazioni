# 🚀 QUICK START - Prossimi Step

## ✅ FATTO FINO AD ORA
- ✅ Firebase configurato
- ✅ Codice aggiornato con Firebase + foto + logo + 2026
- ✅ Nuovo App.jsx pronto

---

## 📋 COSA FARE ADESSO (5 STEP)

### 1️⃣ PREPARA LE FOTO (15 minuti)

**Cosa ti serve:**
- 12 foto dei partecipanti (gruppi e coppie)
- 1 logo (il tuo logo in PNG)

**Come prepararle:**
- Foto VERTICALI (rapporto 3:4, tipo 600x800px)
- JPG, max 200KB
- Buona luce, sfondo pulito

**Rinomina così:**
- `gruppo1.jpg`, `gruppo2.jpg`, `gruppo3.jpg` (categoria 1)
- `gruppo4.jpg`, `gruppo5.jpg`, `gruppo6.jpg` (categoria 2)
- `coppia1.jpg`, `coppia2.jpg`, `coppia3.jpg` (categoria 3)
- `coppia4.jpg`, `coppia5.jpg`, `coppia6.jpg` (categoria 4)
- `logo.png` (il tuo logo)

📖 **Guida completa**: Leggi `GUIDA-FOTO.md`

---

### 2️⃣ CARICA FOTO SU GITHUB (5 minuti)

1. Vai su GitHub → repository "votazioni"
2. Click "Add file" → "Create new file"
3. Nome file: `public/images/.gitkeep`
4. Commit
5. Entra in `public/images/`
6. Click "Add file" → "Upload files"
7. Trascina tutte le 12 foto + logo
8. Commit

---

### 3️⃣ AGGIORNA App.jsx SU GITHUB (5 minuti)

1. Vai su GitHub → `src/` → `App.jsx`
2. Click icona **matita** (Edit)
3. **Cancella tutto**
4. **Copia** il nuovo file `src/App.jsx` che ti ho dato
5. **IMPORTANTE**: Modifica le linee 18-68 con i **nomi veri** dei partecipanti:

```javascript
options: [
  { name: 'NOME VERO GRUPPO 1', image: '/images/gruppo1.jpg' },
  { name: 'NOME VERO GRUPPO 2', image: '/images/gruppo2.jpg' },
  // ...
]
```

6. **Cambia anche**:
   - Linea 18: `votingStartTime: new Date('2026-02-22T23:00:00')` ← metti data/ora corretta
   - Linea 20: `adminPassword: 'TUA-PASSWORD'` ← cambia password
7. Commit

---

### 4️⃣ AGGIORNA package.json SU GITHUB (2 minuti)

1. Vai su GitHub → `package.json`
2. Click icona **matita** (Edit)
3. **Cancella tutto** e incolla questo:

```json
{
  "name": "carnival-voting",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1",
    "firebase": "^10.7.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.3.9"
  }
}
```

4. Commit

---

### 5️⃣ ATTENDI IL DEPLOY (2-3 minuti)

Netlify farà il deploy automaticamente!

Vai su Netlify → Deploys → aspetta che diventi verde ✅

---

## 🧪 TEST FINALE

Una volta online:

1. **Apri il sito** dal link Netlify
2. **Controlla**:
   - Logo appare? ✅
   - Dice "Carnevale 2026"? ✅
   - Foto appaiono nella pagina di voto? ✅
3. **Prova a votare** (un voto di test)
4. **Vai su `/admin`** (aggiungi /admin all'URL)
5. **Login** con la password che hai impostato
6. **Verifica** che vedi il voto di test
7. **Confermalo** e **pubblica risultati** per testare

---

## 📦 FILE AGGIORNATI

Nella cartella `votazioni-updated/` trovi:

- ✅ `src/App.jsx` - Nuovo codice con Firebase + foto + logo + 2026
- ✅ `package.json` - Con dipendenza Firebase
- ✅ `GUIDA-FOTO.md` - Guida completa foto

---

## 🎯 RIEPILOGO MODIFICHE

**Cosa ho cambiato:**

1. **Firebase integrato** → I voti vengono salvati nel database Firebase (funziona!)
2. **Sistema foto** → Ogni opzione mostra una foto (layout mobile-friendly)
3. **Logo** → Appare in tutte le pagine
4. **2025 → 2026** → Tutto aggiornato
5. **Nuove categorie**:
   - 🎨 Miglior Gruppo Iconico
   - 😂 Gruppo Più Divertente
   - 👑 Miglior Coppia Iconica
   - 👥 Coppia Più Divertente

---

## ⏰ TEMPO TOTALE STIMATO

- Prepara foto: 15 min
- Carica su GitHub: 10 min
- Aggiorna codice: 10 min
- Deploy: 3 min

**TOTALE: ~40 minuti** e sei online! 🚀

---

## 🆘 SE HAI PROBLEMI

**Foto non appaiono:**
→ Verifica siano in `public/images/` (non `src/images/`)
→ Nomi devono essere esatti (gruppo1.jpg, non Gruppo1.jpg)

**Errore Firebase:**
→ Vai su console.firebase.google.com
→ Firestore Database → verifica sia attivo e in "modalità test"

**Build fallisce:**
→ Manda screenshot dell'errore su Netlify
→ Verifica che package.json sia aggiornato con Firebase

---

## 🎊 SEI PRONTO!

1. Prepara le foto 📸
2. Caricale su GitHub 📤
3. Aggiorna il codice ✏️
4. Aspetta il deploy ⏳
5. Testa! 🧪

**Buon Carnevale 2026!** 🎭

---

P.S. Se hai dubbi scrivimi! Sono qui per aiutarti 😊
