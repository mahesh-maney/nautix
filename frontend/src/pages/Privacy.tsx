import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <main
      className="min-h-screen bg-[#f5f5f2] text-[#0b1f33]"
      data-testid="privacy-page"
    >
      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
          <Link
            to="/"
            className="text-sm font-extrabold tracking-[0.18em]"
            data-testid="privacy-logo"
          >
            NAUTIX
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0b1f33]/60 transition-colors hover:text-[#0b1f33]"
            data-testid="privacy-back-link"
          >
            <ArrowLeft className="size-4" />
            Back to Nautix
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-20 lg:px-8 lg:py-28">
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#168f89]">
          Nautix
        </p>

        <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Privacy Policy
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-[#0b1f33]/65">
          This privacy policy explains how Nautix handles information submitted
          through this website.
        </p>

        <div className="mt-16 space-y-12 text-[#0b1f33]/75">
          <section>
            <h2 className="text-xl font-semibold text-[#0b1f33]">
              Information we collect
            </h2>
            <p className="mt-4 leading-7">
              When you contact Nautix through this website, you may provide
              information such as your name, company, email address, requirement
              details and any attachment you choose to submit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0b1f33]">
              How we use information
            </h2>
            <p className="mt-4 leading-7">
              Information submitted through the website is used to understand
              and respond to your enquiry, communicate with you about your
              requirement and support related business discussions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0b1f33]">
              Information sharing
            </h2>
            <p className="mt-4 leading-7">
              Nautix does not sell personal information submitted through this
              website. Information may be shared with service providers where
              reasonably necessary to operate the website or respond to an
              enquiry.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0b1f33]">
              Data retention
            </h2>
            <p className="mt-4 leading-7">
              Information may be retained for as long as reasonably necessary
              to respond to enquiries, maintain business records and meet
              applicable legal or operational requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#0b1f33]">
              Contact
            </h2>
            <p className="mt-4 leading-7">
              For questions regarding this privacy policy or information
              submitted through the Nautix website, please contact Nautix
              through the contact details provided on the website.
            </p>
          </section>
        </div>
      </section>

      <footer className="border-t border-black/10">
        <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-[#0b1f33]/45 lg:px-8">
          © {new Date().getFullYear()} Nautix. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
