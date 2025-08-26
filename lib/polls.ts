export type PollOption = {
  id: string;
  label: string;
  votes: number;
};

export type Poll = {
  id: string;
  question: string;
  description?: string;
  options: PollOption[];
  createdAt: string;
};

const polls: Poll[] = [];

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function listPolls(): Poll[] {
  return polls.slice().reverse();
}

export function getPollById(id: string): Poll | undefined {
  return polls.find((p) => p.id === id);
}

export function createPoll(input: {
  question: string;
  description?: string;
  options: string[];
}): Poll {
  const poll: Poll = {
    id: generateId(),
    question: input.question,
    description: input.description || '',
    options: input.options
      .filter((o) => o && o.trim().length > 0)
      .map((label) => ({ id: generateId(), label: label.trim(), votes: 0 })),
    createdAt: new Date().toISOString(),
  };

  polls.push(poll);
  return poll;
}
