import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { redirect } from 'next/navigation';
import { getBaseUrl } from '@/lib/server-url';

async function createPollAction(formData: FormData) {
  'use server';
  const question = String(formData.get('question') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const optionsRaw = String(formData.get('options') || '');
  const options = optionsRaw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/polls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, description, options }),
  });

  if (!res.ok) {
    throw new Error('Failed to create poll');
  }

  redirect('/polls');
}

export default function NewPollPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create a new poll</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={createPollAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                name="question"
                placeholder="What do you want to ask?"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                name="description"
                placeholder="Provide more context"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="options">Options (one per line)</Label>
              <Textarea
                id="options"
                name="options"
                placeholder={'Option A\nOption B\nOption C'}
                required
              />
            </div>
            <Button type="submit">Create</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
