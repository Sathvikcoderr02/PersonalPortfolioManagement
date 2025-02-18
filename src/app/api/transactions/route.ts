import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Transaction } from '@/lib/db/models/Transaction';

export async function GET(request: Request) {
  console.log('GET /api/transactions - Starting request');
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    await dbConnect();
    console.log('Database connected');
    
    const transactions = await Transaction.find({})
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    console.log('Found transactions:', transactions);
    
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error in GET /api/transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('POST /api/transactions - Starting request');
  try {
    const body = await request.json();
    console.log('Received transaction data:', body);

    await dbConnect();
    console.log('Database connected');

    const transaction = await Transaction.create({
      amount: body.amount,
      description: body.description,
      category: body.category,
      date: body.date,
    });
    
    console.log('Created transaction:', transaction);
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/transactions:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  console.log('DELETE /api/transactions - Starting request');
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    console.log('Deleting transaction with ID:', id);

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    await dbConnect();
    console.log('Database connected');

    await Transaction.findByIdAndDelete(id);
    console.log('Transaction deleted successfully');

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/transactions:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
