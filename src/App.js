import { useState, useRef } from 'react';
import './App.css';
import FloatingOrbs from './FloatingOrbs';
import SignUpModal from './SignUpModal';

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const buttonRef = useRef(null);
  const orbPositionsRef = useRef([]);

  const handleSignIn = (userData) => {
    setUser(userData);
    setModalOpen(false);
  };

  if (user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
          {user.picture && (
            <img
              src={user.picture}
              alt=""
              style={{ width: 64, height: 64, borderRadius: '50%', marginBottom: 16 }}
            />
          )}
          <h1 style={{ fontFamily: 'Dm sans, sans-serif', fontSize: 32, marginBottom: 8 }}>
            Welcome, {user.givenName || user.name}
          </h1>
          <p style={{ color: '#bcbcbc', marginBottom: 24 }}>{user.email}</p>
          <button
            onClick={() => setUser(null)}
            style={{
              background: 'none', border: '1px solid #595959', color: '#fff',
              padding: '10px 24px', borderRadius: 6, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontSize: 14,
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <FloatingOrbs condensing={modalOpen} orbPositionsRef={orbPositionsRef} />
      <main className="landing">
        <div className={`landing-content ${modalOpen ? 'landing-content-faded' : ''}`}>
          <h1 className="name">Pantheon</h1>
          <h2 className="headline">A Web Agent that Works</h2>
          <p className="subheading">Automate your work on any website</p>
          <button
            ref={buttonRef}
            className="cta-button"
            onClick={() => setModalOpen(true)}
          >
            Sign Up
          </button>
        </div>
      </main>
      <SignUpModal
        open={modalOpen}
        buttonRef={buttonRef}
        onClose={() => setModalOpen(false)}
        onSignIn={handleSignIn}
        orbPositionsRef={orbPositionsRef}
      />
    </>
  );
}

export default App;
