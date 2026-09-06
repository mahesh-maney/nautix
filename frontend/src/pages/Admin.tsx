import { Link } from "react-router-dom";

export default function Admin() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#0c202e] px-6 text-white"
      data-testid="admin-page"
    >
      <div className="w-full max-w-lg border border-white/10 bg-white/[0.03] p-8 sm:p-10">
        <p className="font-mono text-[10px] tracking-[0.25em] text-[#70e2db]">
          NAUTIX / ADMIN
        </p>

        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em]">
          Administration
        </h1>

        <p className="mt-5 text-sm leading-7 text-white/60">
          The Nautix administration interface is being restored.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex text-xs font-bold uppercase tracking-[0.14em] text-[#70e2db] hover:text-white"
        >
          Return to Nautix
        </Link>
      </div>
    </main>
  );
}
