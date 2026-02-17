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

const SignUpModal = ({ open, buttonRef, onClose, onSignIn }) => {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const originRef = useRef({ x: 0, y: 0 });
  const timeoutRef = useRef(null);
  const rafRef = useRef(null);
  const googleBtnRef = useRef(null);
  const onSignInRef = useRef(onSignIn);
  onSignInRef.current = onSignIn;

  // Mount / unmount lifecycle
  useEffect(() => {
    clearTimeout(timeoutRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (open) {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        originRef.current = {
          x: rect.left + rect.width / 2 - window.innerWidth / 2,
          y: rect.top + rect.height / 2 - window.innerHeight / 2,
        };
      }
      setMounted(true);
      setGoogleReady(false);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setActive(true);
        });
      });
    } else {
      setActive(false);
      timeoutRef.current = setTimeout(() => {
        setMounted(false);
        setGoogleReady(false);
      }, 550);
    }

    return () => {
      clearTimeout(timeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [open, buttonRef]);

  // Initialize Google Identity Services once active + mounted
  useEffect(() => {
    if (!active || !CLIENT_ID) return;

    const tryInit = () => {
      const g = window.google?.accounts?.id;
      if (!g || !googleBtnRef.current) return false;

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

  if (!mounted) return null;

  const { x, y } = originRef.current;
  const hasClientId = Boolean(CLIENT_ID);

  return (
    <>
      <div
        className={`modal-backdrop ${active ? 'modal-backdrop-active' : ''}`}
        onClick={onClose}
      />
      <div
        className={`modal-card ${active ? 'modal-card-active' : ''}`}
        style={{ '--ox': `${x}px`, '--oy': `${y}px` }}
      >
        {/* Gradient glow layer */}
        <div className="modal-glow-layer" aria-hidden="true">
          <div className="modal-glow modal-glow-0" />
          <div className="modal-glow modal-glow-1" />
          <div className="modal-glow modal-glow-2" />
        </div>

        {/* Dark overlay */}
        <div className="modal-dark-overlay" aria-hidden="true" />

        {/* Content */}
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
              {/* Google SDK renders its official button here */}
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
