import { TreatmentStatus } from '../types';

export interface TreatmentStatusOption {
  value: TreatmentStatus;
  label: string;
  shortLabel: string;
  badgeClass: string;
  description: string;
}

export const TREATMENT_STATUS_OPTIONS: TreatmentStatusOption[] = [
  {
    value: 'Active',
    label: 'อยู่ระหว่างรักษา (Active)',
    shortLabel: 'อยู่ระหว่างรักษา',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'ผู้ป่วยอยู่ระหว่างรับประทานยาต้านวัณโรคตามแผนการรักษา'
  },
  {
    value: 'Cured',
    label: 'หายขาด (Cured)',
    shortLabel: 'หายขาด',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
    description: 'ผลตรวจเสมหะเป็นลบในเดือนสุดท้ายของการรักษา และอย่างน้อย 1 ครั้งก่อนหน้านั้น'
  },
  {
    value: 'Completed',
    label: 'รักษาครบกำหนด (Completed)',
    shortLabel: 'รักษาครบกำหนด',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'รับประทานยาครบกำหนดตามสูตรการรักษา แต่ไม่มีผลตรวจเสมหะเดือนสุดท้าย'
  },
  {
    value: 'Interrupted',
    label: 'ขาดยา/ขาดการรักษา (Interrupted)',
    shortLabel: 'ขาดยา/ขาดการรักษา',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'หยุดรับประทานยาติดต่อกันตั้งแต่ 2 เดือนขึ้นไป'
  },
  {
    value: 'Died',
    label: 'เสียชีวิต (Died)',
    shortLabel: 'เสียชีวิต',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    description: 'ผู้ป่วยเสียชีวิตระหว่างการรักษาไม่ว่าจะด้วยสาเหตุใด'
  },
  {
    value: 'Transferred',
    label: 'โอนย้ายออก (Transferred)',
    shortLabel: 'โอนย้ายออก',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'โอนย้ายไปรับการรักษาต่อที่สถานพยาบาลหรือพื้นที่อื่น'
  }
];

export function getTreatmentStatusOption(status: TreatmentStatus | string | undefined): TreatmentStatusOption {
  const normalized = normalizeTreatmentStatus(status);
  const found = TREATMENT_STATUS_OPTIONS.find(opt => opt.value === normalized);
  return found || TREATMENT_STATUS_OPTIONS[0];
}

export function getTreatmentStatusLabel(status: TreatmentStatus | string | undefined): string {
  return getTreatmentStatusOption(status).label;
}

export function getTreatmentStatusShortLabel(status: TreatmentStatus | string | undefined): string {
  return getTreatmentStatusOption(status).shortLabel;
}

export function getTreatmentStatusBadgeClass(status: TreatmentStatus | string | undefined): string {
  return getTreatmentStatusOption(status).badgeClass;
}

export function normalizeTreatmentStatus(val: any): TreatmentStatus {
  if (!val) return 'Active';
  const str = String(val).trim().toLowerCase();

  if (str === 'active' || str.includes('กำลังรักษา') || str.includes('อยู่ระหว่างรักษา') || str.includes('รักษาอยู่')) {
    return 'Active';
  }
  if (str === 'cured' || str.includes('หายขาด') || str.includes('รักษาหาย') || str.includes('หายแล้ว')) {
    return 'Cured';
  }
  if (str === 'completed' || str.includes('ครบกำหนด') || str.includes('รักษาครบ') || str.includes('ครบการรักษา')) {
    return 'Completed';
  }
  if (str === 'interrupted' || str.includes('ขาดยา') || str.includes('ขาดการรักษา') || str.includes('ขาดรับยา') || str.includes('default')) {
    return 'Interrupted';
  }
  if (str === 'died' || str.includes('เสียชีวิต') || str.includes('ตาย') || str.includes('death')) {
    return 'Died';
  }
  if (str === 'transferred' || str.includes('โอนย้าย') || str.includes('ย้ายออก') || str.includes('transfer')) {
    return 'Transferred';
  }

  return 'Active';
}
