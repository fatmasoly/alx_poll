import { NextResponse } from 'next/server';
import { createPoll, listPolls } from '@/lib/polls';

export async function GET() {
  return NextResponse.json({ polls: listPolls() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, description = '', options } = body ?? {};
    if (!question || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        {
          error: 'Invalid payload. Require question and at least two options.',
        },
        { status: 400 }
      );
    }
    const poll = createPoll({ question, description, options });
    return NextResponse.json({ poll }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
