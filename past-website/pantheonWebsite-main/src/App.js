import './App.css';
import FloatingOrbs from './FloatingOrbs';

function App() {
  return (
    <>
      <FloatingOrbs />
      <main className="landing">
        <div className="landing-content">
          <h1 className="name">Pantheon</h1>
          <h2 className="headline">A Web Agent that Works</h2>
          <p className="subheading">Automate your work on any website</p>
          <button className="cta-button" disabled>
            Coming Soon
          </button>
        </div>
      </main>
    </>
  );
}

export default App;
