import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Budget } from '@/lib/db/models/Budget';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    await dbConnect();
    
    const query = month ? {
      month: {
        $gte: new Date(month),
        $lt: new Date(new Date(month).setMonth(new Date(month).getMonth() + 1))
      }
    } : {};
    
    const budgets = await Budget.find(query);
    return NextResponse.json(budgets);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await dbConnect();
    
    const budget = await Budget.findOneAndUpdate(
      { category: body.category, month: new Date(body.month) },
      body,
      { upsert: true, new: true }
    );
    
    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create/update budget' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Budget ID is required' }, { status: 400 });
    }

    await dbConnect();
    await Budget.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 });
  }
}
