import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <h2 className="text-xl font-black text-white mb-4 border-l-4 border-primary-500 pl-4">{title}</h2>
    <div className="text-slate-400 leading-relaxed space-y-3 text-sm">{children}</div>
  </div>
);

export const TermsPage = () => (
  <div className="min-h-screen bg-[#0f172a] text-white">
    <div className="max-w-3xl mx-auto px-4 pt-28 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-10 transition-colors">
        <ChevronLeft className="w-4 h-4" />Back to Home
      </Link>
      <h1 className="text-4xl font-black mb-2">Terms of Service</h1>
      <p className="text-slate-500 text-sm mb-14">Last updated: April 25, 2024</p>

      <div className="glass-dark rounded-[32px] border border-white/5 p-8 md:p-12">
        <Section title="1. Acceptance of Terms">
          <p>By accessing or using EliteEdu SYSTEM ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please discontinue use immediately.</p>
        </Section>
        <Section title="2. Use of the Service">
          <p>EliteEdu SYSTEM is licensed to educational institutions for academic management purposes. You may not use the Service for any unlawful purpose or in violation of any regulations.</p>
          <p>Each school account (tenant) is solely responsible for the data entered and the accuracy of that data.</p>
        </Section>
        <Section title="3. Account Registration">
          <p>To use the Service, a school administrator must register and provide accurate information. You are responsible for maintaining the confidentiality of your account credentials.</p>
        </Section>
        <Section title="4. Data Ownership">
          <p>All data entered into the system by your institution remains your property. EliteEdu does not claim ownership of school or student data. You grant us a limited license to process that data solely to deliver the Service.</p>
        </Section>
        <Section title="5. Service Availability">
          <p>We aim for 99.9% uptime but do not guarantee uninterrupted access. Scheduled maintenance windows will be communicated in advance where possible.</p>
        </Section>
        <Section title="6. Termination">
          <p>Either party may terminate the agreement with 30 days written notice. Upon termination, you may request a data export before account deletion.</p>
        </Section>
        <Section title="7. Limitation of Liability">
          <p>EliteEdu shall not be liable for indirect, incidental, or consequential damages arising from your use of or inability to use the Service.</p>
        </Section>
        <Section title="8. Changes to Terms">
          <p>We may update these terms periodically. Continued use of the Service after changes constitutes acceptance of the new terms.</p>
        </Section>
        <Section title="9. Contact">
          <p>For questions about these terms, contact us at <a href="mailto:legal@school.edu" className="text-primary-400 hover:underline">legal@school.edu</a>.</p>
        </Section>
      </div>

      <div className="flex gap-4 mt-10 text-sm">
        <Link to="/privacy" className="text-primary-400 hover:underline">Privacy Policy</Link>
        <Link to="/cookies" className="text-primary-400 hover:underline">Cookie Policy</Link>
      </div>
    </div>
  </div>
);
