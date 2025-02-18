import mongoose from 'mongoose';
import { CATEGORIES } from '@/types';

// Delete existing model to update schema
if (mongoose.models.Budget) {
  delete mongoose.models.Budget;
}

const budgetSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: CATEGORIES,
  },
  amount: {
    type: Number,
    required: true,
  },
  month: {
    type: String,
    required: true,
  }
}, {
  timestamps: true,
});

// Ensure unique category per month
budgetSchema.index({ category: 1, month: 1 }, { unique: true });

export const Budget = mongoose.model('Budget', budgetSchema);
