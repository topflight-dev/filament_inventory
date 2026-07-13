'use client';

import { useState } from 'react';
import Script from 'next/script';
import Header from '@/components/layout/Header';

/**
 * Contact ("/contact") — Web3Forms-powered contact form.
 * Ported 1:1 from legacy contact.html:
 *   - Same Web3Forms access_key / from_name / botcheck honeypot fields
 *   - Same field set: name (pattern-validated), email, inquiry_type select,
 *     message textarea, hCaptcha widget
 *   - Web3Forms client script (web3forms.com/client/script.js) is loaded via
 *     next/script so it can progressively enhance the form (AJAX submit +
 *     inline hCaptcha) exactly as it did in the legacy static site.
 *   - `redirect` is dropped (was legacy `index.html`) in favor of client-side
 *     success state, since Web3Forms' script intercepts the submit and we no
 *     longer need a hard page redirect inside the Next app.
 */

const WEB3FORMS_ACCESS_KEY = '7af3f5b4-ae03-4490-a00f-eb6c12ffa70a';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactPage() {
  const [state, setState] = useState<SubmitState>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('submitting');

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        setState('success');
        form.reset();
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }

  return (
    <>
      {/* Loads Web3Forms' client script for inline hCaptcha rendering,
          matching the legacy <script src="https://web3forms.com/client/script.js" async defer> */}
      <Script src="https://web3forms.com/client/script.js" strategy="afterInteractive" async defer />

      <Header
        activePath="/contact"
        subtitle="Feel free to reach out with any questions or comments!"
      />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 text-center leading-relaxed text-zinc-600">
          <h2 className="mb-3 text-2xl font-semibold text-zinc-800">
            Let&apos;s Create Something Together
          </h2>
          <p>
            Whether you&apos;re looking for a custom 3D print, need advice on a
            specific material, or have feedback on the workshop, I&apos;d love to
            hear from you! From rapid prototyping to unique personalized gifts,
            no request is too small. Fill out the form below and I&apos;ll get
            back to you as soon as possible.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
        >
          {/* Honeypot — hidden from real users, catches bots */}
          <input
            type="checkbox"
            name="botcheck"
            className="hidden"
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          <input type="hidden" name="access_key" value={WEB3FORMS_ACCESS_KEY} />
          <input type="hidden" name="from_name" value="Crafted 3D Inquiry" />

          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-semibold text-zinc-700"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              pattern="[a-zA-Z\s]{2,50}"
              title="Please enter 2-50 letters only."
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-[hsl(25,36%,37%)] focus:ring-2 focus:ring-[hsl(25,36%,37%)]/30 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-semibold text-zinc-700"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-[hsl(25,36%,37%)] focus:ring-2 focus:ring-[hsl(25,36%,37%)]/30 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="inquiry-type"
              className="mb-1 block text-sm font-semibold text-zinc-700"
            >
              How can I help you today?
            </label>
            <select
              id="inquiry-type"
              name="inquiry_type"
              required
              defaultValue=""
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-[hsl(25,36%,37%)] focus:ring-2 focus:ring-[hsl(25,36%,37%)]/30 focus:outline-none"
            >
              <option value="" disabled>
                Select an option...
              </option>
              <option value="Print Quote">
                Request a Custom 3D Print Quote 🎨
              </option>
              <option value="Feedback">Website or Service Feedback 💻</option>
              <option value="General">General Question / &quot;Talk Shop&quot; ❓</option>
              <option value="Technical">
                Technical Help / Material Advice 🛠️
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="message"
              className="mb-1 block text-sm font-semibold text-zinc-700"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              required
              maxLength={5000}
              placeholder="How can I help you?"
              className="w-full resize-y rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-[hsl(25,36%,37%)] focus:ring-2 focus:ring-[hsl(25,36%,37%)]/30 focus:outline-none"
            />
          </div>

          <div className="h-captcha" data-captcha="true" />

          <button
            type="submit"
            disabled={state === 'submitting'}
            className="w-full rounded-md bg-[hsl(25,36%,37%)] px-6 py-3 font-semibold text-white transition hover:bg-[hsl(25,36%,30%)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === 'submitting' ? 'Sending…' : 'Send Message'}
          </button>

          {state === 'success' && (
            <p className="text-center font-medium text-green-600">
              Thanks! Your message has been sent — I&apos;ll be in touch soon.
            </p>
          )}
          {state === 'error' && (
            <p className="text-center font-medium text-red-600">
              Something went wrong sending your message. Please try again.
            </p>
          )}
        </form>
      </main>
    </>
  );
}
