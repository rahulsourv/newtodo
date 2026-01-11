const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Missing MONGO_URI in backend/.env');
  process.exit(1);
}

const quoteSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  author: { type: String, trim: true },
}, { timestamps: true });

const Quote = mongoose.model('Quote', quoteSchema);

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const filePath = path.join(__dirname, '..', 'quotes.example.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    const quotes = JSON.parse(raw);

    if (!Array.isArray(quotes) || !quotes.length) {
      throw new Error('No quotes found in JSON');
    }

    const result = await Quote.insertMany(quotes.map(q => ({ text: q.text, author: q.author })));
    console.log(`Inserted ${result.length} quotes`);
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
    process.exit(0);
  }
}

run();
