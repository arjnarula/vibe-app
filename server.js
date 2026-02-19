const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

app.post('/api/verify-passcode', (req, res) => {
  const { passcode } = req.body;
  const expected = process.env.DECK_PASSCODE;
  if (!expected) {
    return res.status(503).json({ success: false, error: 'Passcode not configured' });
  }
  if (passcode === expected) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false });
});

app.use(express.static(path.join(__dirname, 'build'), { maxAge: '1y', immutable: true }));

app.get('/health', (_req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send('healthy');
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`Listening on :${PORT}`));
