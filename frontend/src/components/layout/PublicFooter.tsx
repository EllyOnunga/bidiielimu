import { Link } from "react-router-dom";
import { ElimuHubLogo } from "../ui/Logo";

export const PublicFooter = () => {
  return (
    <footer className="pt-20 pb-12 px-4 border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-16 mb-20 text-center sm:text-left">
          <div className="lg:col-span-1 space-y-6 flex flex-col items-center sm:items-start">
            <Link to="/" className="flex items-center gap-3 group">
              <ElimuHubLogo
                className="w-9 h-9 sm:w-11 sm:h-11"
                showText={true}
              />
            </Link>
            <p className="text-muted text-xs font-black uppercase tracking-widest leading-loose max-w-xs">
              The vanguard of institutional intelligence. Redefining school
              management through advanced SaaS protocols.
            </p>
          </div>

          {[
            {
              title: "Platform",
              links: [
                ["Solutions", "/solutions"],
                ["Pricing", "/pricing"],
                ["Features", "/#features"],
                ["Guide", "/guide"],
              ],
            },
            {
              title: "Intelligence",
              links: [
                ["About Us", "/about"],
                ["Careers", "/careers"],
                ["Contact", "/#contact"],
                ["News", "/blog"],
              ],
            },
            {
              title: "Legal",
              links: [
                ["Terms of Service", "/terms"],
                ["Privacy Protocol", "/privacy"],
                ["Cookie Policy", "/cookies"],
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-black text-[10px] uppercase tracking-[0.4em] text-primary mb-8">
                {col.title}
              </h4>
              <ul className="space-y-4">
                {col.links.map((link) => (
                  <li key={link[0]}>
                    <Link
                      to={link[1]}
                      className="text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-primary-500 transition-colors"
                    >
                      {link[0]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-[9px] font-black text-muted uppercase tracking-[0.4em] text-center sm:text-left">
            &copy; {new Date().getFullYear()} ELIMUHUB SYSTEM PROTOCOL. SECURED
            TRANSMISSION.
          </div>
          <div className="flex items-center gap-8">
            <div className="flex gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted hover:text-primary transition-all cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted hover:text-primary transition-all cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted hover:text-primary transition-all cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted hover:text-primary transition-all cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
