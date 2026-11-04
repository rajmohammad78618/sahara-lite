const express = require('express');
const mongoose = require('mongoose');
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

// Apni request ko "fulfilled" mark karna
router.patch('/:id/fulfill', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid request id' });
    }

    const helpRequest = await HelpRequest.findById(req.params.id);
    if (!helpRequest) {
      return res.status(404).json({ message: 'Request nahi mili' });
    }

    if (helpRequest.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'Sirf apni request ko hi badal sakte ho' });
    }

    helpRequest.status = 'fulfilled';
    await helpRequest.save();

    res.json({ request: helpRequest });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Apni request ko delete karna
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid request id' });
    }

    const helpRequest = await HelpRequest.findById(req.params.id);
    if (!helpRequest) {
      return res.status(404).json({ message: 'Request nahi mili' });
    }

    if (helpRequest.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'Sirf apni request ko hi delete kar sakte ho' });
    }

    await helpRequest.deleteOne();

    res.json({ message: 'Request delete ho gayi' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;