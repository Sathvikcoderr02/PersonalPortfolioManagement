export const CATEGORIES = [
  'Housing',
  'Transportation',
  'Groceries',
  'Dining Out',
  'Utilities',
  'Internet & Phone',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Education',
  'Travel',
  'Insurance',
  'Investments',
  'Gifts & Donations',
  'Personal Care',
  'Fitness',
  'Other'
] as const;

export const CATEGORY_COLORS: Record<Category, string> = {
  'Housing': '#FF6B6B',
  'Transportation': '#4ECDC4',
  'Groceries': '#45B7D1',
  'Dining Out': '#96CEB4',
  'Utilities': '#FFEEAD',
  'Internet & Phone': '#D4A5A5',
  'Entertainment': '#9B5DE5',
  'Healthcare': '#F15BB5',
  'Shopping': '#00BBF9',
  'Education': '#FFA07A',
  'Travel': '#98FB98',
  'Insurance': '#DDA0DD',
  'Investments': '#87CEEB',
  'Gifts & Donations': '#FFB6C1',
  'Personal Care': '#E6E6FA',
  'Fitness': '#B8860B',
  'Other': '#757575'
} as const;

export type Category = typeof CATEGORIES[number];

export interface Transaction {
  _id: string;
  amount: number;
  description: string;
  category: Category;
  date: string;
}

export interface Budget {
  _id: string;
  category: Category;
  amount: number;
  month: string;
}
