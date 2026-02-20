import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Users, CheckCircle, XCircle, Crown, Sparkles } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, onSnapshot, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA4SCniDnYFa_vRKdKT5WiCRP0PXd8VLIw",
  authDomain: "votazioni-carnevale.firebaseapp.com",
  projectId: "votazioni-carnevale",
  storageBucket: "votazioni-carnevale.firebasestorage.app",
  messagingSenderId: "755574583484",
  appId: "1:755574583484:web:92a496bdcda0927ede20b9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CONFIG = {
  sessionKey: 'carnival-voted-v1', // ← cambia v1 → v2, v3... per resettare il "hai già votato" di tutti gli utenti
  votingStartTime: new Date('2026-02-20T14:45:00').getTime(),
  votingDuration: 2 * 60 * 1000,
  adminPassword: 'carnevale2026',
  categories: [
    {
      id: 'cat1',
      name: 'Miglior Gruppo Iconico',
      icon: '🎨',
      options: [
        { name: 'Gruppo 1', image: '/gruppo1.jpg' },
        { name: 'Gruppo 2', image: '/gruppo2.jpg' },
        { name: 'Gruppo 3', image: '/gruppo3.jpg' }
      ]
    },
    {
      id: 'cat2',
      name: 'Gruppo Più Divertente',
      icon: '😂',
      options: [
        { name: 'Gruppo 4', image: '/gruppo4.jpg' },
        { name: 'Gruppo 5', image: '/gruppo5.jpg' },
        { name: 'Gruppo 6', image: '/gruppo6.jpg' }
      ]
    },
    {
      id: 'cat3',
      name: 'Miglior Coppia Iconica',
      icon: '👑',
      options: [
        { name: 'Coppia 1', image: '/coppia1.jpg' },
        { name: 'Coppia 2', image: '/coppia2.jpg' },
        { name: 'Coppia 3', image: '/coppia3.jpg' }
      ]
    },
    {
      id: 'cat4',
      name: 'Coppia Più Divertente',
      icon: '👥',
      options: [
        { name: 'Coppia 4', image: '/coppia4.jpg' },
        { name: 'Coppia 5', image: '/coppia5.jpg' },
        { name: 'Coppia 6', image: '/coppia6.jpg' }
      ]
    }
  ]
};

