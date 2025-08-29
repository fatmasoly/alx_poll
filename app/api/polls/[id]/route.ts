import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();
    
    // Get poll with options and vote counts
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select(`
        id,
        question,
        description,
        created_at,
        poll_options(
          id,
          label,
          position
        )
      `)
      .eq('id', id)
      .single();

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Get vote counts for each option (using votes table until poll_votes migration is run)
    const { data: voteCounts, error: voteError } = await supabase
      .from('votes')
      .select('option_id')
      .eq('poll_id', id);

    if (voteError) {
      console.error('GET /api/polls/[id] vote count error:', voteError);
      return NextResponse.json({ error: voteError.message }, { status: 500 });
    }

    // Count votes per option
    const voteCountMap = new Map<string, number>();
    (voteCounts || []).forEach((vote: any) => {
      voteCountMap.set(vote.option_id, (voteCountMap.get(vote.option_id) || 0) + 1);
    });

    // Shape the response
    const shaped = {
      id: poll.id,
      question: poll.question,
      description: poll.description || '',
      options: (poll.poll_options || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((opt: any) => ({
          id: opt.id,
          label: opt.label,
          votes: voteCountMap.get(opt.id) || 0,
        })),
      createdAt: poll.created_at,
      totalVotes: (voteCounts || []).length,
    };

    return NextResponse.json({ poll: shaped });
  } catch (error) {
    console.error('GET /api/polls/[id] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
