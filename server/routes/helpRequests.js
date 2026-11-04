const express = require('express');
const HelpRequest = require('../models/HelpRequest');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Nayi help request banana
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, amount } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: 'Title aur description zaroori hain' });
    }

    const helpRequest = await HelpRequest.create({
      title,
      description,
      category,
      amount,
      createdBy: req.user.id,
    });

    res.status(201).json({ request: helpRequest });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Saari open requests ki list (nayi pehle)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const requests = await HelpRequest.find({ status: 'open' })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;