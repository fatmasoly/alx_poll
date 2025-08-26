import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getBaseUrl } from '@/lib/server-url';

interface PollPageProps {
  params: { id: string };
}

async function fetchPoll(id: string) {
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/polls`, { cache: 'no-store' });
  if (!res.ok) return undefined;
  const data = await res.json();
  return (data.polls as Array<any>).find((p) => p.id === id);
}

export default async function PollDetailPage({ params }: PollPageProps) {
  const poll = await fetchPoll(params.id);
  if (!poll) return notFound();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{poll.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {poll.options.map((opt: any) => (
              <Button key={opt.id} variant="outline" className="justify-start">
                {opt.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
