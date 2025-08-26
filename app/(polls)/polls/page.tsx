import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getBaseUrl } from '@/lib/server-url';

async function fetchPolls() {
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/polls`, {
    cache: 'no-store',
  });
  if (!res.ok) return [] as any[];
  const data = await res.json();
  return data.polls as Array<{
    id: string;
    question: string;
    options: any[];
    createdAt: string;
  }>;
}

export default async function PollsIndexPage() {
  const polls = await fetchPolls();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Polls</h1>
        <Button asChild>
          <Link href="/polls/new">Create New Poll</Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {polls.map((poll) => (
          <Link key={poll.id} href={`/polls/${poll.id}`}>
            <Card className="hover:bg-neutral-50">
              <CardHeader>
                <CardTitle className="text-base">{poll.question}</CardTitle>
                {poll.description ? (
                  <CardDescription>{poll.description}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="text-sm text-neutral-600">
                <div className="space-y-1">
                  <div>{poll.options.length} options</div>
                  <div className="text-xs text-neutral-500">
                    Created on {new Date(poll.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
