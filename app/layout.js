import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "Invoice Generator",
  description:
    "Generate PDF invoices from seller templates, backed by Prisma + MySQL.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="site-header">
            <div className="site-header__inner">
              <Link href="/" className="site-header__brand">
                Invoice Generator
              </Link>
              <nav className="site-header__nav">
                <Link href="/">Templates</Link>
                <Link href="/calibrate">Calibrate</Link>
                <a
                  href="https://pdf-lib.js.org/"
                  target="_blank"
                  rel="noreferrer"
                >
                  pdf-lib
                </a>
              </nav>
            </div>
          </header>
          <main className="app-content">{children}</main>
          <footer className="site-footer">
            <p>Built with Next.js App Router, Prisma, and pdf-lib.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
