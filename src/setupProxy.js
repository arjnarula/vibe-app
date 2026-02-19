module.exports = function (app) {
  const express = require('express');
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
};
