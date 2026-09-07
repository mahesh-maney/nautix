import { Link } from "react-router-dom";

export default function Admin() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#0c202e] px-6 text-white"
      data-testid="admin-page"
    >
      <div className="w-full max-w-sm text-center">
        <Link to="/" className="inline-flex items-center gap-3" data-testid="admin-logo">
          <img src="/images/nautix-logo.png" alt="Nautix" className="h-9 w-auto object-contain" />
          <span className="font-heading text-xl font-extrabold tracking-[-0.04em]">NAUTIX</span>
        </Link>
        <p className="mt-8 text-sm leading-7 text-white/50">
          Enquiries submitted through the website are delivered directly to your email.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex font-mono text-[10px] tracking-[0.18em] text-[#70e2db] hover:text-white transition-colors"
          data-testid="admin-back-link"
        >
          RETURN TO NAUTIX
        </Link>
      </div>
    </main>
  );
}
