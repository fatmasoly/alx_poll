import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();
    const body = await request.json();
    const { optionId, userId } = body ?? {};

    if (!optionId) {
      return NextResponse.json(
        { error: 'Option ID is required' },
        { status: 400 }
      );
    }

    // Verify the option belongs to the poll
    const { data: option, error: optionError } = await supabase
      .from('poll_options')
      .select('poll_id')
      .eq('id', optionId)
      .single();

    if (optionError || !option || option.poll_id !== id) {
      return NextResponse.json(
        { error: 'Invalid option for this poll' },
        { status: 400 }
      );
    }

    // Insert the vote (using votes table until poll_votes migration is run)
    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: id,
        option_id: optionId,
        voter_fingerprint: userId || null,
      })
      .select('id')
      .single();

    if (voteError) {
      // Check if it's a duplicate vote error
      if (voteError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already voted on this poll' },
          { status: 409 }
        );
      }
      console.error('POST /api/polls/[id]/vote error:', voteError);
      return NextResponse.json({ error: voteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, voteId: vote.id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/polls/[id]/vote unexpected error:', error);
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
