import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET() {
  const supabase = getSupabaseServer();
  const { data: polls, error } = await supabase
    .from('polls')
    .select('id, question, description, created_at, poll_options(id, label)')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('GET /api/polls error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const shaped = (polls || []).map((p: any) => ({
    id: p.id,
    question: p.question,
    description: p.description || '',
    options: (p.poll_options || []).map((o: any) => ({ id: o.id, label: o.label, votes: 0 })),
    createdAt: p.created_at,
  }));
  return NextResponse.json({ polls: shaped });
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServer();
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
    // Create poll
    const { data: pollInsert, error: pollError } = await supabase
      .from('polls')
      .insert({ question, description })
      .select('id, question, description, created_at')
      .single();
    if (pollError) {
      console.error('POST /api/polls insert poll error:', pollError);
      return NextResponse.json({ error: pollError.message }, { status: 500 });
    }

    // Create options
    const optionsRows = (options as string[])
      .map((label: string, index: number) => ({ poll_id: pollInsert.id, label: label.trim(), position: index }))
      .filter((o) => o.label.length > 0);
    const { data: optInsert, error: optError } = await supabase
      .from('poll_options')
      .insert(optionsRows)
      .select('id, label');
    if (optError) {
      console.error('POST /api/polls insert options error:', optError);
      return NextResponse.json({ error: optError.message }, { status: 500 });
    }

    const shaped = {
      id: pollInsert.id,
      question: pollInsert.question,
      description: pollInsert.description || '',
      options: (optInsert || []).map((o: any) => ({ id: o.id, label: o.label, votes: 0 })),
      createdAt: pollInsert.created_at,
    };
    return NextResponse.json({ poll: shaped }, { status: 201 });
  } catch (error) {
    console.error('POST /api/polls unexpected error:', error);
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
