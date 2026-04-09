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

export default function TermsPage() {
  const { lang } = useTranslation();
  const isThai = lang === 'th';

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-text-bright">
            {isThai ? 'ข้อกำหนดในการให้บริการ' : 'Terms of Service'}
          </h1>
          <p className="text-sm text-text-dim">
            {isThai ? 'อัปเดตล่าสุด: 10 เมษายน 2569' : 'Last Updated: April 10, 2026'}
          </p>
        </div>

        <div className="rounded-2xl border border-surface-hover bg-surface-card p-6">
          <Section title={isThai ? '1. การยอมรับข้อกำหนด' : '1. Acceptance of Terms'}>
            <p>
              {isThai
                ? 'เมื่อเข้าถึงหรือใช้ ThaiChess คุณยอมรับที่จะผูกพันตามข้อกำหนดเหล่านี้ หากคุณไม่เห็นด้วย กรุณาอย่าใช้บริการของเรา'
                : 'By accessing or using ThaiChess, you agree to be bound by these terms. If you disagree, please do not use our Service.'}
            </p>
          </Section>

          <Section title={isThai ? '2. บริการของเรา' : '2. Our Service'}>
            <p>
              {isThai
                ? 'ThaiChess ให้บริการเล่นหมากรุกไทยออนไลน์ฟรีรวมถึง: เกมออนไลน์สดกับผู้เล่นอื่น เกมกับบอท AI โจทย์และบทเรียนเชิงกลยุทธ์ ระบบจัดอันดับและสถิติ'
                : 'ThaiChess provides free online Thai chess including: Live online games with other players, Games against AI bots, Tactics puzzles and lessons, Rating and statistics system'}
            </p>
          </Section>

          <Section title={isThai ? '3. บัญชีผู้ใช้' : '3. User Accounts'}>
            <p>
              {isThai
                ? 'คุณอาจใช้บริการของเราได้โดยไม่ต้องสมัครบัญชี แต่บัญชีจำเป็นสำหรับคุณสมบัติบางอย่าง เช่น การเล่นแบบจัดอันดับ หากคุณสร้างบัญชี: คุณต้องให้ข้อมูลที่ถูกต้องและเป็นปัจจุบัน คุณมีหน้าที่รักษาความปลอดภัยข้อมูลประจำตัวของคุณ คุณต้องแจ้งให้เราทราบทันทีหากมีการใช้บัญชีโดยไม่ได้รับอนุญาต'
                : 'You may use our Service without an account, but accounts are required for some features like rated play. If you create an account: You must provide accurate and current information, You are responsible for maintaining your credentials security, You must notify us immediately of unauthorized account use'}
            </p>
          </Section>

          <Section title={isThai ? '4. กฎการใช้งาน' : '4. Acceptable Use'}>
            <p>
              {isThai
                ? 'คุณตกลงที่จะ: ไม่ใช้บอทหรือสคริปต์ในการเล่นโดยไม่ได้รับอนุญาต ไม่ใช้ชื่อผู้ใช้ที่หยาบคาย ลามก หรือละเมิดลิขสิทธิ์ ไม่คุกคาม ข่มขู่ หรือกระทำต่อผู้เล่นอื่นอย่างไม่เหมาะสม ไม่พยายามเข้าถึงระบบของเราโดยไม่ได้รับอนุญาต'
                : 'You agree to: Not use unauthorized bots or scripts in gameplay, Not use offensive, obscene, or infringing usernames, Not harass, threaten, or abuse other players, Not attempt unauthorized access to our systems'}
            </p>
          </Section>

          <Section title={isThai ? '5. เนื้อหาและลิขสิทธิ์' : '5. Content and Copyright'}>
            <p>
              {isThai
                ? 'เกมหมากรุกไทยเป็นสาธารณสมบัติ (เกมเก่า) เกมที่เล่นบนแพลตฟอร์มของเราอาจถูกบันทึกและแสดงต่อสาธารณะ คุณให้สิทธิ์แก่เราในการแสดง จัดเก็บ และวิเคราะห์เกมที่คุณเล่น'
                : 'Thai chess is in the public domain (ancient game). Games played on our platform may be recorded and displayed publicly. You grant us the right to display, store, and analyze games you play.'}
            </p>
          </Section>

          <Section title={isThai ? '6. การสิ้นสุดบริการ' : '6. Termination'}>
            <p>
              {isThai
                ? 'เราขอสงวนสิทธิ์ในการระงับหรือยุติบัญชีของคุณหากคุณละเมิดข้อกำหนดเหล่านี้ คุณสามารถลบบัญชีของคุณได้ตลอดเวลาผ่านหน้าบัญชี'
                : 'We reserve the right to suspend or terminate your account for violations of these terms. You may delete your account at any time through the account page.'}
            </p>
          </Section>

          <Section title={isThai ? '7. ข้อจำกัดความรับผิดชอบ' : '7. Limitation of Liability'}>
            <p>
              {isThai
                ? 'ThaiChess ให้บริการ "ตามสภาพ" โดยไม่มีการรับประกันใดๆ เราไม่รับผิดชอบต่อความเสียหายใดๆ ที่เกิดจากการใช้บริการของเรา'
                : 'ThaiChess is provided "as is" without any warranties. We are not liable for any damages arising from your use of the Service.'}
            </p>
          </Section>

          <Section title={isThai ? '8. การเปลี่ยนแปลงข้อกำหนด' : '8. Changes to Terms'}>
            <p>
              {isThai
                ? 'เราอาจปรับปรุงข้อกำหนดเหล่านี้เป็นครั้งคราว การเปลี่ยนแปลงจะมีผลทันทีเมื่อโพสต์ การใช้บริการต่อเนื่องแสดงว่าคุณยอมรับข้อกำหนดใหม่'
                : 'We may update these terms from time to time. Changes take effect immediately upon posting. Continued use indicates acceptance of new terms.'}
            </p>
          </Section>

          <Section title={isThai ? '9. กฎหมายที่ใช้บังคับ' : '9. Governing Law'}>
            <p>
              {isThai
                ? 'ข้อกำหนดเหล่านี้อยู่ภายใต้กฎหมายของประเทศไทย และกฎหมาย PDPA B.E. 2562'
                : "These terms are governed by the laws of Thailand and the PDPA B.E. 2562."}
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
}
