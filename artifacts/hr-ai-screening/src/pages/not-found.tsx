import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background px-5">
      <Card className="w-full max-w-md border-border bg-card panel-shadow">
        <CardContent className="p-7">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-foreground"><AlertCircle size={20} /></span>
            <div><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground">Navigation signal</p><h1 className="mt-1 text-xl font-extrabold tracking-[-.04em] text-foreground">This view is not mapped</h1></div>
          </div>
          <p className="text-[13px] leading-6 text-muted-foreground">The workspace could not find that route. Your screening data has not been changed.</p>
          <Link href="/" className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3.5 text-[12px] font-bold text-primary-foreground transition hover:brightness-95" data-testid="link-not-found-home"><ArrowLeft size={15} />Return to overview</Link>
        </CardContent>
      </Card>
    </div>
  );
}
