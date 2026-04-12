import type { ReactNode } from 'react';
import Header from './Header';
import { useTranslation } from '../lib/i18n';

interface SectionProps {
  title: string;
  children: ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-text-bright">{title}</h2>
      <div className="space-y-3 text-text-dim leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: SectionProps) {
  return (
    <div className="mb-4">
      <h3 className="mb-2 text-lg font-semibold text-text-bright">{title}</h3>
      <div className="text-text-dim leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  const { lang } = useTranslation();
  const isThai = lang === 'th';

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-text-bright">
            {isThai ? 'นโยบายความเป็นส่วนตัว' : 'Privacy Policy'}
          </h1>
          <p className="text-sm text-text-dim">
            {isThai ? 'อัปเดตล่าสุด: 10 เมษายน 2569' : 'Last Updated: April 10, 2026'}
          </p>
        </div>

        <div className="rounded-2xl border border-surface-hover bg-surface-card p-6">
          <Section title={isThai ? '1. บทนำ' : '1. Introduction'}>
            <p>
              {isThai
                ? 'ThaiChess ("เรา" "พวกเรา" "ของเรา") ให้ความสำคัญกับความเป็นส่วนตัวของคุณ นโยบายนี้อธิบายว่าเรารวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณอย่างไร เมื่อคุณใช้บริการหมากรุกไทยออนไลน์ของเรา ("บริการ")'
                : 'ThaiChess ("we" "us" "our") respects your privacy. This policy explains how we collect, use, and protect your personal data when you use our online Thai chess service (the "Service").'}
            </p>
          </Section>

          <Section title={isThai ? '2. ข้อมูลที่เรารวบรวม' : '2. Data We Collect'}>
            <SubSection title={isThai ? '2.1 ข้อมูลบัญชี' : '2.1 Account Information'}>
              <p>
                {isThai
                  ? 'เมื่อคุณสร้างบัญชี เรารวบรวม: อีเมล (สำหรับการยืนยันตัวตนและการติดต่อ) ชื่อผู้ใช้ (สำหรับการแสดงในตารางคะแนนและประวัติเกม)'
                  : 'When you create an account, we collect: Email address (for authentication and communication), Username (for display on leaderboards and game history)'}
              </p>
            </SubSection>

            <SubSection title={isThai ? '2.2 ข้อมูลเกม' : '2.2 Game Data'}>
              <p>
                {isThai
                  ? 'เราบันทึกเกมที่เล่นบนแพลตฟอร์มของเราเพื่อ: คำนวณคะแนน ELO และสถิติ แสดงประวัติเกมสาธารณะ ปรับปรุงคุณภาพการจับคู่'
                  : 'We record games played on our platform to: Calculate ELO ratings and statistics, Display public game history, Improve matchmaking quality'}
              </p>
            </SubSection>

            <SubSection title={isThai ? '2.3 ข้อมูลทางเทคนิค' : '2.3 Technical Data'}>
              <p>
                {isThai
                  ? 'เรารวบรวมข้อมูลที่จำเป็นสำหรับการทำงานของบริการ: ที่อยู่ IP (สำหรับความปลอดภัยของบัญชีและการตรวจจับการละเมิด) User Agent (สำหรับปรับปรุงประสบการณ์ตามอุปกรณ์) ข้อมูลเซสชัน (สำหรับการยืนยันตัวตน)'
                  : 'We collect data necessary for service operation: IP address (for account security and abuse detection), User agent (for optimizing experience per device), Session data (for authentication)'}
              </p>
            </SubSection>
          </Section>

          <Section title={isThai ? '3. คุกกี้และการจัดเก็บข้อมูล' : '3. Cookies & Local Storage'}>
            <p>
              {isThai
                ? 'เราใช้เฉพาะคุกกี้และ localStorage ที่จำเป็นสำหรับการทำงานของบริการ: การยืนยันตัวตนผู้ใช้ (เซสชัน) การตั้งค่าภาษาและธีม ความคืบหน้าปริศนาและบทเรียน (สำหรับผู้เล่นที่ไม่ได้ลงชื่อ) เราไม่ใช้คุกกี้เพื่อการตลาดหรือการวิเคราะห์'
                : 'We only use essential cookies and localStorage necessary for service operation: User authentication (sessions), Language and theme settings, Puzzle and lesson progress (for guests). We do not use cookies for marketing or analytics.'}
            </p>
          </Section>

          <Section title={isThai ? '4. วิธีการใช้ข้อมูลของคุณ' : '4. How We Use Your Data'}>
            <p>
              {isThai
                ? 'เราใช้ข้อมูลส่วนบุคคลของคุณเพื่อ: ให้บริการหมากรุกไทยออนไลน์ จัดการบัญชีผู้ใช้และรักษาความปลอดภัย คำนวณและแสดงระบบจัดอันดับ ตอบคำถามและสนับสนุนผู้ใช้ ปรับปรุงบริการของเรา'
                : 'We use your personal data to: Provide the online Thai chess service, Manage user accounts and maintain security, Calculate and display the rating system, Respond to inquiries and support users, Improve our services'}
            </p>
          </Section>

          <Section title={isThai ? '5. การแบ่งปันข้อมูล' : '5. Data Sharing'}>
            <p>
              {isThai
                ? 'เราไม่ขายหรือให้เช่าข้อมูลส่วนบุคคลของคุณ เราแบ่งปันข้อมูลเมื่อ: จำเป็นสำหรับผู้ให้บริการโฮสติ้ง (เซิร์ฟเวอร์เกม) ตามที่กฎหมายกำหนด ปกป้องสิทธิและความปลอดภัยของเรา'
                : 'We do not sell or rent your personal data. We share data when: Required for hosting providers (game servers), Required by law, To protect our rights and safety'}
            </p>
          </Section>

          <Section title={isThai ? '6. ระยะเวลาการเก็บข้อมูล' : '6. Data Retention'}>
            <p>
              {isThai
                ? 'เราเก็บข้อมูลของคุณตามระยะเวลาดังนี้: บัญชีผู้ใช้: จนกว่าคุณจะลบบัญชี ประวัติเกม: อย่างน้อย 1 ปี (เพื่อความสมบูรณ์ของสถิติ) ข้อมูลเซสชัน: 30 วัน'
                : 'We retain your data for: User accounts: Until you delete your account, Game history: At least 1 year (for statistical integrity), Session data: 30 days'}
            </p>
          </Section>

          <Section title={isThai ? '7. สิทธิของคุณตามกฎหมาย PDPA' : '7. Your PDPA Rights'}>
            <p>
              {isThai
                ? 'ตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 คุณมีสิทธิ: เข้าถึงข้อมูลส่วนบุคคลของคุณ แก้ไขข้อมูลที่ไม่ถูกต้อง ลบบัญชีและข้อมูลของคุณ (สิทธิในการถูกลืม) ถอนความยินยอมในการประมวลผล (เมื่อใช้)'
                : "Under Thailand's PDPA B.E. 2562, you have the right to: Access your personal data, Correct inaccurate information, Delete your account and data (right to be forgotten), Withdraw consent for processing (where applicable)"}
            </p>
          </Section>

          <Section title={isThai ? '8. ความปลอดภัยของข้อมูล' : '8. Data Security'}>
            <p>
              {isThai
                ? 'เราใช้มาตรการที่เหมาะสมเพื่อปกป้องข้อมูลของคุณ: การเข้ารหัสการเชื่อมต่อ (HTTPS/TLS) การยืนยันตัวตนแบบสองปัจจัย (2FA) สำหรับบัญชีผู้ดูแลระบบ การตรวจสอบและควบคุมการเข้าถึงเป็นประจำ'
                : 'We implement appropriate measures to protect your data: Encrypted connections (HTTPS/TLS), Two-factor authentication (2FA) for admin accounts, Regular access monitoring and controls'}
            </p>
          </Section>

          <Section title={isThai ? '9. ติดต่อเรา' : '9. Contact Us'}>
            <p>
              {isThai
                ? 'หากมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวหรือสิทธิของคุณ กรุณาติดต่อ: อีเมล: contact@thaichess.org'
                : 'If you have questions about this privacy policy or your rights, please contact: Email: contact@thaichess.org'}
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
}
