const express = require('express')
const router  = express.Router()
const Ticket  = require('../models/Ticket')
const { protect, adminOnly } = require('../middlewares/authMiddleware')

// POST /api/tickets — customer creates ticket
router.post('/', protect, async (req, res) => {
  try {
    const subject = req.body.subject?.trim().slice(0, 200)
    const text    = req.body.text?.trim().slice(0, 2000)
    if (!subject || !text) return res.status(400).json({ message: 'Subject and message are required' })

    const ticket = await Ticket.create({
      userId: req.user._id,
      subject,
      messages: [{ sender: 'customer', text }],
    })
    res.status(201).json(ticket)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/tickets/my — customer gets their tickets
router.get('/my', protect, async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user._id }).sort({ updatedAt: -1 }).limit(20)
    res.json(tickets)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/tickets/:id/message — customer sends follow-up
router.post('/:id/message', protect, async (req, res) => {
  try {
    const text = req.body.text?.trim().slice(0, 2000)
    if (!text) return res.status(400).json({ message: 'Message is required' })

    const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.user._id })
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
    if (ticket.status === 'closed') return res.status(400).json({ message: 'Ticket is closed' })

    ticket.messages.push({ sender: 'customer', text })
    ticket.status = 'open'
    await ticket.save()
    res.json(ticket)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/tickets — admin gets all tickets
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const filter = {}
    if (req.query.status) filter.status = req.query.status
    const tickets = await Ticket.find(filter)
      .populate('userId', 'name email')
      .sort({ updatedAt: -1 })
      .limit(100)
    res.json(tickets)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/tickets/:id/reply — admin replies
router.post('/:id/reply', protect, adminOnly, async (req, res) => {
  try {
    const text = req.body.text?.trim().slice(0, 2000)
    if (!text) return res.status(400).json({ message: 'Reply is required' })

    const ticket = await Ticket.findById(req.params.id)
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })

    ticket.messages.push({ sender: 'admin', text })
    ticket.status = 'replied'
    await ticket.save()
    await ticket.populate('userId', 'name email')
    res.json(ticket)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/tickets/:id/status — admin closes/reopens
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const VALID = ['open', 'replied', 'closed']
    if (!VALID.includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' })

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('userId', 'name email')
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
    res.json(ticket)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
