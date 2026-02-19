import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Users, CheckCircle, XCircle, Crown, Sparkles } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, onSnapshot } from 'firebase/firestore';

// Configurazione Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA4SCniDnYFa_vRKdKT5WiCRP0PXd8VLIw",
  authDomain: "votazioni-carnevale.firebaseapp.com",
  projectId: "votazioni-carnevale",
  storageBucket: "votazioni-carnevale.firebasestorage.app",
  messagingSenderId: "755574583484",
  appId: "1:755574583484:web:92a496bdcda0927ede20b9"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configurazione - PERSONALIZZA QUI
const CONFIG = {
  votingStartTime: new Date('2026-02-22T23:00:00').getTime(),
  votingDuration: 30 * 60 * 1000,
  adminPassword: 'carnevale2026',
  categories: [
    {
      id: 'cat1',
      name: 'Miglior Gruppo Iconico',
      icon: '🎨',
      options: [
        { name: 'Gruppo 1', image: '/images/gruppo1.jpg' },
        { name: 'Gruppo 2', image: '/images/gruppo2.jpg' },
        { name: 'Gruppo 3', image: '/images/gruppo3.jpg' }
      ]
    },
    {
      id: 'cat2',
      name: 'Gruppo Più Divertente',
      icon: '😂',
      options: [
        { name: 'Gruppo 4', image: '/images/gruppo4.jpg' },
        { name: 'Gruppo 5', image: '/images/gruppo5.jpg' },
        { name: 'Gruppo 6', image: '/images/gruppo6.jpg' }
      ]
    },
    {
      id: 'cat3',
      name: 'Miglior Coppia Iconica',
      icon: '👑',
      options: [
        { name: 'Coppia 1', image: '/images/coppia1.jpg' },
        { name: 'Coppia 2', image: '/images/coppia2.jpg' },
        { name: 'Coppia 3', image: '/images/coppia3.jpg' }
      ]
    },
    {
      id: 'cat4',
      name: 'Coppia Più Divertente',
      icon: '👥',
      options: [
        { name: 'Coppia 4', image: '/images/coppia4.jpg' },
        { name: 'Coppia 5', image: '/images/coppia5.jpg' },
        { name: 'Coppia 6', image: '/images/coppia6.jpg' }
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
    checkIfVoted();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'votes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const votesData = [];
      snapshot.forEach((doc) => {
        votesData.push({ id: doc.id, ...doc.data() });
      });
      setAllVotes(votesData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'settings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.forEach((doc) => {
        if (doc.data().resultsPublished !== undefined) {
          setResultsPublished(doc.data().resultsPublished);
        }
      });
    });
    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      const settingsSnap = await getDocs(collection(db, 'settings'));
      settingsSnap.forEach((doc) => {
        if (doc.data().resultsPublished !== undefined) {
          setResultsPublished(doc.data().resultsPublished);
        }
      });
    } catch (error) {
      console.log('Error loading data:', error);
    }
  };

  const checkIfVoted = () => {
    const voted = localStorage.getItem('carnival-voted-2026');
    if (voted) setHasVoted(true);
  };

  const saveVote = async () => {
    if (!userData.nome || !userData.cognome) {
      alert('Inserisci nome e cognome!');
      return;
    }

    const allCategoriesVoted = CONFIG.categories.every(cat => votes[cat.id]);
    if (!allCategoriesVoted) {
      alert('Vota per tutte le categorie!');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'votes'), {
        nome: userData.nome.trim(),
        cognome: userData.cognome.trim(),
        ...votes,
        timestamp: Date.now(),
        confirmed: false
      });
      
      localStorage.setItem('carnival-voted-2026', 'true');
      setHasVoted(true);
      setShowConfetti(true);
      
      setTimeout(() => {
        setShowConfetti(false);
        setPage('thankyou');
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      alert('Errore nel salvataggio. Riprova!');
      setLoading(false);
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

  // ADMIN PAGE (continua nel prossimo messaggio per lunghezza)
  if (page === 'admin') {
    if (!adminAuth) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <img src="/images/logo.png" alt="Logo" style={styles.logoSmall} onError={(e) => e.target.style.display = 'none'} />
            <h1 style={styles.title}>🎭 Admin Panel</h1>
            <input
              type="password"
              placeholder="Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (adminPassword === CONFIG.adminPassword ? setAdminAuth(true) : alert('Password errata!'))}
              style={styles.input}
            />
            <button onClick={() => adminPassword === CONFIG.adminPassword ? setAdminAuth(true) : alert('Password errata!')} style={styles.button}>Accedi</button>
            <button onClick={() => setPage('home')} style={styles.buttonSecondary}>Home</button>
          </div>
        </div>
      );
    }

    const confirmedVotes = allVotes.filter(v => v.confirmed);
    const pendingVotes = allVotes.filter(v => !v.confirmed);
    const winners = calculateWinners();

    return (
      <div style={styles.container}>
        <div style={styles.adminPanel}>
          <h1 style={styles.title}>🎭 Admin</h1>
          
          <div style={styles.statsRow}>
            <div style={styles.statCard}><Users size={32} color="#9333ea" /><div style={styles.statNumber}>{allVotes.length}</div><div style={styles.statLabel}>Totali</div></div>
            <div style={styles.statCard}><CheckCircle size={32} color="#16a34a" /><div style={styles.statNumber}>{confirmedVotes.length}</div><div style={styles.statLabel}>Confermati</div></div>
            <div style={styles.statCard}><Clock size={32} color="#ea580c" /><div style={styles.statNumber}>{pendingVotes.length}</div><div style={styles.statLabel}>In Attesa</div></div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>In Attesa</h2>
            {pendingVotes.length === 0 ? <p style={styles.emptyState}>Nessuno</p> : pendingVotes.map(vote => (
              <div key={vote.id} style={styles.voteCard}>
                <div style={styles.voteHeader}>
                  <strong>{vote.nome} {vote.cognome}</strong>
                  <span style={styles.timestamp}>{new Date(vote.timestamp).toLocaleTimeString('it-IT')}</span>
                </div>
                {CONFIG.categories.map(cat => (
                  <div key={cat.id} style={styles.voteDetail}>
                    <span>{cat.icon} {cat.name}:</span>
                    <span style={styles.voteChoice}>{vote[cat.id]}</span>
                  </div>
                ))}
                <div style={styles.voteActions}>
                  <button onClick={() => confirmVote(vote.id)} style={styles.buttonConfirm}><CheckCircle size={16} /> Conferma</button>
                  <button onClick={() => deleteVote(vote.id)} style={styles.buttonDelete}><XCircle size={16} /> Elimina</button>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Confermati ({confirmedVotes.length})</h2>
            <div style={styles.confirmedList}>
              {confirmedVotes.map(vote => (
                <div key={vote.id} style={styles.confirmedVote}>
                  <CheckCircle size={16} color="#16a34a" />
                  <span>{vote.nome} {vote.cognome}</span>
                  <button onClick={() => deleteVote(vote.id)} style={styles.buttonDeleteSmall}><XCircle size={14} /></button>
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
                  <div style={styles.resultHeader}><span style={styles.resultCategoryName}>{cat.icon} {cat.name}</span></div>
                  <div style={styles.resultWinner}><Crown size={20} color="#fbbf24" /><strong>{winner.winner}</strong><span style={styles.voteCount}>({winner.votes})</span></div>
                  <div style={styles.resultAll}>
                    {winner.all.map(([option, count], idx) => (
                      <div key={option} style={styles.resultOption}><span>{idx + 1}. {option}</span><span style={styles.voteCount}>{count}</span></div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.adminActions}>
            {!resultsPublished ? (
              <button onClick={publishResults} style={styles.buttonPublish}><Trophy size={20} /> Pubblica</button>
            ) : (
              <div style={styles.publishedBadge}><CheckCircle size={20} /> Pubblicati</div>
            )}
            <button onClick={() => setPage('home')} style={styles.buttonSecondary}>Home</button>
          </div>
        </div>
      </div>
    );
  }

  // RESULTS
  if (page === 'results' || (resultsPublished && votingEnded)) {
    if (!resultsPublished) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <img src="/images/logo.png" alt="Logo" style={styles.logoSmall} onError={(e) => e.target.style.display = 'none'} />
            <h1 style={styles.title}>Risultati</h1>
            <p style={styles.subtitle}>Non ancora pubblicati!</p>
            <button onClick={() => setPage('home')} style={styles.button}>Home</button>
          </div>
        </div>
      );
    }

    const winners = calculateWinners();

    return (
      <div style={styles.container}>
        <div style={styles.resultsContainer}>
          <img src="/images/logo.png" alt="Logo" style={styles.logoResults} onError={(e) => e.target.style.display = 'none'} />
          <h1 style={styles.titleLarge}>🏆 I Vincitori! 🏆</h1>
          <p style={styles.subtitle}>Carnevale 2026</p>
          
          {CONFIG.categories.map((cat, idx) => {
            const winner = winners[cat.id];
            const winnerOption = cat.options.find(opt => opt.name === winner.winner);
            
            return (
              <div key={cat.id} style={{...styles.winnerCard, animationDelay: `${idx * 0.2}s`}}>
                <div style={styles.winnerIcon}>{cat.icon}</div>
                <div style={styles.winnerCategory}>{cat.name}</div>
                {winnerOption?.image && <img src={winnerOption.image} alt={winner.winner} style={styles.winnerImage} onError={(e) => e.target.style.display = 'none'} />}
                <div style={styles.winnerName}><Crown size={24} color="#fbbf24" />{winner.winner}</div>
                <div style={styles.winnerVotes}>{winner.votes} voti</div>
              </div>
            );
          })}

          <button onClick={() => setPage('home')} style={styles.buttonLarge}>Home</button>
        </div>
        
        <div style={styles.confettiContainer}>
          {[...Array(50)].map((_, i) => (
            <div key={i} style={{...styles.confetti, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, backgroundColor: ['#9333ea', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'][Math.floor(Math.random() * 5)]}} />
          ))}
        </div>
      </div>
    );
  }

  // THANK YOU
  if (page === 'thankyou') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <img src="/images/logo.png" alt="Logo" style={styles.logoSmall} onError={(e) => e.target.style.display = 'none'} />
          <div style={styles.successIcon}>✨</div>
          <h1 style={styles.title}>Grazie!</h1>
          <p style={styles.subtitle}>Voto registrato!</p>
          <p style={styles.text}>I risultati saranno pubblicati dopo la conferma.</p>
          <button onClick={() => setPage('home')} style={styles.button}>Home</button>
        </div>
      </div>
    );
  }

  // VOTING
  if (page === 'vote') {
    if (!votingOpen) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <img src="/images/logo.png" alt="Logo" style={styles.logoSmall} onError={(e) => e.target.style.display = 'none'} />
            <h1 style={styles.title}>⏰ Votazioni chiuse!</h1>
            <button onClick={() => setPage('home')} style={styles.button}>Home</button>
          </div>
        </div>
      );
    }

    if (hasVoted) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <img src="/images/logo.png" alt="Logo" style={styles.logoSmall} onError={(e) => e.target.style.display = 'none'} />
            <h1 style={styles.title}>✅ Hai già votato!</h1>
            <button onClick={() => setPage('home')} style={styles.button}>Home</button>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.container}>
        <div style={styles.votingCard}>
          <img src="/images/logo.png" alt="Logo" style={styles.logoVoting} onError={(e) => e.target.style.display = 'none'} />
          <h1 style={styles.title}>🗳️ Vota!</h1>
          
          <div style={styles.timerSmall}><Clock size={20} /><span>Tempo: {formatTime(timeUntilEnd)}</span></div>

          <div style={styles.userForm}>
            <input type="text" placeholder="Nome" value={userData.nome} onChange={(e) => setUserData({ ...userData, nome: e.target.value })} style={styles.input} />
            <input type="text" placeholder="Cognome" value={userData.cognome} onChange={(e) => setUserData({ ...userData, cognome: e.target.value })} style={styles.input} />
          </div>

          {CONFIG.categories.map(category => (
            <div key={category.id} style={styles.categoryCard}>
              <div style={styles.categoryHeader}>
                <span style={styles.categoryIcon}>{category.icon}</span>
                <h3 style={styles.categoryTitle}>{category.name}</h3>
              </div>
              <div style={styles.optionsGrid}>
                {category.options.map(option => (
                  <button
                    key={option.name}
                    onClick={() => setVotes({ ...votes, [category.id]: option.name })}
                    style={{...styles.optionCard, ...(votes[category.id] === option.name ? styles.optionCardSelected : {})}}
                  >
                    <div style={styles.optionImageContainer}>
                      <img src={option.image} alt={option.name} style={styles.optionImage} onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="267"%3E%3Crect fill="%23ddd" width="200" height="267"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EFoto%3C/text%3E%3C/svg%3E'} />
                      {votes[category.id] === option.name && (
                        <div style={styles.optionCheckmark}><CheckCircle size={32} /></div>
                      )}
                    </div>
                    <div style={styles.optionName}>{option.name}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button onClick={saveVote} style={styles.buttonLarge} disabled={loading}>
            {loading ? 'Invio...' : (<><Trophy size={20} />Invia Voti</>)}
          </button>
          <button onClick={() => setPage('home')} style={styles.buttonSecondary}>Annulla</button>
        </div>

        {showConfetti && (
          <div style={styles.confettiContainer}>
            {[...Array(100)].map((_, i) => (
              <div key={i} style={{...styles.confetti, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, backgroundColor: ['#9333ea', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'][Math.floor(Math.random() * 5)]}} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // HOME
  return (
    <div style={styles.container}>
      <div style={styles.homeCard}>
        <img src="/images/logo.png" alt="Logo" style={styles.logo} onError={(e) => e.target.style.display = 'none'} />
        <h1 style={styles.titleLarge}>Carnevale 2026</h1>
        <p style={styles.subtitle}>Vota i Migliori Costumi!</p>

        {votingNotStarted && (
          <>
            <div style={styles.countdown}>
              <Clock size={48} />
              <div style={styles.countdownText}>Le votazioni iniziano tra:</div>
              <div style={styles.countdownTime}>{formatTime(timeUntilStart)}</div>
            </div>
            <div style={styles.infoBox}>
              <p style={styles.infoText}>
                📅 {new Date(CONFIG.votingStartTime).toLocaleString('it-IT')}<br />
                ⏱️ Durata: 20 minuti<br />
                🏆 Categorie: {CONFIG.categories.length}
              </p>
            </div>
          </>
        )}

        {votingOpen && (
          <>
            <div style={styles.countdownActive}>
              <Sparkles size={48} color="#f59e0b" />
              <div style={styles.countdownText}>APERTE!</div>
              <div style={styles.countdownTime}>{formatTime(timeUntilEnd)}</div>
            </div>
            {!hasVoted ? (
              <button onClick={() => setPage('vote')} style={styles.buttonLarge}><Trophy size={24} />Vota Ora!</button>
            ) : (
              <div style={styles.votedBadge}><CheckCircle size={24} />Hai votato!</div>
            )}
          </>
        )}

        {votingEnded && !resultsPublished && (
          <div style={styles.infoBox}>
            <h2 style={styles.infoTitle}>Chiuse</h2>
            <p style={styles.infoText}>Risultati a breve...</p>
          </div>
        )}

        {votingEnded && resultsPublished && (
          <button onClick={() => setPage('results')} style={styles.buttonLarge}><Crown size={24} />Vincitori!</button>
        )}

        <button onClick={() => setPage('admin')} style={styles.adminLink}>Admin</button>
      </div>

      <div style={styles.bgDecoration1} />
      <div style={styles.bgDecoration2} />
      <div style={styles.bgDecoration3} />
    </div>
  );
};

const styles = {
  container: {minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)', padding: '20px', fontFamily: "'Poppins', sans-serif", position: 'relative', overflow: 'hidden'},
  homeCard: {maxWidth: '600px', margin: '0 auto', background: 'rgba(255, 255, 255, 0.95)', borderRadius: '30px', padding: '60px 40px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center', position: 'relative', zIndex: 1},
  logo: {maxWidth: '200px', height: 'auto', marginBottom: '20px'},
  logoSmall: {maxWidth: '120px', height: 'auto', marginBottom: '20px'},
  logoVoting: {maxWidth: '150px', height: 'auto', marginBottom: '15px'},
  logoResults: {maxWidth: '180px', height: 'auto', marginBottom: '20px'},
  titleLarge: {fontSize: '48px', fontWeight: '800', background: 'linear-gradient(45deg, #9333ea, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '10px'},
  title: {fontSize: '32px', fontWeight: '700', color: '#1f2937', marginBottom: '10px'},
  subtitle: {fontSize: '18px', color: '#6b7280', marginBottom: '30px'},
  countdown: {background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '20px', padding: '40px', marginBottom: '30px', border: '3px solid #f59e0b'},
  countdownActive: {background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', borderRadius: '20px', padding: '40px', marginBottom: '30px', border: '3px solid #10b981', animation: 'pulse 2s infinite'},
  countdownText: {fontSize: '20px', fontWeight: '600', color: '#1f2937', marginTop: '20px', marginBottom: '10px'},
  countdownTime: {fontSize: '48px', fontWeight: '800', color: '#9333ea'},
  infoBox: {background: 'rgba(147, 51, 234, 0.1)', borderRadius: '15px', padding: '30px', marginBottom: '20px'},
  infoTitle: {fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '15px'},
  infoText: {fontSize: '16px', color: '#4b5563', lineHeight: '1.8'},
  buttonLarge: {background: 'linear-gradient(45deg, #9333ea, #ec4899)', color: 'white', border: 'none', borderRadius: '15px', padding: '20px 40px', fontSize: '20px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '15px', transition: 'transform 0.2s', width: '100%', justifyContent: 'center'},
  button: {background: '#9333ea', color: 'white', border: 'none', borderRadius: '12px', padding: '15px 30px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'transform 0.2s', width: '100%', marginBottom: '10px'},
  buttonSecondary: {background: '#e5e7eb', color: '#1f2937', border: 'none', borderRadius: '12px', padding: '15px 30px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'transform 0.2s', width: '100%'},
  adminLink: {background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', marginTop: '20px', textDecoration: 'underline'},
  votedBadge: {background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', borderRadius: '15px', padding: '20px', display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '700', color: '#15803d'},
  card: {maxWidth: '500px', margin: '0 auto', background: 'rgba(255, 255, 255, 0.95)', borderRadius: '30px', padding: '60px 40px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center', position: 'relative', zIndex: 1},
  votingCard: {maxWidth: '800px', margin: '0 auto', background: 'rgba(255, 255, 255, 0.95)', borderRadius: '30px', padding: '40px 20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative', zIndex: 1},
  timerSmall: {display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', padding: '12px 20px', borderRadius: '10px', marginBottom: '30px', fontSize: '16px', fontWeight: '600', color: '#92400e'},
  userForm: {display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px', padding: '0 20px'},
  input: {padding: '15px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '16px', fontFamily: "'Poppins', sans-serif", transition: 'border-color 0.2s'},
  categoryCard: {background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', borderRadius: '20px', padding: '25px 15px', marginBottom: '25px', border: '2px solid #e5e7eb'},
  categoryHeader: {display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingLeft: '10px'},
  categoryIcon: {fontSize: '32px'},
  categoryTitle: {fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0},
  optionsGrid: {display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', padding: '0 5px'},
  optionCard: {background: 'white', border: '3px solid #d1d5db', borderRadius: '15px', padding: '0', cursor: 'pointer', transition: 'all 0.3s', overflow: 'hidden'},
  optionCardSelected: {borderColor: '#9333ea', boxShadow: '0 0 0 3px rgba(147, 51, 234, 0.2)'},
  optionImageContainer: {position: 'relative', width: '100%', paddingTop: '133%', overflow: 'hidden'},
  optionImage: {position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover'},
  optionCheckmark: {position: 'absolute', top: '10px', right: '10px', background: '#9333ea', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.3)'},
  optionName: {padding: '12px', fontSize: '14px', fontWeight: '600', color: '#1f2937', textAlign: 'center'},
  successIcon: {fontSize: '80px', marginBottom: '20px'},
  text: {fontSize: '16px', color: '#6b7280', marginBottom: '20px'},
  adminPanel: {maxWidth: '1200px', margin: '0 auto', background: 'rgba(255, 255, 255, 0.95)', borderRadius: '30px', padding: '40px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative', zIndex: 1},
  statsRow: {display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px'},
  statCard: {background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', borderRadius: '20px', padding: '30px', textAlign: 'center', border: '2px solid #e5e7eb'},
  statNumber: {fontSize: '48px', fontWeight: '800', color: '#1f2937', marginTop: '15px'},
  statLabel: {fontSize: '14px', color: '#6b7280', fontWeight: '600', marginTop: '5px'},
  section: {marginBottom: '40px'},
  sectionTitle: {fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '20px'},
  voteCard: {background: 'white', borderRadius: '15px', padding: '20px', marginBottom: '15px', border: '2px solid #fbbf24'},
  voteHeader: {display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', fontSize: '18px'},
  timestamp: {fontSize: '14px', color: '#6b7280'},
  voteDetail: {display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6'},
  voteChoice: {fontSize: '14px', fontWeight: '600', color: '#1f2937'},
  voteActions: {display: 'flex', gap: '10px', marginTop: '15px'},
  buttonConfirm: {background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', flex: 1},
  buttonDelete: {background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', flex: 1},
  confirmedList: {display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px'},
  confirmedVote: {background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', borderRadius: '10px', padding: '12px 15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '600'},
  buttonDeleteSmall: {background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: 'auto', color: '#dc2626'},
  resultPreview: {background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '15px', padding: '20px', marginBottom: '20px', border: '2px solid #f59e0b'},
  resultHeader: {marginBottom: '15px'},
  resultCategoryName: {fontSize: '18px', fontWeight: '700', color: '#1f2937'},
  resultWinner: {display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', fontWeight: '700', color: '#92400e', marginBottom: '15px', padding: '15px', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '10px'},
  resultAll: {display: 'flex', flexDirection: 'column', gap: '8px'},
  resultOption: {display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.3)', borderRadius: '8px', fontSize: '14px'},
  voteCount: {fontSize: '14px', color: '#6b7280', fontWeight: '600'},
  adminActions: {display: 'flex', gap: '15px', marginTop: '40px'},
  buttonPublish: {background: 'linear-gradient(45deg, #f59e0b, #fbbf24)', color: 'white', border: 'none', borderRadius: '12px', padding: '15px 30px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', flex: 1},
  publishedBadge: {background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', borderRadius: '12px', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: '700', color: '#15803d', flex: 1, justifyContent: 'center'},
  resultsContainer: {maxWidth: '800px', margin: '0 auto', background: 'rgba(255, 255, 255, 0.95)', borderRadius: '30px', padding: '60px 40px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center', position: 'relative', zIndex: 1},
  winnerCard: {background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '20px', padding: '30px', marginBottom: '25px', border: '3px solid #f59e0b', animation: 'slideIn 0.5s ease-out'},
  winnerIcon: {fontSize: '48px', marginBottom: '10px'},
  winnerCategory: {fontSize: '18px', fontWeight: '600', color: '#92400e', marginBottom: '15px'},
  winnerImage: {width: '200px', height: '266px', objectFit: 'cover', borderRadius: '15px', marginBottom: '15px', border: '3px solid #f59e0b'},
  winnerName: {fontSize: '28px', fontWeight: '800', color: '#1f2937', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center'},
  winnerVotes: {fontSize: '16px', color: '#6b7280', fontWeight: '600'},
  confettiContainer: {position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999},
  confetti: {position: 'absolute', width: '10px', height: '10px', borderRadius: '50%', animation: 'confettiFall 3s linear infinite'},
  bgDecoration1: {position: 'absolute', top: '10%', left: '5%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', animation: 'float 6s ease-in-out infinite'},
  bgDecoration2: {position: 'absolute', bottom: '15%', right: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(80px)', animation: 'float 8s ease-in-out infinite', animationDelay: '2s'},
  bgDecoration3: {position: 'absolute', top: '50%', right: '5%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(50px)', animation: 'float 7s ease-in-out infinite', animationDelay: '4s'},
  emptyState: {textAlign: 'center', color: '#9ca3af', padding: '40px', fontSize: '16px'},
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.02)}}@keyframes slideIn{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}@keyframes confettiFall{0%{transform:translateY(-100vh) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}@keyframes float{0%,100%{transform:translateY(0) translateX(0)}33%{transform:translateY(-20px) translateX(10px)}66%{transform:translateY(10px) translateX(-10px)}}button:hover{transform:translateY(-2px)}button:disabled{opacity:0.6;cursor:not-allowed}input:focus{outline:none;border-color:#9333ea}@media (max-width:768px){.optionsGrid{grid-template-columns:1fr!important}}`;
document.head.appendChild(styleSheet);

export default App;
