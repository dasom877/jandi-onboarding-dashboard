export interface OnboardingMain {
  cohort: string;         // 기수
  buddy: string;          // 골든버디
  rookie: string;         // 노랑루키
  joinDate: string;       // 입사일
  quitDate: string | null; // 퇴사일
  startDate: string;      // 시작일
  endDate: string;        // 종료일
  reward1Date: string | null; // 1차 포상 지급일
  reward2Date: string | null; // 2차 포상 지급일
  department?: string;    // 부서
  rank?: string;          // 직급 (비고)
}

export interface ActivitySchedule {
  cohort: string;         // 기수
  step: number;           // 단계 (1~4)
  title: string;          // 핵심 내용
  status: '완료' | '진행중' | '예정'; // 진행현황
}

export interface SatisfactionSurvey {
  cohort: string;         // 기수
  respondent: string;     // 응답자
  department: string;     // 부서
  qNo: string;            // 문항번호 (Q1 ~ Q11)
  question: string;       // 문항 내용
  response: string;       // 응답 (점수 혹은 주관식 텍스트)
}

export interface AIAnalysisResult {
  summary: string;
  keywords: Array<{ keyword: string; count: number; sentiment: 'Positive' | 'Improvement' }>;
  hightlights: string[];
  success?: boolean;
  source?: string;
}
