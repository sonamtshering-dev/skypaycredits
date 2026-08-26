const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['customer', 'admin'], required: true },
  text:   { type: String, required: true, maxlength: 2000 },
}, { timestamps: true })

const ticketSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true, maxlength: 200 },
  status:  { type: String, enum: ['open', 'replied', 'closed'], default: 'open' },
  messages: [messageSchema],
}, { timestamps: true })

module.exports = mongoose.model('Ticket', ticketSchema)
