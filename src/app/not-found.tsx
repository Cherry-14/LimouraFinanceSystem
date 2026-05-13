import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="flex flex-col items-start gap-6 max-w-md">
        <span className="text-2xs uppercase tracking-[0.18em] text-ink-500">404</span>
        <h1 className="display-serif text-5xl leading-none text-ink">Page not found</h1>
        <p className="text-sm text-ink-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-ink text-white px-4 h-9 text-sm font-medium hover:bg-ink-900 transition-colors"
        >
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
