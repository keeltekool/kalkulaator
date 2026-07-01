import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold tracking-tighter mb-2" style={{ color: "var(--text-muted)" }}>404</div>
        <h1 className="text-2xl font-bold mb-2">Lehte ei leitud</h1>
        <p className="mb-8" style={{ color: "var(--text-muted)" }}>Seda lehte ei ole olemas või on see teisaldatud.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold no-underline transition-colors"
          style={{ background: "var(--text)", color: "var(--bg)" }}
        >
          ← Tagasi avalehele
        </Link>
      </div>
    </div>
  )
}
