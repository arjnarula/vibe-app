import { useState, useEffect, useRef, useCallback } from 'react';
import './DeckPage.css';

const TOTAL = 9;

const DeckPage = ({ onBack }) => {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);
  const slideRefs = useRef([]);
  const touchStartX = useRef(0);

  useEffect(() => {
    requestAnimationFrame(() => setPageVisible(true));
    if (slideRefs.current[0]) {
      slideRefs.current[0].style.cssText = 'opacity: 1; pointer-events: all;';
    }
  }, []);

  const goTo = useCallback((index) => {
    if (animating || index === current || index < 0 || index >= TOTAL) return;
    setAnimating(true);

    const dir = index > current ? 1 : -1;
    const outSlide = slideRefs.current[current];
    const inSlide = slideRefs.current[index];

    if (inSlide) {
      inSlide.style.cssText = `
        transition: none;
        opacity: 0;
        transform: translateY(${dir * 28}px);
        pointer-events: none;
      `;
      // eslint-disable-next-line no-unused-expressions
      inSlide.offsetHeight;
      inSlide.style.cssText = `
        opacity: 1;
        transform: translateY(0);
        pointer-events: all;
        transition: opacity 0.48s cubic-bezier(0, 0, 0.2, 1),
                    transform 0.48s cubic-bezier(0, 0, 0.2, 1);
      `;
    }

    if (outSlide) {
      outSlide.style.cssText = `
        opacity: 0;
        transform: translateY(${-dir * 28}px);
        pointer-events: none;
        transition: opacity 0.38s cubic-bezier(0.4, 0, 1, 1),
                    transform 0.38s cubic-bezier(0.4, 0, 1, 1);
      `;
    }

    setCurrent(index);

    setTimeout(() => {
      if (outSlide) outSlide.style.cssText = '';
      if (inSlide) inSlide.style.cssText = 'opacity: 1; pointer-events: all;';
      setAnimating(false);
    }, 520);
  }, [current, animating]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    const handleKey = (e) => {
      if (['ArrowRight', 'ArrowDown', ' '].includes(e.key)) { e.preventDefault(); next(); }
      if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); prev(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [next, prev]);

  const setSlideRef = useCallback((el, i) => {
    slideRefs.current[i] = el;
  }, []);

  const handleBack = () => {
    setPageVisible(false);
    setTimeout(() => onBack(), 400);
  };

  return (
    <div className={`deck-page ${pageVisible ? 'deck-page-visible' : ''}`}>
      <div className="deck-shell">
        {/* Chrome */}
        <div className="deck-brand">Deck</div>
        <button className="deck-back-btn" onClick={handleBack}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Home
        </button>
        <div className="deck-counter">{current + 1} / {TOTAL}</div>

        <nav className="deck-dots">
          {Array.from({ length: TOTAL }, (_, i) => (
            <button
              key={i}
              className={`deck-dot ${i === current ? 'deck-dot-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </nav>

        {current > 0 && (
          <button className="deck-arrow deck-arrow-prev" onClick={prev} aria-label="Previous">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        {current < TOTAL - 1 && (
          <button className="deck-arrow deck-arrow-next" onClick={next} aria-label="Next">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* Touch / Swipe */}
        <div
          className="deck-touch-layer"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(dx) > 52) { dx < 0 ? next() : prev(); }
          }}
        />

        {/* ═══════ SLIDES ═══════ */}

        {/* 1 — Title */}
        <section className="deck-slide deck-s1" ref={(el) => setSlideRef(el, 0)}>
          <div className="deck-s1-badge">
            <span className="deck-s1-dot" />
            Pre-Seed Round &mdash; 2026
          </div>
          <h1 className="deck-title deck-t-xl">Pantheon</h1>
          <p className="deck-s1-tagline">A Web Agent that Works</p>
          <div className="deck-divider" />
          <p className="deck-s1-sub">
            Automate any workflow on any website &mdash; deterministically, efficiently, and at enterprise scale.
          </p>
          <p className="deck-s1-meta">Confidential &nbsp;&middot;&nbsp; Not for distribution</p>
        </section>

        {/* 2 — Company Purpose */}
        <section className="deck-slide" ref={(el) => setSlideRef(el, 1)}>
          <div className="deck-s2">
            <p className="deck-label">Company Purpose</p>
            <h2 className="deck-title deck-t-lg" style={{ lineHeight: 1.1 }}>
              We automate online work so you can<br/><span className="deck-accent">focus on what matters.</span>
            </h2>
            <div className="deck-s2-grid">
              <div className="deck-card">
                <div className="deck-s2-icon">⚡</div>
                <div className="deck-s2-card-title">Any Website, Any Task</div>
                <p className="deck-body-sm">
                  Operates on any internal tool, SaaS platform, or website &mdash; no bespoke integrations, no proprietary APIs required.
                </p>
              </div>
              <div className="deck-card">
                <div className="deck-s2-icon">🔒</div>
                <div className="deck-s2-card-title">Enterprise-Grade Security</div>
                <p className="deck-body-sm">
                  Deployable fully on-premise. No customer data leaves your infrastructure. Compliance-ready by architecture.
                </p>
              </div>
              <div className="deck-card">
                <div className="deck-s2-icon">📐</div>
                <div className="deck-s2-card-title">Deterministic by Design</div>
                <p className="deck-body-sm">
                  Every action is auditable and explainable &mdash; not probabilistic guesswork. Reliable enough for production workloads.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3 — Problem */}
        <section className="deck-slide" ref={(el) => setSlideRef(el, 2)}>
          <div className="deck-inner-wide">
            <p className="deck-label">The Problem</p>
            <h2 className="deck-title deck-t-lg">
              AI automation is a top priority.<br/>
              <span className="deck-accent">Almost nobody is doing it right.</span>
            </h2>
            <div className="deck-s3-stats">
              <div className="deck-s3-stat">
                <div className="deck-s3-num">96%</div>
                <p className="deck-s3-stat-label">of CIOs cite AI-driven automation as a critical business priority</p>
              </div>
              <div className="deck-s3-stat">
                <div className="deck-s3-num">60%</div>
                <p className="deck-s3-stat-label">of enterprise AI pilots fail to deliver clear ROI due to cost and complexity</p>
              </div>
              <div className="deck-s3-stat">
                <div className="deck-s3-num">$500K+</div>
                <p className="deck-s3-stat-label">average annual cost of operational inefficiency per mid-sized enterprise</p>
              </div>
            </div>
            <div className="deck-s3-callout">
              <p className="deck-body-sm">
                Building in-house takes <strong style={{ color: 'var(--deck-white)' }}>12+ months</strong> and frequently stalls. Current web agents feed screenshots to frontier models at every step — they are too slow, too expensive, and blocked by enterprise anti-bot protection. The result: stalled pilots, eroded trust, and compounding costs.
              </p>
            </div>
          </div>
        </section>

        {/* 4 — Solution */}
        <section className="deck-slide" ref={(el) => setSlideRef(el, 3)}>
          <div className="deck-inner-wide">
            <p className="deck-label">Our Solution</p>
            <h2 className="deck-title deck-t-lg">A fundamentally <span className="deck-accent">different approach</span><br/>to web automation.</h2>
            <div className="deck-s4-compare">
              <div className="deck-s4-col deck-s4-theirs">
                <div className="deck-s4-head deck-s4-head-bad">Traditional Web Agents</div>
                <div className="deck-s4-row deck-s4-row-bad"><span className="deck-s4-icon">✕</span> Feed screenshots + DOM to LLMs at every step</div>
                <div className="deck-s4-row deck-s4-row-bad"><span className="deck-s4-icon">✕</span> Requires expensive frontier models — fragile &amp; slow</div>
                <div className="deck-s4-row deck-s4-row-bad"><span className="deck-s4-icon">✕</span> Fine-tuning on proprietary data per customer</div>
                <div className="deck-s4-row deck-s4-row-bad"><span className="deck-s4-icon">✕</span> Blocked by enterprise-grade anti-bot protection</div>
                <div className="deck-s4-row deck-s4-row-bad"><span className="deck-s4-icon">✕</span> 12+ months to deploy, limited to mid-market only</div>
              </div>
              <div className="deck-s4-col deck-s4-ours">
                <div className="deck-s4-head deck-s4-head-good">Pantheon</div>
                <div className="deck-s4-row deck-s4-row-good"><span className="deck-s4-icon">✓</span> Exposes every website action as a direct tool / MCP</div>
                <div className="deck-s4-row deck-s4-row-good"><span className="deck-s4-icon">✓</span> Runs on small open-source models — cheap and fast</div>
                <div className="deck-s4-row deck-s4-row-good"><span className="deck-s4-icon">✓</span> Zero fine-tuning required — deploys in days</div>
                <div className="deck-s4-row deck-s4-row-good"><span className="deck-s4-icon">✓</span> Natively bypasses anti-bot protection</div>
                <div className="deck-s4-row deck-s4-row-good"><span className="deck-s4-icon">✓</span> SME, mid-market, and enterprise — any size, day one</div>
              </div>
              <div className="deck-s4-callout">
                We give AI direct network access to every action on every website &mdash; the same way a browser works under the hood, but without the browser overhead or multi-modal inference.
              </div>
            </div>
          </div>
        </section>

        {/* 5 — Why Now */}
        <section className="deck-slide" ref={(el) => setSlideRef(el, 4)}>
          <div className="deck-inner-narrow">
            <p className="deck-label">Why Now</p>
            <h2 className="deck-title deck-t-lg">The window is open.<br/><span className="deck-accent">It won't stay open long.</span></h2>
            <div className="deck-s5-reasons">
              {[
                { n: '01', h: 'The market just validated web agents', p: 'Salesforce acquired Convergence, a direct web agent competitor, in 2025. Enterprises are actively demanding this capability — the wave is breaking now.' },
                { n: '02', h: 'Open-source models crossed the capability threshold', p: 'Our architecture only needs a model to select from structured tools. Even small open-source models can do this reliably today — making our approach viable at scale right now.' },
                { n: '03', h: 'Frontier models alone won\'t solve this for 2+ years', p: 'Inference costs and data compliance keep screenshot-based agents out of reach for most organisations. Our architecture sidesteps both — permanently, not temporarily.' },
              ].map((r) => (
                <div key={r.n} className="deck-s5-reason">
                  <div className="deck-s5-num">{r.n}</div>
                  <div>
                    <h4>{r.h}</h4>
                    <p>{r.p}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6 — Team */}
        <section className="deck-slide" ref={(el) => setSlideRef(el, 5)}>
          <div className="deck-inner-wide">
            <p className="deck-label" style={{ textAlign: 'center' }}>The Team</p>
            <h2 className="deck-title deck-t-lg" style={{ textAlign: 'center' }}>
              Built by people who've<br/><span className="deck-accent">done hard things before.</span>
            </h2>
            <div className="deck-s6-grid">
              <div className="deck-s6-person">
                <div className="deck-s6-name">Arjun Narula</div>
                <div className="deck-s6-role">CEO &amp; Co-Founder</div>
                <ul className="deck-s6-bullets">
                  <li>Led AI agentic work at Northflank, along with contributing to marketing and sales efforts</li>
                  <li>Backend Engineer at RobinAI — worked with AI researchers to improve the Legal AI assistant</li>
                  <li>Co-founder of MagicAPI — built the "Shopify for API providers", led sales and contributed to building the product. Generated recurring revenue</li>
                  <li>SWE at Amazon — used AI models to improve image and text placements on Prime Video and ad banners</li>
                  <li>"Data Scientist" at Hambro Perks — built a systematic approach to finding founders and startups for pre-seed funding, utilizing NLP and web automations. Sat on the investment team and also contributed as an investment analyst</li>
                </ul>
                <p className="deck-s6-edu">MEng &amp; BEng, Computer Science (AI) — Imperial College London</p>
              </div>
              <div className="deck-s6-person">
                <div className="deck-s6-name">Matt Malarkey</div>
                <div className="deck-s6-role">CTO &amp; Co-Founder</div>
                <ul className="deck-s6-bullets">
                  <li>Selected for a government-backed cyber program — secure-coding, reverse-engineering, pen-testing, among other things</li>
                  <li>Network Security Engineer at Open Systems — working within the Secure Web Gateway (proxy) team optimizing performance critical applications on edge platforms and cloud infrastructure</li>
                  <li>Electronic Trading Developer at Arctic Lake — worked on ultra low-latency mechanisms and integrations with multiple trading network protocols</li>
                  <li>Founder of Tunnel Ninja — built a mobile app for indoor skydiving bookings and events management. Onboarded customers and generated revenue</li>
                </ul>
                <p className="deck-s6-edu">MEng &amp; BEng, Computer Science (Systems &amp; Networking) — Imperial College London</p>
              </div>
            </div>
          </div>
        </section>

        {/* 7 — Market */}
        <section className="deck-slide" ref={(el) => setSlideRef(el, 6)}>
          <div className="deck-s7">
            <p className="deck-label">Market Potential</p>
            <h2 className="deck-title deck-t-lg">
              A massive market,<br/>still in its <span className="deck-accent">earliest innings.</span>
            </h2>
            <div className="deck-s7-markets">
              <div className="deck-s7-market deck-s7-tam">
                <p className="deck-s7-tier">TAM</p>
                <div className="deck-s7-value">$6T</div>
                <p className="deck-s7-desc">Manual work automatable by AI agents by 2030 (McKinsey / Goldman)</p>
                <p className="deck-s7-growth">↑ Total opportunity horizon</p>
              </div>
              <div className="deck-s7-market deck-s7-sam">
                <p className="deck-s7-tier">SAM</p>
                <div className="deck-s7-value">$5B</div>
                <p className="deck-s7-desc">AI automation market in 2024, growing at 80%+ annually</p>
                <p className="deck-s7-growth">↑ 80%+ CAGR</p>
              </div>
              <div className="deck-s7-market deck-s7-som">
                <p className="deck-s7-tier">SOM</p>
                <div className="deck-s7-value">$500M</div>
                <p className="deck-s7-desc">SME &amp; mid-market web automation — our near-term beachhead</p>
                <p className="deck-s7-growth">↑ 3-year capture target</p>
              </div>
            </div>
            <p className="deck-s7-note">
              Competitive validation: Salesforce acquired Convergence (web agent) in 2025 &nbsp;&middot;&nbsp;
              Agent AI is the fastest-growing software category on record
            </p>
          </div>
        </section>

        {/* 8 — Vision */}
        <section className="deck-slide" ref={(el) => setSlideRef(el, 7)}>
          <div className="deck-s8">
            <p className="deck-label">Vision</p>
            <p className="deck-s8-quote">
              "The infrastructure layer for automating<br/>work on the web &mdash;
              <span className="deck-accent">for every business,<br/>at any scale.</span>"
            </p>
            <div className="deck-s8-stages">
              <div className="deck-s8-stage">
                <p className="deck-s8-phase">Phase 1 &nbsp;&middot;&nbsp; Now</p>
                <p className="deck-s8-stage-title">B2C Validation</p>
                <p className="deck-body-sm">Launch lightweight consumer product to validate reliability at scale, generate distribution, and collect usage data to accelerate model optimisation.</p>
              </div>
              <div className="deck-s8-stage">
                <p className="deck-s8-phase">Phase 2 &nbsp;&middot;&nbsp; 3–6 Months</p>
                <p className="deck-s8-stage-title">B2B Design Partners</p>
                <p className="deck-body-sm">Onboard startups and mid-market companies as paid customers. Prove ROI, refine integrations, and build the case study library needed to win enterprise.</p>
              </div>
              <div className="deck-s8-stage">
                <p className="deck-s8-phase">Phase 3 &nbsp;&middot;&nbsp; 12 Months+</p>
                <p className="deck-s8-stage-title">Enterprise at Scale</p>
                <p className="deck-body-sm">On-premise deployments with full compliance, governance, and audit trails. The most reliable, secure web automation platform in the market.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 9 — Next Steps */}
        <section className="deck-slide" ref={(el) => setSlideRef(el, 8)}>
          <div className="deck-s9">
            <p className="deck-label">Next Steps</p>
            <div className="deck-s9-raise">
              <p className="deck-s9-raise-label">Currently Raising</p>
              <div className="deck-s9-amount">Pre-Seed</div>
              <p className="deck-s9-raise-sub">To prove technical leadership and secure first revenue</p>
            </div>
            <div className="deck-s9-milestones">
              <div className="deck-s9-milestone">
                <p className="deck-s9-m-title">🏆&nbsp; Benchmark Leadership</p>
                <p className="deck-body-sm">State-of-the-art performance on real-world web automation benchmarks within 1 month, validating our technical edge.</p>
              </div>
              <div className="deck-s9-milestone">
                <p className="deck-s9-m-title">🤝&nbsp; Design Partners</p>
                <p className="deck-body-sm">Multiple paying B2B customers or committed design partners within 3–6 months, proving clear commercial pull.</p>
              </div>
              <div className="deck-s9-milestone">
                <p className="deck-s9-m-title">👥&nbsp; Key First Hires</p>
                <p className="deck-body-sm">Senior B2B enterprise seller to accelerate commercial validation, plus deep technical builders in AI and systems engineering.</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default DeckPage;
