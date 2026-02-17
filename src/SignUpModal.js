import { useEffect, useRef, useState } from 'react';
import './SignUpModal.css';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function decodeJwtPayload(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(json);
}

const BLOB_SIZES = [300, 260, 240];
const BLOB_GRADIENTS = [
  'radial-gradient(circle, rgba(229,214,148,0.92) 0%, rgba(229,214,148,0) 70%)',
  'radial-gradient(circle, rgba(203,174,44,0.92) 0%, rgba(203,174,44,0) 70%)',
  'radial-gradient(circle, rgba(255,138,94,0.92) 0%, rgba(255,138,94,0) 70%)',
];

const SignUpModal = ({ open, buttonRef, onClose, onSignIn, orbPositionsRef }) => {
  const [active, setActive] = useState(false);
  const [blobStyles, setBlobStyles] = useState(null);
  const [googleReady, setGoogleReady] = useState(false);
  const originRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const googleBtnRef = useRef(null);
  const onSignInRef = useRef(onSignIn);
  onSignInRef.current = onSignIn;

  // Open / close lifecycle
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (open) {
      // Compute card origin from button
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        originRef.current = {
          x: rect.left + rect.width / 2 - window.innerWidth / 2,
          y: rect.top + rect.height / 2 - window.innerHeight / 2,
        };
      }

      // Fix 3: Map live orb positions → blob positions inside the card
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cx = vw / 2, cy = vh / 2;
      const positions = orbPositionsRef?.current;

      if (positions && positions.length === 3) {
        const dists = positions.map((p) =>
          Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2)
        );
        const maxDist = Math.max(...dists, 1);
        setBlobStyles(
          positions.map((p, i) => ({
            left: `${(p.x / vw) * 100}%`,
            top: `${(p.y / vh) * 100}%`,
            delay: `${((dists[i] / maxDist) * 0.20).toFixed(2)}s`,
          }))
        );
      }

      setGoogleReady(false);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setActive(true);
        });
      });
    } else {
      setActive(false);
      setGoogleReady(false);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [open, buttonRef, orbPositionsRef]);

  // Initialize Google Identity Services
  useEffect(() => {
    if (!active || !CLIENT_ID) return;

    const tryInit = () => {
      const g = window.google?.accounts?.id;
      if (!g || !googleBtnRef.current) return false;
      googleBtnRef.current.innerHTML = '';

      g.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          try {
            const p = decodeJwtPayload(response.credential);
            onSignInRef.current?.({
              name: p.name,
              givenName: p.given_name,
              email: p.email,
              picture: p.picture,
            });
          } catch (err) {
            console.error('Failed to decode Google credential', err);
          }
        },
      });

      g.renderButton(googleBtnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: Math.min(googleBtnRef.current.offsetWidth || 320, 400),
      });

      setGoogleReady(true);
      return true;
    };

    if (!tryInit()) {
      const id = setInterval(() => {
        if (tryInit()) clearInterval(id);
      }, 100);
      return () => clearInterval(id);
    }
  }, [active]);

  // Always render — no conditional return (Fix 2: eliminates first-click DOM jank)
  const { x, y } = originRef.current;
  const hasClientId = Boolean(CLIENT_ID);

  return (
    <>
      <div
        className={`modal-backdrop ${active ? 'modal-backdrop-active' : ''}`}
        onClick={active ? onClose : undefined}
      />
      <div
        className={`modal-card ${active ? 'modal-card-active' : ''}`}
        style={{ '--ox': `${x}px`, '--oy': `${y}px` }}
      >
        {/* Glow layer — radial gradients, no filter:blur (Fix 2) */}
        <div className="modal-glow-layer" aria-hidden="true">
          {BLOB_SIZES.map((size, i) => {
            const bs = blobStyles?.[i];
            return (
              <div
                key={i}
                className="modal-glow"
                style={{
                  width: size,
                  height: size,
                  background: BLOB_GRADIENTS[i],
                  left: bs?.left ?? '50%',
                  top: bs?.top ?? '50%',
                  transitionDelay: active ? (bs?.delay ?? '0.3s') : '0s',
                }}
              />
            );
          })}
        </div>

        <div className="modal-dark-overlay" aria-hidden="true" />

        <div className="modal-content">
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <h2 className="modal-title">Sign in to Pantheon</h2>
          <p className="modal-subtitle">Get started with your account</p>
          <div className="modal-divider" />

          {hasClientId ? (
            <>
              <div
                ref={googleBtnRef}
                className={`google-btn-container ${googleReady ? 'google-btn-ready' : ''}`}
              />
              {!googleReady && (
                <div className="google-btn-loading">
                  <div className="google-btn-spinner" />
                  Loading&hellip;
                </div>
              )}
            </>
          ) : (
            <div className="google-btn-notice">
              <p>Google Sign-In is not configured.</p>
              <p className="google-btn-notice-sub">
                Add <code>REACT_APP_GOOGLE_CLIENT_ID</code> to your <code>.env</code> file.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SignUpModal;
