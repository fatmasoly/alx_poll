import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="font-semibold">ALX Polly</div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/polls">My Polls</Link>
          <Link href="/polls/new">Create Poll</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/polls/new">Create Poll</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
