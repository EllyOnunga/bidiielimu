import { Link } from "react-router-dom";
import { ElimuHubLogo } from "../ui/Logo";
import { FaTwitter, FaLinkedin, FaFacebook, FaInstagram } from "react-icons/fa";

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
              A modern, simple, and reliable platform to manage your school's
              student records, grades, and payments in one place.
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
              title: "Company",
              links: [
                ["About Us", "/about"],
                ["Careers", "/careers"],
                ["Contact", "/#contact"],
                ["Blog", "/blog"],
              ],
            },
            {
              title: "Legal",
              links: [
                ["Terms of Service", "/terms"],
                ["Privacy Policy", "/privacy"],
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
          <div className="text-[9px] font-black text-muted uppercase tracking-[0.4em] text-center sm:text-left flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span>&copy; {new Date().getFullYear()} ElimuHub. All rights reserved.</span>
            <span className="hidden sm:inline text-white/10">•</span>
            <span className="font-mono text-white/30 font-bold hover:text-primary-400 transition-colors">v1.0.0</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted hover:text-primary transition-all cursor-pointer active:scale-95"
                title="Twitter"
              >
                <FaTwitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted hover:text-primary transition-all cursor-pointer active:scale-95"
                title="LinkedIn"
              >
                <FaLinkedin className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted hover:text-primary transition-all cursor-pointer active:scale-95"
                title="Facebook"
              >
                <FaFacebook className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted hover:text-primary transition-all cursor-pointer active:scale-95"
                title="Instagram"
              >
                <FaInstagram className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