const App = () => {
  const [page, setPage] = useState('home');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [votes, setVotes] = useState({});
  const [userData, setUserData] = useState({ nome: '', cognome: '' });
  const [hasVoted, setHasVoted] = useState(false);
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [allVotes, setAllVotes] = useState([]);
  const [resultsPublished, setResultsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [firestoreStatus, setFirestoreStatus] = useState('connecting');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const voted = localStorage.getItem(CONFIG.sessionKey);
    if (voted) setHasVoted(true);
  }, []);

  // Listener unico per i voti - real-time su tutti i dispositivi
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'votes')),
      (snapshot) => {
        const votesData = [];
        snapshot.forEach((d) => votesData.push({ id: d.id, ...d.data() }));
        setAllVotes(votesData);
        setFirestoreStatus('ok');
      },
      (error) => {
        console.error('Firestore votes error:', error.code, error.message);
        setFirestoreStatus('error:' + error.code);
      }
    );
    return () => unsubscribe();
  }, []);

  // Listener per settings
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'settings')),
      (snapshot) => {
        snapshot.forEach((d) => {
          if (d.data().resultsPublished !== undefined) {
            setResultsPublished(d.data().resultsPublished);
          }
        });
      },
      (error) => {
        console.error('Firestore settings error:', error.code, error.message);
      }
    );
    return () => unsubscribe();
  }, []);

  const saveVote = async () => {
    if (!userData.nome.trim() || !userData.cognome.trim()) {
      setSaveError('Inserisci nome e cognome!');
      return;
    }
    const allCategoriesVoted = CONFIG.categories.every(cat => votes[cat.id]);
    if (!allCategoriesVoted) {
      setSaveError('Devi votare per tutte le 4 categorie!');
      return;
    }

    setSaveError('');
    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, 'votes'), {
        nome: userData.nome.trim(),
        cognome: userData.cognome.trim(),
        ...votes,
        timestamp: Date.now(),
        confirmed: false
      });
      console.log('Voto salvato con ID:', docRef.id);
      localStorage.setItem(CONFIG.sessionKey, 'true');
      setHasVoted(true);
      setLoading(false);
      setPage('thankyou');
    } catch (error) {
      console.error('Errore salvataggio:', error.code, error.message);
      setLoading(false);
      setSaveError('Errore: ' + (error.code || error.message) + '. Controlla connessione e riprova.');
    }
  };

  const confirmVote = async (voteId) => {
    try {
      await updateDoc(doc(db, 'votes', voteId), { confirmed: true });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const deleteVote = async (voteId) => {
    try {
      await deleteDoc(doc(db, 'votes', voteId));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const publishResults = async () => {
    try {
      const settingsSnap = await getDocs(collection(db, 'settings'));
      if (settingsSnap.empty) {
        await addDoc(collection(db, 'settings'), { resultsPublished: true });
      } else {
        settingsSnap.forEach(async (document) => {
          await updateDoc(doc(db, 'settings', document.id), { resultsPublished: true });
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetAll = async () => {
    if (!window.confirm('⚠️ Sei sicuro? Questa operazione elimina TUTTI i voti e resetta i risultati. Non è reversibile!')) return;
    try {
      // Elimina tutti i voti
      const votesSnap = await getDocs(collection(db, 'votes'));
      const batch = writeBatch(db);
      votesSnap.forEach((d) => batch.delete(doc(db, 'votes', d.id)));
      await batch.commit();

      // Resetta settings
      const settingsSnap = await getDocs(collection(db, 'settings'));
      const batch2 = writeBatch(db);
      settingsSnap.forEach((d) => batch2.update(doc(db, 'settings', d.id), { resultsPublished: false }));
      await batch2.commit();

      setResultsPublished(false);
      alert('✅ Reset completato! Voti eliminati e risultati resettati.');
    } catch (error) {
      console.error('Errore reset:', error);
      alert('Errore durante il reset: ' + error.message);
    }
  };

  const calculateWinners = () => {
    const confirmedVotes = allVotes.filter(v => v.confirmed);
    const winners = {};
    CONFIG.categories.forEach(category => {
      const voteCounts = {};
      confirmedVotes.forEach(vote => {
        const choice = vote[category.id];
        voteCounts[choice] = (voteCounts[choice] || 0) + 1;
      });
      const sortedOptions = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
      winners[category.id] = {
        winner: sortedOptions[0]?.[0] || 'Nessun voto',
        votes: sortedOptions[0]?.[1] || 0,
        all: sortedOptions
      };
    });
    return winners;
  };

  const votingEndTime = CONFIG.votingStartTime + CONFIG.votingDuration;
  const votingOpen = currentTime >= CONFIG.votingStartTime && currentTime < votingEndTime;
  const votingEnded = currentTime >= votingEndTime;
  const votingNotStarted = currentTime < CONFIG.votingStartTime;
  const timeUntilStart = Math.max(0, CONFIG.votingStartTime - currentTime);
  const timeUntilEnd = Math.max(0, votingEndTime - currentTime);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`;
  };

  // ADMIN PAGE
  if (page === 'admin') {
    if (!adminAuth) {
      return (
        <div style={styles.pageContainer}>
          <div style={styles.card}>
            <img src="/logo.png" alt="Logo" style={styles.logoSmall} onError={(e) => e.target.style.display = 'none'} />
            <h1 style={styles.pageTitle}>Admin Panel</h1>
            <input
              type="password"
              placeholder="Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (adminPassword === CONFIG.adminPassword ? setAdminAuth(true) : alert('Password errata!'))}
              style={styles.inputLarge}
            />
            <button onClick={() => adminPassword === CONFIG.adminPassword ? setAdminAuth(true) : alert('Password errata!')} style={styles.primaryButton}>Accedi</button>
            <button onClick={() => setPage('home')} style={styles.secondaryButton}>Torna Home</button>
          </div>
        </div>
      );
    }

    const confirmedVotes = allVotes.filter(v => v.confirmed);
    const pendingVotes = allVotes.filter(v => !v.confirmed);
    const winners = calculateWinners();

    return (
      <div style={styles.pageContainer}>
        <div style={styles.adminContainer}>
          <h1 style={styles.adminTitle}>Pannello Admin</h1>

          {firestoreStatus.startsWith('error') && (
            <div style={{background:'#fef2f2', border:'2px solid #ef4444', borderRadius:'10px', padding:'14px', marginBottom:'16px', color:'#b91c1c', fontSize:'13px'}}>
              ❌ <strong>Errore Firestore: {firestoreStatus}</strong><br/>
              I voti non vengono sincronizzati. Vai su <a href="https://console.firebase.google.com/project/votazioni-carnevale/firestore/rules" target="_blank">Firebase Console → Firestore → Rules</a> e imposta le regole come indicato in fondo a questa pagina.
            </div>
          )}

          {firestoreStatus === 'connecting' && (
            <div style={{background:'#fef3c7', borderRadius:'10px', padding:'12px', marginBottom:'16px', color:'#92400e', fontSize:'13px'}}>
              ⏳ Connessione a Firebase in corso...
            </div>
          )}

          {firestoreStatus === 'ok' && (
            <div style={{background:'#d1fae5', borderRadius:'10px', padding:'10px 14px', marginBottom:'16px', color:'#065f46', fontSize:'13px', display:'flex', alignItems:'center', gap:'8px'}}>
              <CheckCircle size={16} color="#10b981" /> Firebase connesso — {allVotes.length} voti ricevuti in tempo reale
            </div>
          )}
          
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <Users size={24} color="#7c3aed" />
              <div style={styles.statNumber}>{allVotes.length}</div>
              <div style={styles.statLabel}>Totali</div>
            </div>
            <div style={styles.statCard}>
              <CheckCircle size={24} color="#10b981" />
              <div style={styles.statNumber}>{confirmedVotes.length}</div>
              <div style={styles.statLabel}>Confermati</div>
            </div>
            <div style={styles.statCard}>
              <Clock size={24} color="#f59e0b" />
              <div style={styles.statNumber}>{pendingVotes.length}</div>
              <div style={styles.statLabel}>In Attesa</div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Voti in Attesa ({pendingVotes.length})</h2>
            {pendingVotes.length === 0 ? (
              <p style={styles.emptyState}>Nessun voto in attesa</p>
            ) : (
              pendingVotes.map(vote => (
                <div key={vote.id} style={styles.voteCard}>
                  <div style={styles.voteHeader}>
                    <strong>{vote.nome} {vote.cognome}</strong>
                    <span style={styles.timestamp}>{new Date(vote.timestamp).toLocaleTimeString('it-IT')}</span>
                  </div>
                  {CONFIG.categories.map(cat => (
                    <div key={cat.id} style={styles.voteDetail}>
                      <span>{cat.icon} {cat.name}</span>
                      <strong>{vote[cat.id]}</strong>
                    </div>
                  ))}
                  <div style={styles.voteActions}>
                    <button onClick={() => confirmVote(vote.id)} style={styles.confirmButton}>
                      <CheckCircle size={16} /> Conferma
                    </button>
                    <button onClick={() => deleteVote(vote.id)} style={styles.deleteButton}>
                      <XCircle size={16} /> Elimina
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Voti Confermati ({confirmedVotes.length})</h2>
            <div style={styles.confirmedGrid}>
              {confirmedVotes.map(vote => (
                <div key={vote.id} style={styles.confirmedVote}>
                  <CheckCircle size={14} color="#10b981" />
                  <span>{vote.nome} {vote.cognome}</span>
                  <button onClick={() => deleteVote(vote.id)} style={styles.deleteIconButton}>
                    <XCircle size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Anteprima Risultati</h2>
            {CONFIG.categories.map(cat => {
              const winner = winners[cat.id];
              return (
                <div key={cat.id} style={styles.resultPreview}>
                  <div style={styles.resultHeader}>{cat.icon} {cat.name}</div>
                  <div style={styles.resultWinner}>
                    <Crown size={18} color="#f59e0b" />
                    <strong>{winner.winner}</strong>
                    <span>({winner.votes} voti)</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.adminActions}>
            {!resultsPublished ? (
              <button onClick={publishResults} style={styles.publishButton}>
                <Trophy size={20} /> Pubblica Risultati
              </button>
            ) : (
              <div style={styles.publishedBadge}>
                <CheckCircle size={20} /> Risultati Pubblicati
              </div>
            )}
            <button onClick={() => setPage('home')} style={styles.secondaryButton}>Home</button>
          </div>

          <div style={{marginTop:'16px'}}>
            <button onClick={resetAll} style={styles.resetButton}>
              🗑️ RESET COMPLETO (cancella tutti i voti)
            </button>
            <p style={{fontSize:'11px', color:'#9ca3af', textAlign:'center', marginTop:'6px', marginBottom:0}}>
              Usa solo per i test — elimina tutto e riporta l'app allo stato iniziale
            </p>
          </div>

          <div style={{marginTop:'24px', background:'#1e1b4b', borderRadius:'12px', padding:'20px'}}>
            <h3 style={{color:'#a5b4fc', fontSize:'14px', fontWeight:'700', marginBottom:'12px', marginTop:0}}>
              🔧 Firestore Security Rules — copia queste su Firebase Console
            </h3>
            <pre style={{color:'#e0e7ff', fontSize:'12px', overflowX:'auto', margin:0, lineHeight:'1.6'}}>
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /votes/{document} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if true;
    }
    match /settings/{document} {
      allow read: if true;
      allow write: if true;
    }
  }
}`}
            </pre>
            <p style={{color:'#818cf8', fontSize:'11px', marginTop:'10px', marginBottom:0}}>
              Vai su: console.firebase.google.com → votazioni-carnevale → Firestore → Rules → incolla → Pubblica
            </p>
          </div>
        </div>
      </div>
    );
  }

  // RESULTS PAGE
  if (page === 'results' || (resultsPublished && votingEnded)) {
    if (!resultsPublished) {
      return (
        <div style={styles.pageContainer}>
          <div style={styles.card}>
            <img src="/logo.png" alt="Logo" style={styles.logoSmall} onError={(e) => e.target.style.display = 'none'} />
            <h1 style={styles.pageTitle}>Risultati</h1>
            <p style={styles.pageSubtitle}>I risultati non sono ancora stati pubblicati</p>
            <button onClick={() => setPage('home')} style={styles.primaryButton}>Torna Home</button>
          </div>
        </div>
      );
    }

    const winners = calculateWinners();

    return (
      <div style={styles.pageContainer}>
        <div style={styles.resultsContainer}>
          <h1 style={styles.resultsTitle}>🏆 I Vincitori! 🏆</h1>
          
          {CONFIG.categories.map((cat, idx) => {
            const winner = winners[cat.id];
            const winnerOption = cat.options.find(opt => opt.name === winner.winner);
            
            return (
              <div key={cat.id} style={{...styles.winnerCard, animationDelay: `${idx * 0.15}s`}}>
                <div style={styles.winnerIcon}>{cat.icon}</div>
                <div style={styles.winnerCategory}>{cat.name}</div>
                <img 
                  src={winnerOption ? winnerOption.image : ''}
                  alt={winner.winner} 
                  style={styles.winnerImage}
                  onError={(e) => { e.target.onerror = null; e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                />
                <div style={{...styles.winnerImagePlaceholder, display:'none'}}>🏆</div>
                <div style={styles.winnerName}>
                  <Crown size={20} color="#f59e0b" />
                  {winner.winner}
                </div>
                <div style={styles.winnerVotes}>{winner.votes} voti</div>
              </div>
            );
          })}

          <div style={styles.resultsFooter}>
            <img
              src="/logo.png"
              alt="Feel the Aura"
              style={styles.logoSpinning}
              onError={(e) => e.target.style.display = 'none'}
            />
            <p style={{fontSize:'15px', color:'#5b21b6', fontWeight:'600', margin:'0 0 12px 0'}}>
              Se ti è piaciuto, seguici! 🎉
            </p>
            <a
              href="https://www.instagram.com/feel.the.aura_/"
              target="_blank"
              rel="noopener noreferrer"
              style={{...styles.instagramLink, display:'inline-flex'}}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
              @feel.the.aura_ su Instagram
            </a>
          </div>
        </div>
        
        <div style={styles.confettiContainer}>
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.confetti,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#7c3aed', '#10b981', '#f59e0b'][Math.floor(Math.random() * 3)]
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // THANK YOU PAGE
  if (page === 'thankyou') {
    const timeRemaining = votingEnded ? 0 : Math.max(0, votingEndTime - currentTime);
    
    return (
      <div style={styles.pageContainer}>
        <div style={styles.card}>
          <img src="/logo.png" alt="Logo" style={styles.logoSmall} onError={(e) => e.target.style.display = 'none'} />
          <div style={styles.successIcon}>✨</div>
          <h1 style={styles.pageTitle}>Grazie per aver votato!</h1>
          <p style={styles.pageSubtitle}>Il tuo voto è stato registrato con successo</p>
          
          {!votingEnded && timeRemaining > 0 && (
            <div style={styles.countdownBoxSmall}>
              <Clock size={24} color="#7c3aed" />
              <div style={styles.countdownLabelSmall}>Fine votazioni tra:</div>
              <div style={styles.countdownTimerSmall}>{formatTime(timeRemaining)}</div>
            </div>
          )}
          
          <div style={styles.infoBoxThankYou}>
            <p style={styles.infoTextThankYou}>
              I risultati appariranno dopo la chiusura delle votazioni e la conferma da parte degli organizzatori.
            </p>
          </div>

          <a
            href="https://www.instagram.com/feel.the.aura_/"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.instagramLink}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
            Nel frattempo seguici su Instagram!
          </a>
          
          <div style={{marginBottom: '16px'}}></div>
          <button onClick={() => setPage('home')} style={styles.primaryButton}>Torna alla Home</button>
        </div>
      </div>
    );
  }

  // VOTING PAGE
  if (page === 'vote') {
    if (!votingOpen) {
      return (
        <div style={styles.pageContainer}>
          <div style={styles.card}>
            <img src="/logo.png" alt="Logo" style={styles.logoSmall} onError={(e) => e.target.style.display = 'none'} />
            <h1 style={styles.pageTitle}>Votazioni Chiuse</h1>
            <p style={styles.pageSubtitle}>Le votazioni non sono più aperte</p>
            <button onClick={() => setPage('home')} style={styles.primaryButton}>Torna Home</button>
          </div>
        </div>
      );
    }

    // se ha già votato, mostra thankyou (non bloccare qui con render intermedio)
    if (hasVoted) {
      return (
        <div style={styles.pageContainer}>
          <div style={styles.card}>
            <img src="/logo.png" alt="Logo" style={styles.logoSmall} onError={(e) => e.target.style.display = 'none'} />
            <div style={styles.successIcon}>✅</div>
            <h1 style={styles.pageTitle}>Hai già votato!</h1>
            <p style={styles.pageSubtitle}>Puoi votare una sola volta</p>
            <button onClick={() => setPage('home')} style={styles.primaryButton}>Torna Home</button>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.pageContainer}>
        <div style={styles.votingContainer}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img src="/logo.png" alt="Logo" style={styles.logoVoting} onError={(e) => e.target.style.display = 'none'} />
          </div>
          <h1 style={styles.votingTitle}>Vota Ora!</h1>
          
          <div style={styles.timerBox}>
            <Clock size={20} color="#7c3aed" />
            <span style={styles.timerText}>Tempo: {formatTime(timeUntilEnd)}</span>
          </div>

          <div style={styles.warningBoxVoting}>
            <div style={styles.warningIconSmall}>⚠️</div>
            <p style={styles.warningTextSmall}>
              Inserisci nome e cognome come nella lista invitati
            </p>
          </div>

          <div style={styles.formSection}>
            <input
              type="text"
              placeholder="Nome"
              value={userData.nome}
              onChange={(e) => setUserData({ ...userData, nome: e.target.value })}
              style={styles.inputLarge}
            />
            <input
              type="text"
              placeholder="Cognome"
              value={userData.cognome}
              onChange={(e) => setUserData({ ...userData, cognome: e.target.value })}
              style={styles.inputLarge}
            />
          </div>

          {CONFIG.categories.map(category => (
            <div key={category.id} style={styles.voteCategory}>
              <div style={styles.voteCategoryHeader}>
                <span style={styles.voteCategoryIcon}>{category.icon}</span>
                <h3 style={styles.voteCategoryTitle}>{category.name}</h3>
              </div>
              <div style={styles.voteOptionsGrid}>
                {category.options.map(option => (
                  <button
                    key={option.name}
                    onClick={() => setVotes({ ...votes, [category.id]: option.name })}
                    style={{
                      ...styles.voteOption,
                      ...(votes[category.id] === option.name ? styles.voteOptionSelected : {})
                    }}
                  >
                    <div style={styles.voteOptionImageBox}>
                      <img 
                        src={option.image} 
                        alt={option.name}
                        style={styles.voteOptionImage}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="267"%3E%3Crect fill="%23e5e7eb" width="200" height="267"/%3E%3Ctext fill="%23999" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EFoto%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      {votes[category.id] === option.name && (
                        <div style={styles.voteOptionCheck}>
                          <CheckCircle size={28} color="white" />
                        </div>
                      )}
                    </div>
                    <div style={styles.voteOptionName}>{option.name}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {saveError && (
            <div style={styles.errorBox}>
              ⚠️ {saveError}
            </div>
          )}

          {firestoreStatus.startsWith('error') && (
            <div style={styles.errorBox}>
              ❌ Problema di connessione Firebase: {firestoreStatus}<br/>
              <small>Controlla le Firestore Security Rules su Firebase Console</small>
            </div>
          )}

          <button 
            onClick={saveVote} 
            style={{...styles.primaryButton, background: loading ? '#a78bfa' : '#7c3aed'}}
            disabled={loading}
          >
            {loading ? '⏳ Salvataggio...' : 'INVIA VOTI'}
          </button>
          <button onClick={() => setPage('home')} style={styles.secondaryButton}>Annulla</button>
        </div>
      </div>
    );
  }

  // HOME PAGE
  return (
    <div style={styles.pageContainer}>
      <div style={styles.homeContainer}>
        <img src="/logo.png" alt="Feel the Aura" style={styles.logoLarge} onError={(e) => e.target.style.display = 'none'} />
        
        <h1 style={styles.welcomeTitle}>Benvenuti al Voting Event</h1>
        <p style={styles.welcomeSubtitle}>Votate i vostri preferiti nelle 4 categorie!</p>

        <div style={styles.categoriesList}>
          {CONFIG.categories.map(cat => (
            <div key={cat.id} style={styles.categoryItem}>
              <span style={styles.categoryEmoji}>{cat.icon}</span>
              <span style={styles.categoryName}>{cat.name}</span>
            </div>
          ))}
        </div>

        {votingNotStarted && (
          <div style={styles.countdownBox}>
            <Clock size={32} color="#7c3aed" />
            <div style={styles.countdownLabel}>Votazioni iniziano tra:</div>
            <div style={styles.countdownTimer}>{formatTime(timeUntilStart)}</div>
          </div>
        )}

        {votingOpen && (
          <div style={styles.countdownBoxActive}>
            <Sparkles size={32} color="#10b981" />
            <div style={styles.countdownLabel}>Tempo rimasto:</div>
            <div style={styles.countdownTimer}>{formatTime(timeUntilEnd)}</div>
          </div>
        )}

        {votingEnded && !resultsPublished && (
          <div style={styles.waitingScreen}>
            <img
              src="/logo.png"
              alt="Feel the Aura"
              style={styles.logoSpinning}
              onError={(e) => e.target.style.display = 'none'}
            />
            <div style={styles.waitingTitle}>Votazioni terminate!</div>
            <div style={styles.waitingSubtitle}>Stiamo contando i voti...<br/>I vincitori saranno annunciati a breve ✨</div>
            <a
              href="https://www.instagram.com/feel.the.aura_/"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.instagramLink}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
              Nel frattempo seguici su Instagram!
            </a>
          </div>
        )}

        <div style={styles.warningBox}>
          <div style={styles.warningIcon}>⚠️</div>
          <p style={styles.warningText}>
            Il voto sarà valido solo se il tuo nome e cognome sono presenti nella lista invitati
          </p>
        </div>

        {votingOpen && !hasVoted && (
          <button onClick={() => setPage('vote')} style={styles.primaryButton}>
            INIZIA A VOTARE
          </button>
        )}

        {hasVoted && (
          <div style={styles.votedMessage}>
            <CheckCircle size={24} color="#10b981" />
            <span>Hai già votato!</span>
          </div>
        )}

        {votingEnded && resultsPublished && (
          <button onClick={() => setPage('results')} style={styles.primaryButton}>
            VEDI I VINCITORI
          </button>
        )}

        <button onClick={() => setPage('admin')} style={styles.secondaryButton}>
          ADMIN PANEL
        </button>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
    padding: '20px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // HOME PAGE
  homeContainer: {
    width: '100%',
    maxWidth: '500px',
    background: 'white',
    borderRadius: '24px',
    padding: '40px 30px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    textAlign: 'center',
  },
  logoLarge: {
    maxWidth: '200px',
    width: '60%',
    height: 'auto',
    marginBottom: '30px',
  },
  logoMedium: {
    maxWidth: '150px',
    width: '50%',
    height: 'auto',
    marginBottom: '20px',
  },
  logoSmall: {
    maxWidth: '120px',
    width: '40%',
    height: 'auto',
    marginBottom: '20px',
  },
  logoVoting: {
    maxWidth: '220px',
    width: '65%',
    height: 'auto',
    display: 'block',
    margin: '0 auto',
  },
  welcomeTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '12px',
    lineHeight: '1.2',
  },
  welcomeSubtitle: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '30px',
  },
  categoriesList: {
    background: '#f9fafb',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '24px',
  },
  categoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    fontSize: '15px',
    color: '#374151',
    fontWeight: '500',
  },
  categoryEmoji: {
    fontSize: '24px',
  },
  categoryName: {
    textAlign: 'left',
  },
  countdownBox: {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  countdownBoxActive: {
    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  countdownLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginTop: '12px',
    marginBottom: '8px',
  },
  countdownTimer: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#7c3aed',
  },
  infoMessage: {
    background: '#f3f4f6',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
  },
  infoMessageText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  warningBox: {
    background: '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  warningIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  warningText: {
    fontSize: '14px',
    color: '#92400e',
    fontWeight: '500',
    margin: 0,
    textAlign: 'left',
    lineHeight: '1.5',
  },
  primaryButton: {
    width: '100%',
    background: '#7c3aed',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '18px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '12px',
    transition: 'all 0.2s',
    letterSpacing: '0.5px',
  },
  secondaryButton: {
    width: '100%',
    background: '#e5e7eb',
    color: '#374151',
    border: 'none',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  votedMessage: {
    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#065f46',
    marginBottom: '12px',
  },
  
  // VOTING PAGE
  votingContainer: {
    width: '100%',
    maxWidth: '600px',
    background: 'white',
    borderRadius: '24px',
    padding: '30px 20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  votingTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '16px',
    textAlign: 'center',
  },
  timerBox: {
    background: '#fef3c7',
    borderRadius: '10px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  timerText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#92400e',
  },
  warningBoxVoting: {
    background: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  warningIconSmall: {
    fontSize: '16px',
  },
  warningTextSmall: {
    fontSize: '13px',
    color: '#92400e',
    fontWeight: '500',
    margin: 0,
    textAlign: 'left',
  },
  formSection: {
    marginBottom: '24px',
  },
  inputLarge: {
    width: '100%',
    padding: '16px',
    borderRadius: '10px',
    border: '2px solid #e5e7eb',
    fontSize: '16px',
    fontFamily: 'inherit',
    marginBottom: '12px',
    boxSizing: 'border-box',
  },
  voteCategory: {
    background: '#f9fafb',
    borderRadius: '16px',
    padding: '20px 16px',
    marginBottom: '20px',
  },
  voteCategoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  voteCategoryIcon: {
    fontSize: '24px',
  },
  voteCategoryTitle: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  voteOptionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
  },
  voteOption: {
    background: 'white',
    border: '3px solid #d1d5db',
    borderRadius: '12px',
    padding: 0,
    cursor: 'pointer',
    transition: 'all 0.2s',
    overflow: 'hidden',
  },
  voteOptionSelected: {
    borderColor: '#7c3aed',
    boxShadow: '0 0 0 2px rgba(124, 58, 237, 0.2)',
  },
  voteOptionImageBox: {
    position: 'relative',
    width: '100%',
    paddingTop: '133.33%',
    overflow: 'hidden',
    background: '#f3f4f6',
  },
  voteOptionImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  voteOptionCheck: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: '#7c3aed',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  voteOptionName: {
    padding: '12px 8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  
  // GENERIC CARD
  card: {
    width: '100%',
    maxWidth: '450px',
    background: 'white',
    borderRadius: '24px',
    padding: '40px 30px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    textAlign: 'center',
  },
  pageTitle: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '12px',
  },
  pageSubtitle: {
    fontSize: '15px',
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
  successIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  countdownBoxSmall: {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  countdownLabelSmall: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginTop: '10px',
    marginBottom: '6px',
  },
  countdownTimerSmall: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#7c3aed',
  },
  infoBoxThankYou: {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
  },
  infoTextThankYou: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    lineHeight: '1.6',
  },
  
  // ADMIN
  adminContainer: {
    width: '100%',
    maxWidth: '1000px',
    background: 'white',
    borderRadius: '24px',
    padding: '30px 20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  adminTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '20px',
    textAlign: 'center',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
    marginBottom: '24px',
  },
  statCard: {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#1f2937',
    marginTop: '8px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '600',
    marginTop: '4px',
  },
  section: {
    marginBottom: '28px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '12px',
  },
  voteCard: {
    background: 'white',
    border: '2px solid #fbbf24',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
  },
  voteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    fontSize: '15px',
  },
  timestamp: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  voteDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: '13px',
    color: '#374151',
    borderBottom: '1px solid #f3f4f6',
  },
  voteActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  confirmButton: {
    flex: 1,
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  deleteButton: {
    flex: 1,
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  confirmedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '8px',
  },
  confirmedVote: {
    background: '#d1fae5',
    borderRadius: '8px',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: '600',
  },
  deleteIconButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    marginLeft: 'auto',
    color: '#dc2626',
    padding: '4px',
  },
  resultPreview: {
    background: '#fef3c7',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
  },
  resultHeader: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '8px',
  },
  resultWinner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#92400e',
  },
  adminActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  publishButton: {
    flex: 1,
    background: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  publishedBadge: {
    flex: 1,
    background: '#d1fae5',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '15px',
    fontWeight: '700',
    color: '#065f46',
  },
  
  // RESULTS
  resultsContainer: {
    width: '100%',
    maxWidth: '600px',
    background: 'white',
    borderRadius: '24px',
    padding: '40px 30px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    textAlign: 'center',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  resultsTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: '24px',
  },
  winnerCard: {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    animation: 'slideUp 0.4s ease-out',
  },
  winnerIcon: {
    fontSize: '36px',
    marginBottom: '8px',
  },
  winnerCategory: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#92400e',
    marginBottom: '12px',
  },
  winnerImage: {
    width: '160px',
    height: '213px',
    objectFit: 'cover',
    borderRadius: '12px',
    marginBottom: '12px',
    border: '3px solid #f59e0b',
  },
  winnerName: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
  },
  winnerVotes: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '600',
  },
  
  // CONFETTI
  confettiContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 9999,
  },
  confetti: {
    position: 'absolute',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    animation: 'confettiFall 3s linear infinite',
  },
  
  emptyState: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: '24px',
    fontSize: '14px',
  },
  waitingScreen: {
    background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
    borderRadius: '20px',
    padding: '32px 24px',
    marginBottom: '20px',
    textAlign: 'center',
    border: '2px solid #7c3aed22',
  },
  logoSpinning: {
    width: '120px',
    height: '120px',
    objectFit: 'contain',
    animation: 'logoPulse 2s ease-in-out infinite',
    marginBottom: '16px',
    display: 'block',
    margin: '0 auto 16px auto',
  },
  waitingTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#4c1d95',
    marginBottom: '8px',
  },
  waitingSubtitle: {
    fontSize: '15px',
    color: '#5b21b6',
    lineHeight: '1.6',
    marginBottom: '20px',
  },
  instagramLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
    color: 'white',
    borderRadius: '50px',
    padding: '12px 22px',
    fontSize: '14px',
    fontWeight: '700',
    textDecoration: 'none',
    boxShadow: '0 4px 15px rgba(131,58,180,0.4)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  resultsFooter: {
    textAlign: 'center',
    padding: '24px 0 8px 0',
    borderTop: '2px solid #fde68a',
    marginTop: '8px',
  },
  logoResults: {
    maxWidth: '240px',
    width: '70%',
    height: 'auto',
    marginBottom: '20px',
    display: 'block',
    margin: '0 auto 20px auto',
  },
  resetButton: {
    width: '100%',
    background: '#fee2e2',
    color: '#991b1b',
    border: '2px solid #fca5a5',
    borderRadius: '12px',
    padding: '14px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  errorBox: {
    background: '#fef2f2',
    border: '2px solid #ef4444',
    borderRadius: '10px',
    padding: '14px 16px',
    marginBottom: '12px',
    color: '#b91c1c',
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '1.6',
  },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes confettiFall {
    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
  @keyframes logoPulse {
    0%   { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 8px rgba(124,58,237,0.4)); }
    25%  { transform: scale(1.08) rotate(8deg); filter: drop-shadow(0 0 16px rgba(124,58,237,0.7)); }
    50%  { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 8px rgba(124,58,237,0.4)); }
    75%  { transform: scale(1.08) rotate(-8deg); filter: drop-shadow(0 0 16px rgba(124,58,237,0.7)); }
    100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 8px rgba(124,58,237,0.4)); }
  }
  .instagram-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(131,58,180,0.5) !important;
  }
  button:hover:not(:disabled) { transform: translateY(-1px); opacity: 0.9; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  input:focus { outline: none; border-color: #7c3aed; }
  @media (max-width: 600px) {
    .voteOptionsGrid { grid-template-columns: 1fr !important; }
  }
`;
document.head.appendChild(styleSheet);

export default App;
