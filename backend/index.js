const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  // Fail fast when no Mongo connection string is present.
  console.error('Missing MONGO_URI environment variable.');
  process.exit(1);
}

const allowedOrigins = (process.env.CLIENT_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  })
);
app.use(express.json());

// Quote model: store daily quotes
const quoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    author: { type: String, trim: true },
  },
  { timestamps: true }
);
const Quote = mongoose.model('Quote', quoteSchema);

const todoSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Todo = mongoose.model('Todo', todoSchema);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Quotes APIs
// Get one random quote (new quote on refresh)
app.get('/api/quotes/random', async (_req, res) => {
  try {
    const docs = await Quote.aggregate([{ $sample: { size: 1 } }]);
    if (!docs.length) return res.status(404).json({ message: 'No quotes found' });
    res.json(docs[0]);
  } catch (err) {
    console.error('Failed to fetch random quote:', err);
    res.status(500).json({ message: 'Failed to fetch random quote' });
  }
});

// Insert quotes (single or bulk). Consider protecting in production.
app.post('/api/quotes', async (req, res) => {
  try {
    const { text, author, quotes } = req.body || {};
    let result;
    if (Array.isArray(quotes)) {
      result = await Quote.insertMany(quotes.map(q => ({ text: q.text, author: q.author })));
    } else {
      const t = (text || '').trim();
      if (!t) return res.status(400).json({ message: 'Text is required' });
      result = await Quote.create({ text: t, author });
    }
    res.status(201).json(result);
  } catch (err) {
    console.error('Failed to insert quotes:', err);
    res.status(500).json({ message: 'Failed to insert quotes' });
  }
});

app.get('/api/todos', async (_req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    console.error('Failed to fetch todos:', err);
    res.status(500).json({ message: 'Failed to fetch todos' });
  }
});

app.post('/api/todos', async (req, res) => {
  const text = (req.body?.text || '').trim();
  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }

  try {
    const todo = await Todo.create({ text });
    res.status(201).json(todo);
  } catch (err) {
    console.error('Failed to create todo:', err);
    res.status(500).json({ message: 'Failed to create todo' });
  }
});

app.patch('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  const updates = {};

  if (typeof req.body?.text === 'string') {
    const trimmed = req.body.text.trim();
    if (!trimmed) {
      return res.status(400).json({ message: 'Text cannot be empty' });
    }
    updates.text = trimmed;
  }

  if (typeof req.body?.completed === 'boolean') {
    updates.completed = req.body.completed;
  }

  if (!Object.keys(updates).length) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  try {
    const todo = await Todo.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json(todo);
  } catch (err) {
    console.error('Failed to update todo:', err);
    res.status(500).json({ message: 'Failed to update todo' });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const todo = await Todo.findByIdAndDelete(id);
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted', id });
  } catch (err) {
    console.error('Failed to delete todo:', err);
    res.status(500).json({ message: 'Failed to delete todo' });
  }
});

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
