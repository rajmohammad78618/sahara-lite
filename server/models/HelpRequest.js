const mongoose = require('mongoose');

const helpRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: ['food', 'medical', 'education', 'shelter', 'clothes', 'other'],
      default: 'other',
    },
    amount: {
      type: Number,
      min: 0,
      default: 0, // 0 ka matlab amount nahi bataya
    },
    status: {
      type: String,
      enum: ['open', 'fulfilled'],
      default: 'open',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HelpRequest', helpRequestSchema);