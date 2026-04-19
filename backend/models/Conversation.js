const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  publications: [{ type: mongoose.Schema.Types.Mixed }],
  trials: [{ type: mongoose.Schema.Types.Mixed }],
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  patientContext: {
    name: String,
    disease: String,
    location: String,
    additionalInfo: String
  },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);
