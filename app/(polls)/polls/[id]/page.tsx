'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getClientBaseUrl } from '@/lib/client-url';

interface PollOption {
  id: string;
  label: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  description: string;
  options: PollOption[];
  createdAt: string;
  totalVotes: number;
}

interface PollPageProps {
  params: Promise<{ id: string }>;
}

function generateUserId(): string {
  // Simple user ID generation - in production, you might want to use actual user authentication
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default function PollDetailPage({ params }: PollPageProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollId, setPollId] = useState<string | null>(null);

  useEffect(() => {
    // Extract pollId from params promise
    params.then(({ id }) => {
      setPollId(id);
    });
  }, [params]);

  useEffect(() => {
    if (pollId) {
      fetchPoll();
    }
  }, [pollId]);

  async function fetchPoll() {
    if (!pollId) return;
    
    try {
      const baseUrl = getClientBaseUrl();
      const res = await fetch(`${baseUrl}/api/polls/${pollId}`, { 
        cache: 'no-store' 
      });
      
      if (!res.ok) {
        if (res.status === 404) {
          notFound();
        }
        throw new Error('Failed to fetch poll');
      }
      
      const data = await res.json();
      setPoll(data.poll);
    } catch (err) {
      setError('Failed to load poll');
      console.error('Error fetching poll:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(optionId: string) {
    if (voting || hasVoted || !pollId) return;

    setVoting(true);
    setError(null);

    try {
      const baseUrl = getClientBaseUrl();
      const userId = generateUserId();
      
      const res = await fetch(`${baseUrl}/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, userId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit vote');
      }

      // Vote successful
      setHasVoted(true);
      
      // Refresh poll data to get updated vote counts
      await fetchPoll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
      console.error('Error voting:', err);
    } finally {
      setVoting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Failed to load poll</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-green-600">
              Thanks for voting!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-lg font-medium">{poll.question}</p>
              {poll.description && (
                <p className="text-gray-600">{poll.description}</p>
              )}
              <div className="space-y-3">
                {poll.options.map((opt) => (
                  <div key={opt.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>{opt.label}</span>
                    <span className="font-medium">
                      {opt.votes} vote{opt.votes !== 1 ? 's' : ''}
                      {poll.totalVotes > 0 && (
                        <span className="text-gray-500 ml-2">
                          ({Math.round((opt.votes / poll.totalVotes) * 100)}%)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Total votes: {poll.totalVotes}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{poll.question}</CardTitle>
          {poll.description && (
            <p className="text-gray-600">{poll.description}</p>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <div className="grid gap-3">
            {poll.options.map((opt) => (
              <Button
                key={opt.id}
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => handleVote(opt.id)}
                disabled={voting}
              >
                <span className="text-left">{opt.label}</span>
              </Button>
            ))}
          </div>
          {voting && (
            <p className="text-sm text-gray-500 mt-3 text-center">
              Submitting your vote...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
