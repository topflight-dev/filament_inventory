'use client';

/**
 * components/printcue/RequestAccessForm.tsx — Landing Page Request-Access Form
 * ─────────────────────────────────────────────────────────────────────────────
 * The one interactive piece of the otherwise-static printcue.ink landing page
 * (app/(dashboard)/welcome/page.tsx). Split into its own client component so
 * the page itself can stay a server component with a real `export const
 * metadata`, rather than needing a sibling layout.tsx just to carry a title —
 * the workaround AuthGate.tsx / signup/page.tsx need, since THEY are fully
 * client components end to end.
 *
 * Posts to /api/request-access, which notifies Luis (via whatever
 * email/Discord channel he's already configured for his own shop) and
 * creates nothing in the database — see that route's header comment. This
 * form never touches Supabase directly, and never claims an invite code
 * itself — it's a lead-gen form, not sign-up (see (dashboard)/signup/page.tsx
 * for the actual invite-code redemption flow).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { FormEvent, useState } from 'react';
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

export default function RequestAccessForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatYouPrint, setWhatYouPrint] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedDetails = whatYouPrint.trim();

    if (!trimmedName || !trimmedEmail || !trimmedDetails) {
      setError('Please fill in every field.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, whatYouPrint: trimmedDetails }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || 'Something went wrong — please try again.');
      }

      setSubmitted(true);
    } catch (err) {
      console.warn('[Printcue] Request-access submission failed:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-10 text-center">
        <CheckCircle2 className="h-9 w-9 text-emerald-600" strokeWidth={1.75} />
        <p className="text-sm font-semibold text-emerald-800">Request sent</p>
        <p className="max-w-sm text-sm text-emerald-700">
          Thanks — I read every one of these myself. If it sounds like a good fit, I&apos;ll email you an
          invite code directly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-md flex-col gap-4 text-left">
      <div>
        <label htmlFor="ra-name" className="mb-1.5 block text-xs font-semibold text-zinc-500">
          Your Name
        </label>
        <Input
          id="ra-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Rivera"
          autoComplete="name"
        />
      </div>

      <div>
        <label htmlFor="ra-email" className="mb-1.5 block text-xs font-semibold text-zinc-500">
          Email
        </label>
        <Input
          id="ra-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="ra-details" className="mb-1.5 block text-xs font-semibold text-zinc-500">
          What do you print?
        </label>
        <Textarea
          id="ra-details"
          value={whatYouPrint}
          onChange={(e) => setWhatYouPrint(e.target.value)}
          placeholder="A couple printers in the garage, mostly custom nameplates and cosplay props..."
          rows={3}
        />
      </div>

      <Button type="submit" fullWidth loading={submitting} icon={submitting ? undefined : Send}>
        {submitting ? 'Sending...' : 'Request Access'}
      </Button>

      {error && (
        <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </form>
  );
}
