import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <h2 className="text-xl font-black text-white mb-4 border-l-4 border-primary-500 pl-4">{title}</h2>
    <div className="text-slate-400 leading-relaxed space-y-3 text-sm">{children}</div>
  </div>
);

export const PrivacyPage = () => (
  <div className="min-h-screen bg-[#0f172a] text-white">
    <div className="max-w-3xl mx-auto px-4 pt-28 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-10 transition-colors">
        <ChevronLeft className="w-4 h-4" />Back to Home
      </Link>
      <h1 className="text-4xl font-black mb-2">Privacy Policy</h1>
      <p className="text-slate-500 text-sm mb-14">Last updated: April 25, 2024</p>

      <div className="glass-dark rounded-[32px] border border-white/5 p-8 md:p-12">
        <Section title="1. What We Collect">
          <p>We collect information you provide directly: school name, administrator name, email address, and any student or staff data entered into the system.</p>
          <p>We also collect usage data such as login times, pages visited, and feature interactions to improve the product.</p>
        </Section>
        <Section title="2. How We Use Your Data">
          <p>Your data is used exclusively to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Provide and improve the BidiiElimu SYSTEM service</li>
            <li>Send service-related notifications (billing, downtime alerts)</li>
            <li>Generate aggregated, anonymized product analytics</li>
          </ul>
          <p>We will never sell or share your data with third parties for marketing purposes.</p>
        </Section>
        <Section title="3. Data Isolation & Multi-Tenancy">
          <p>Each school's data is strictly isolated. School A cannot access School B's data under any circumstances. Our multi-tenant architecture enforces this at the database level.</p>
        </Section>
        <Section title="4. Student Data">
          <p>Student data is the most sensitive data in the system. We comply with applicable data protection laws. Student records are only accessible to authorized staff within your institution.</p>
        </Section>
        <Section title="5. Data Retention">
          <p>Data is retained for the duration of your subscription and for 90 days after termination, during which you may request an export. After 90 days, data is permanently deleted.</p>
        </Section>
        <Section title="6. Security">
          <p>We use industry-standard encryption (HTTPS/TLS) for all data in transit and AES-256 for data at rest. Access is protected by JWT-based authentication.</p>
        </Section>
        <Section title="7. Your Rights">
          <p>You have the right to access, correct, or delete your data at any time. Contact us at <a href="mailto:privacy@school.edu" className="text-primary-400 hover:underline">privacy@school.edu</a> for any requests.</p>
        </Section>
        <Section title="8. Contact">
          <p>For privacy-related enquiries, email <a href="mailto:privacy@school.edu" className="text-primary-400 hover:underline">privacy@school.edu</a>.</p>
        </Section>
      </div>

      <div className="flex gap-4 mt-10 text-sm">
        <Link to="/terms" className="text-primary-400 hover:underline">Terms of Service</Link>
        <Link to="/cookies" className="text-primary-400 hover:underline">Cookie Policy</Link>
      </div>
    </div>
  </div>
);
