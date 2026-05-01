import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <h2 className="text-xl font-black text-white mb-4 border-l-4 border-primary-500 pl-4">{title}</h2>
    <div className="text-slate-400 leading-relaxed space-y-3 text-sm">{children}</div>
  </div>
);

export const CookiePolicyPage = () => (
  <div className="min-h-screen bg-[#0f172a] text-white">
    <div className="max-w-3xl mx-auto px-4 pt-28 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-10 transition-colors">
        <ChevronLeft className="w-4 h-4" />Back to Home
      </Link>
      <h1 className="text-4xl font-black mb-2">Cookie Policy</h1>
      <p className="text-slate-500 text-sm mb-14">Last updated: April 25, 2024</p>

      <div className="glass-dark rounded-[32px] border border-white/5 p-8 md:p-12">
        <Section title="1. What Are Cookies?">
          <p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your experience.</p>
        </Section>
        <Section title="2. How We Use Cookies">
          <p>EliteEdu SYSTEM uses the following types of cookies:</p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong className="text-white">Essential Cookies:</strong> Required for authentication and session management (e.g., JWT tokens stored in memory).</li>
            <li><strong className="text-white">Preference Cookies:</strong> Remember your theme (dark/light) and sidebar state.</li>
            <li><strong className="text-white">Analytics Cookies:</strong> Help us understand how features are used (anonymized, no personal data).</li>
          </ul>
        </Section>
        <Section title="3. We Do NOT Use">
          <ul className="list-disc list-inside space-y-2">
            <li>Third-party advertising cookies</li>
            <li>Tracking cookies shared with advertisers</li>
            <li>Cookies that contain student PII (personally identifiable information)</li>
          </ul>
        </Section>
        <Section title="4. Managing Cookies">
          <p>You can control cookies through your browser settings. Disabling essential cookies may impair your ability to log in and use the platform.</p>
        </Section>
        <Section title="5. Changes to This Policy">
          <p>We may update this Cookie Policy periodically. Changes will be reflected with an updated date above.</p>
        </Section>
        <Section title="6. Contact">
          <p>For questions about cookies, contact <a href="mailto:privacy@school.edu" className="text-primary-400 hover:underline">privacy@school.edu</a>.</p>
        </Section>
      </div>

      <div className="flex gap-4 mt-10 text-sm">
        <Link to="/terms" className="text-primary-400 hover:underline">Terms of Service</Link>
        <Link to="/privacy" className="text-primary-400 hover:underline">Privacy Policy</Link>
      </div>
    </div>
  </div>
);
