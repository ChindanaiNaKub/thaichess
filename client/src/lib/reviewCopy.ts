import { useCallback } from 'react';
import { useTranslation, type Language } from './i18n';

type ReviewCopyKey =
  | 'review.title'
  | 'review.main_line'
  | 'review.analysis_branch'
  | 'review.main_status'
  | 'review.analysis_status'
  | 'review.enter_analysis'
  | 'review.return_to_game'
  | 'review.reset_variation'
  | 'review.from_start'
  | 'review.from_move'
  | 'review.official_start'
  | 'review.official_move'
  | 'review.branch_navigation'
  | 'review.branch_root'
  | 'review.branch_prev'
  | 'review.branch_next'
  | 'review.branch_leaf'
  | 'review.current_variation'
  | 'review.variation_empty'
  | 'review.engine'
  | 'review.engine_loading'
  | 'review.engine_error'
  | 'review.engine_idle'
  | 'review.no_best_move'
  | 'analysis.eval_swing'
  | 'analysis.current_position'
  | 'analysis.position_before_start'
  | 'analysis.position_after_move'
  | 'analysis.turn_to_move'
  | 'analysis.win_chances'
  | 'analysis.expected_score'
  | 'analysis.best_continuation';

type ReviewCopyCatalog = Record<ReviewCopyKey, string>;

const REVIEW_COPY: Record<Language, ReviewCopyCatalog> = {
  en: {
    'review.title': 'Review',
    'review.main_line': 'Main Line',
    'review.analysis_branch': 'Analysis Branch',
    'review.main_status': 'Main line review',
    'review.analysis_status': 'Analysis sandbox',
    'review.enter_analysis': 'Enter Analysis',
    'review.return_to_game': 'Return to official game',
    'review.reset_variation': 'Reset variation',
    'review.from_start': 'Started from the initial position',
    'review.from_move': 'Started from official move {move}',
    'review.official_start': 'Official start position',
    'review.official_move': 'Official move {move}',
    'review.branch_navigation': 'Branch navigation',
    'review.branch_root': 'Jump to branch root',
    'review.branch_prev': 'Previous branch move',
    'review.branch_next': 'Next branch move',
    'review.branch_leaf': 'Jump to branch leaf',
    'review.current_variation': 'Current variation',
    'review.variation_empty': 'No temporary moves yet. Play any legal move to start a variation.',
    'review.engine': 'Engine',
    'review.engine_loading': 'Analyzing current position...',
    'review.engine_error': 'Engine analysis is unavailable right now.',
    'review.engine_idle': 'Select or play a move to analyze this position.',
    'review.no_best_move': 'none',
    'analysis.eval_swing': 'Eval swing',
    'analysis.current_position': 'Current position',
    'analysis.position_before_start': 'Before move 1',
    'analysis.position_after_move': 'After move {move} of {total}',
    'analysis.turn_to_move': 'Turn',
    'analysis.win_chances': 'Winning chances',
    'analysis.expected_score': 'Expected score',
    'analysis.best_continuation': 'Best continuation',
  },
  th: {
    'review.title': 'รีวิว',
    'review.main_line': 'เส้นเกมจริง',
    'review.analysis_branch': 'แขนงวิเคราะห์',
    'review.main_status': 'กำลังดูเส้นเกมจริง',
    'review.analysis_status': 'โหมดลองเดินวิเคราะห์',
    'review.enter_analysis': 'เข้าสู่โหมดวิเคราะห์',
    'review.return_to_game': 'กลับสู่เกมจริง',
    'review.reset_variation': 'รีเซ็ตแขนง',
    'review.from_start': 'เริ่มจากตำแหน่งตั้งต้น',
    'review.from_move': 'เริ่มจากตาเดินจริงที่ {move}',
    'review.official_start': 'ตำแหน่งตั้งต้นของเกมจริง',
    'review.official_move': 'ตาเดินจริงที่ {move}',
    'review.branch_navigation': 'การเดินในแขนง',
    'review.branch_root': 'ไปยังรากของแขนง',
    'review.branch_prev': 'ย้อนตาในแขนง',
    'review.branch_next': 'เดินหน้าต่อในแขนง',
    'review.branch_leaf': 'ไปยังปลายแขนง',
    'review.current_variation': 'แขนงปัจจุบัน',
    'review.variation_empty': 'ยังไม่มีตาเดินชั่วคราว ลองเดินตาที่ถูกกฎหมายเพื่อเริ่มแขนงวิเคราะห์',
    'review.engine': 'เอนจิน',
    'review.engine_loading': 'กำลังวิเคราะห์ตำแหน่งปัจจุบัน...',
    'review.engine_error': 'ตอนนี้ไม่สามารถวิเคราะห์ด้วยเอนจินได้',
    'review.engine_idle': 'เลือกหรือเดินตาเพื่อวิเคราะห์ตำแหน่งนี้',
    'review.no_best_move': 'ไม่มี',
    'analysis.eval_swing': 'ความแกว่งของการประเมิน',
    'analysis.current_position': 'ตำแหน่งปัจจุบัน',
    'analysis.position_before_start': 'ก่อนตาแรก',
    'analysis.position_after_move': 'หลังตา {move} จาก {total}',
    'analysis.turn_to_move': 'ฝั่งที่ถึงตา',
    'analysis.win_chances': 'โอกาสชนะ',
    'analysis.expected_score': 'คะแนนคาดหวัง',
    'analysis.best_continuation': 'แนวเดินที่ดีที่สุด',
  },
};

function applyParams(text: string, params?: Record<string, string | number>): string {
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
  }

  return text;
}

export function useReviewCopy() {
  const { lang } = useTranslation();

  return useCallback((key: string, params?: Record<string, string | number>) => {
    const typedKey = key as ReviewCopyKey;
    const template = REVIEW_COPY[lang][typedKey] ?? REVIEW_COPY.en[typedKey] ?? key;
    return applyParams(template, params);
  }, [lang]);
}
