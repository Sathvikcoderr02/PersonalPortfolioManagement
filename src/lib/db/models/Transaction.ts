import mongoose from 'mongoose';
import { CATEGORIES } from '@/types';

export type Category = typeof CATEGORIES[number];

// Delete existing model to update schema
if (mongoose.models.Transaction) {
  delete mongoose.models.Transaction;
}

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: CATEGORIES,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export const Transaction = mongoose.model('Transaction', transactionSchema);
