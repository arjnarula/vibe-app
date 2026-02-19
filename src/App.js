import { useEffect, useRef, useState } from 'react';
import './App.css';
import FloatingOrbs from './FloatingOrbs';
import SignUpModal from './SignUpModal';
import DeckPage from './DeckPage';

const USER_STORAGE_KEY = 'pantheon_user';
const DECK_AUTH_KEY = 'pantheon_deck_auth';
const AGENT_PATH = '/agent';
const DECK_PATH = '/deck';
const TRANSITION_MS = 450;
const SIGNOUT_FADE_MS = 400;

function safeReadStoredUser() {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to read stored user', error);
    return null;
  }
}

function isDeckAuthed() {
  return sessionStorage.getItem(DECK_AUTH_KEY) === '1';
}

function setBrowserPath(pathname, replace = false) {
  if (window.location.pathname === pathname) return;
  const nextUrl = `${pathname}${window.location.search}${window.location.hash}`;
  if (replace) {
    window.history.replaceState({}, '', nextUrl);
    return;
  }
  window.history.pushState({}, '', nextUrl);
}

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [user, setUser] = useState(() => safeReadStoredUser());
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [transitioning, setTransitioning] = useState(false);
  const [agentVisible, setAgentVisible] = useState(
    () => window.location.pathname === AGENT_PATH && safeReadStoredUser() !== null
  );
  const [deckAuthed, setDeckAuthed] = useState(() => isDeckAuthed());
  const [showDeck, setShowDeck] = useState(
    () => window.location.pathname === DECK_PATH && isDeckAuthed()
  );
  const [orbsDispersing, setOrbsDispersing] = useState(
    () => window.location.pathname === DECK_PATH && isDeckAuthed()
  );
  const buttonRef = useRef(null);
  const orbPositionsRef = useRef([]);

  useEffect(() => {
    const onPopState = () => {
      const p = window.location.pathname;
      setPathname(p);
      setAgentVisible(p === AGENT_PATH && !!user);
      const deckActive = p === DECK_PATH && isDeckAuthed();
      setShowDeck(deckActive);
      setOrbsDispersing(deckActive);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) {
      localStorage.removeItem(USER_STORAGE_KEY);
      if (pathname === AGENT_PATH) {
        setBrowserPath('/', true);
        setPathname('/');
        setAgentVisible(false);
      }
      return;
    }
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }, [user, pathname]);

  useEffect(() => {
    if (pathname === DECK_PATH && !deckAuthed) {
      setBrowserPath('/', true);
      setPathname('/');
      setShowDeck(false);
    }
  }, [pathname, deckAuthed]);

  const handleSignIn = (userData) => {
    setUser(userData);
    setTransitioning(true);
    setModalOpen(false);

    setTimeout(() => {
      setBrowserPath(AGENT_PATH);
      setPathname(AGENT_PATH);
      setTransitioning(false);
      requestAnimationFrame(() => setAgentVisible(true));
    }, TRANSITION_MS);
  };

  const handleDeckAuth = () => {
    sessionStorage.setItem(DECK_AUTH_KEY, '1');
    setDeckAuthed(true);
    setTransitioning(true);
    setModalOpen(false);
    setOrbsDispersing(true);

    setTimeout(() => {
      setBrowserPath(DECK_PATH);
      setPathname(DECK_PATH);
      setTransitioning(false);
      requestAnimationFrame(() => setShowDeck(true));
    }, TRANSITION_MS);
  };

  const handleDeckBack = () => {
    setShowDeck(false);
    setOrbsDispersing(false);
    setBrowserPath('/');
    setPathname('/');
  };

  const handleSignOut = () => {
    setAgentVisible(false);
    setTimeout(() => {
      setUser(null);
      setBrowserPath('/');
      setPathname('/');
    }, SIGNOUT_FADE_MS);
  };

  const isAgentRoute = pathname === AGENT_PATH && user && !transitioning;
  const isDeckRoute = pathname === DECK_PATH && deckAuthed && !transitioning;

  return (
    <>
      <FloatingOrbs
        condensing={modalOpen}
        dispersing={orbsDispersing}
        orbPositionsRef={orbPositionsRef}
      />

      {isDeckRoute && showDeck && (
        <DeckPage onBack={handleDeckBack} />
      )}

      {isAgentRoute ? (
        <main className={`agent-page ${agentVisible ? 'agent-page-visible' : ''}`}>
          <header className="agent-header">
            <h1 className="agent-brand">Agent</h1>
            <div className="agent-user-info">
              <div className="agent-user-meta">
                <span className="agent-user-name">{user.givenName || user.name}</span>
                <span className="agent-user-email">{user.email}</span>
              </div>
              <button className="agent-signout-btn" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          </header>
          <section className="agent-chat-shell">
            <h2 className="agent-empty-state">Coming soon</h2>
            <div className="agent-input-wrap">
              <button className="agent-attach-btn" aria-label="Attach">+</button>
              <input
                className="agent-input"
                placeholder="Ask anything"
                aria-label="Message Pantheon Agent"
              />
              <button className="agent-send-btn" aria-label="Send">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 8L14 2L10 14L8.5 9.5L2 8Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </section>
        </main>
      ) : !(isDeckRoute && showDeck) && (
        <>
          <main className="landing">
            <div className={`landing-content ${modalOpen || transitioning ? 'landing-content-faded' : ''}`}>
              <h1 className="name">Pantheon</h1>
              <h2 className="headline">A Web Agent that Works</h2>
              <p className="subheading">Automate your work on any website</p>
              <button
                ref={buttonRef}
                className="cta-button"
                onClick={() => setModalOpen(true)}
              >
            Sign In
          </button>
            </div>
          </main>
          <SignUpModal
            open={modalOpen}
            buttonRef={buttonRef}
            onClose={() => setModalOpen(false)}
            onSignIn={handleSignIn}
            onDeckAuth={handleDeckAuth}
            orbPositionsRef={orbPositionsRef}
          />
        </>
      )}
    </>
  );
}

export default App;
