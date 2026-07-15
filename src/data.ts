import { OnboardingMain, ActivitySchedule, SatisfactionSurvey } from "./types";

export const defaultOnboardingMain: OnboardingMain[] = [
  {
    cohort: "10기",
    buddy: "김영희",
    rookie: "이재현",
    joinDate: "2026-06-01",
    quitDate: null,
    startDate: "2026-06-01",
    endDate: "2026-09-01",
    reward1Date: null,
    reward2Date: null,
    department: "개발팀",
    rank: "팀원급"
  },
  {
    cohort: "9기",
    buddy: "박준영",
    rookie: "최민아",
    joinDate: "2026-04-15",
    quitDate: null,
    startDate: "2026-04-15",
    endDate: "2026-07-15",
    reward1Date: "2026-05-15",
    reward2Date: null, // 진행 중
    department: "마케팅팀",
    rank: "팀원급"
  },
  {
    cohort: "8기",
    buddy: "최성우",
    rookie: "강동원",
    joinDate: "2025-11-20",
    quitDate: null,
    startDate: "2025-11-20",
    endDate: "2026-02-20",
    reward1Date: "2025-12-20",
    reward2Date: null, // 포상 대기 상태
    department: "개발팀",
    rank: "팀원급"
  },
  {
    cohort: "7기",
    buddy: "정민식",
    rookie: "백예린",
    joinDate: "2025-11-01",
    quitDate: null,
    startDate: "2025-11-01",
    endDate: "2026-02-01",
    reward1Date: "2025-12-01",
    reward2Date: "2026-05-01", // 지급완료
    department: "인사팀",
    rank: "팀원급"
  },
  {
    cohort: "6기",
    buddy: "홍길동",
    rookie: "김서연",
    joinDate: "2025-10-10",
    quitDate: null,
    startDate: "2025-10-10",
    endDate: "2026-01-10",
    reward1Date: "2025-11-10",
    reward2Date: "2026-04-10", // 지급완료
    department: "글로벌영업본부",
    rank: "팀장급"
  },
  {
    cohort: "5기",
    buddy: "윤준호",
    rookie: "오세욱",
    joinDate: "2025-08-01",
    quitDate: "2026-02-15", // 퇴사 정보 반영
    startDate: "2025-08-01",
    endDate: "2025-11-01",
    reward1Date: "2025-09-01",
    reward2Date: null,
    department: "디자인팀",
    rank: "팀원급"
  },
  {
    cohort: "11기",
    buddy: "강현수",
    rookie: "한소희",
    joinDate: "2026-07-01",
    quitDate: null,
    startDate: "2026-07-01",
    endDate: "2026-10-01",
    reward1Date: null,
    reward2Date: null,
    department: "마케팅팀",
    rank: "팀원급"
  }
];

export const defaultActivitySchedules: ActivitySchedule[] = [
  // 10기
  { cohort: "10기", step: 1, title: "조직 내부 적응 및 문화 이해", status: "진행중" },
  { cohort: "10기", step: 2, title: "OJT 실무 기초 가이드라인 마스터", status: "예정" },
  { cohort: "10기", step: 3, title: "노랑talk (1:1 밀착 소통)", status: "예정" },
  { cohort: "10기", step: 4, title: "최종 성과 평가 및 회고회", status: "예정" },

  // 9기
  { cohort: "9기", step: 1, title: "조직 내부 적응 및 문화 이해", status: "완료" },
  { cohort: "9기", step: 2, title: "OJT 실무 기초 가이드라인 마스터", status: "완료" },
  { cohort: "9기", step: 3, title: "노랑talk (1:1 밀착 소통)", status: "진행중" },
  { cohort: "9기", step: 4, title: "최종 성과 평가 및 회고회", status: "예정" },

  // 8기
  { cohort: "8기", step: 1, title: "조직 내부 적응 및 문화 이해", status: "완료" },
  { cohort: "8기", step: 2, title: "OJT 실무 기초 가이드라인 마스터", status: "완료" },
  { cohort: "8기", step: 3, title: "노랑talk (1:1 밀착 소통)", status: "완료" },
  { cohort: "8기", step: 4, title: "최종 성과 평가 및 회고회", status: "완료" },

  // 7기
  { cohort: "7기", step: 1, title: "조직 내부 적응 및 문화 이해", status: "완료" },
  { cohort: "7기", step: 2, title: "OJT 실무 기초 가이드라인 마스터", status: "완료" },
  { cohort: "7기", step: 3, title: "노랑talk (1:1 밀착 소통)", status: "완료" },
  { cohort: "7기", step: 4, title: "최종 성과 평가 및 회고회", status: "완료" },

  // 6기
  { cohort: "6기", step: 1, title: "조직 내부 적응 및 문화 이해", status: "완료" },
  { cohort: "6기", step: 2, title: "OJT 실무 기초 가이드라인 마스터", status: "완료" },
  { cohort: "6기", step: 3, title: "노랑talk (1:1 밀착 소통)", status: "완료" },
  { cohort: "6기", step: 4, title: "최종 성과 평가 및 회고회", status: "완료" },

  // 5기
  { cohort: "5기", step: 1, title: "조직 내부 적응 및 문화 이해", status: "완료" },
  { cohort: "5기", step: 2, title: "OJT 실무 기초 가이드라인 마스터", status: "완료" },
  { cohort: "5기", step: 3, title: "노랑talk (1:1 밀착 소통)", status: "완료" },
  { cohort: "5기", step: 4, title: "최종 성과 평가 및 회고회", status: "완료" },

  // 11기
  { cohort: "11기", step: 1, title: "조직 내부 적응 및 문화 이해", status: "예정" },
  { cohort: "11기", step: 2, title: "OJT 실무 기초 가이드라인 마스터", status: "예정" },
  { cohort: "11기", step: 3, title: "노랑talk (1:1 밀착 소통)", status: "예정" },
  { cohort: "11기", step: 4, title: "최종 성과 평가 및 회고회", status: "예정" },
];

export const defaultSatisfactionSurveys: SatisfactionSurvey[] = [
  // 9기 응답
  { cohort: "9기", respondent: "루키A", department: "개발팀", qNo: "Q1", question: "온보딩 일정의 체계성", response: "4" },
  { cohort: "9기", respondent: "루키A", department: "개발팀", qNo: "Q2", question: "버디의 적극적 가이딩", response: "5" },
  { cohort: "9기", respondent: "루키A", department: "개발팀", qNo: "Q3", question: "비전 및 기업문화 이해도", response: "4" },
  { cohort: "9기", respondent: "루키A", department: "개발팀", qNo: "Q4", question: "정모(노랑talk) 유익성", response: "5" },
  { cohort: "9기", respondent: "루키A", department: "개발팀", qNo: "Q5", question: "1차 포상 동기부여", response: "4" },
  { cohort: "9기", respondent: "루키A", department: "개발팀", qNo: "Q6", question: "2차 포상 소속감 증대", response: "4" },
  { cohort: "9기", respondent: "루키A", department: "개발팀", qNo: "Q7", question: "부서 내 소통 수월성", response: "5" },
  { cohort: "9기", respondent: "루키A", department: "개발팀", qNo: "Q8", question: "전반적 만족도", response: "5" },
  { cohort: "9기", respondent: "루키A", department: "개발팀", qNo: "Q9", question: "타인 추천 여부", response: "4" },
  { cohort: "9기", respondent: "루키A", department: "개발팀", qNo: "Q10", question: "노랑talk 느낀 점", response: "버디 선배와 둘이서 커피를 마시며 사내 히스토리와 부서간 협업 꿀팁을 전해 들어서 현업 안착에 매우 든든했습니다." },
  { cohort: "9기", respondent: "루키A", department: "개발팀", qNo: "Q11", question: "건의사항", response: "활동 보고서 작성 서식이 한글 파일이라서 제출하기 번거롭습니다. 온라인 설문이나 간소화된 템플릿이면 부담이 적을 것 같습니다." },

  { cohort: "9기", respondent: "루키B", department: "마케팅팀", qNo: "Q1", question: "온보딩 일정의 체계성", response: "4" },
  { cohort: "9기", respondent: "루키B", department: "마케팅팀", qNo: "Q2", question: "버디의 적극적 가이딩", response: "4" },
  { cohort: "9기", respondent: "루키B", department: "마케팅팀", qNo: "Q3", question: "비전 및 기업문화 이해도", response: "3" },
  { cohort: "9기", respondent: "루키B", department: "마케팅팀", qNo: "Q4", question: "정모(노랑talk) 유익성", response: "5" },
  { cohort: "9기", respondent: "루키B", department: "마케팅팀", qNo: "Q5", question: "1차 포상 동기부여", response: "5" },
  { cohort: "9기", respondent: "루키B", department: "마케팅팀", qNo: "Q6", question: "2차 포상 소속감 증대", response: "4" },
  { cohort: "9기", respondent: "루키B", department: "마케팅팀", qNo: "Q7", question: "부서 내 소통 수월성", response: "4" },
  { cohort: "9기", respondent: "루키B", department: "마케팅팀", qNo: "Q8", question: "전반적 만족도", response: "4" },
  { cohort: "9기", respondent: "루키B", department: "마케팅팀", qNo: "Q9", question: "타인 추천 여부", response: "4" },
  { cohort: "9기", respondent: "루키B", department: "마케팅팀", qNo: "Q10", question: "노랑talk 느낀 점", response: "부담 없는 다과 미팅을 매주 가져서 유대감이 끈끈해졌고 소속 부서 적응에 크나큰 심리적 안정이 되었습니다." },
  { cohort: "9기", respondent: "루키B", department: "마케팅팀", qNo: "Q11", question: "건의사항", response: "마케팅 캠페인이 몰릴 때 3단계 미션 시작일이 딱 겹쳐 버려서 일정 조정이 어려웠습니다. 한 주 정도는 유동성 있게 조정 가능했으면 좋겠습니다." },

  // 8기 응답
  { cohort: "8기", respondent: "루키C", department: "개발팀", qNo: "Q1", question: "온보딩 일정의 체계성", response: "5" },
  { cohort: "8기", respondent: "루키C", department: "개발팀", qNo: "Q2", question: "버디의 적극적 가이딩", response: "5" },
  { cohort: "8기", respondent: "루키C", department: "개발팀", qNo: "Q3", question: "비전 및 기업문화 이해도", response: "4" },
  { cohort: "8기", respondent: "루키C", department: "개발팀", qNo: "Q4", question: "정모(노랑talk) 유익성", response: "4" },
  { cohort: "8기", respondent: "루키C", department: "개발팀", qNo: "Q5", question: "1차 포상 동기부여", response: "4" },
  { cohort: "8기", respondent: "루키C", department: "개발팀", qNo: "Q6", question: "2차 포상 소속감 증대", response: "5" },
  { cohort: "8기", respondent: "루키C", department: "개발팀", qNo: "Q7", question: "부서 내 소통 수월성", response: "4" },
  { cohort: "8기", respondent: "루키C", department: "개발팀", qNo: "Q8", question: "전반적 만족도", response: "5" },
  { cohort: "8기", respondent: "루키C", department: "개발팀", qNo: "Q9", question: "타인 추천 여부", response: "5" },
  { cohort: "8기", respondent: "루키C", department: "개발팀", qNo: "Q10", question: "노랑talk 느낀 점", response: "버디 선배님이 바쁘신 와중에도 실무 배움의 지름길을 이끌어 주시고 주관식 리퀘스트 응답에도 밀착 지원을 해주셨어요." },
  { cohort: "8기", respondent: "루키C", department: "개발팀", qNo: "Q11", question: "건의사항", response: "6개월 근속 포상금 신청 절차 및 처리 상태에 대한 투명성 높은 확인 페이지나 실시간 문자 안내가 제공되면 좋겠어요." },

  { cohort: "8기", respondent: "루키D", department: "영업팀", qNo: "Q1", question: "온보딩 일정의 체계성", response: "3" },
  { cohort: "8기", respondent: "루키D", department: "영업팀", qNo: "Q2", question: "버디의 적극적 가이딩", response: "4" },
  { cohort: "8기", respondent: "루키D", department: "영업팀", qNo: "Q3", question: "비전 및 기업문화 이해도", response: "3" },
  { cohort: "8기", respondent: "루키D", department: "영업팀", qNo: "Q4", question: "정모(노랑talk) 유익성", response: "4" },
  { cohort: "8기", respondent: "루키D", department: "영업팀", qNo: "Q5", question: "1차 포상 동기부여", response: "4" },
  { cohort: "8기", respondent: "루키D", department: "영업팀", qNo: "Q6", question: "2차 포상 소속감 증대", response: "5" },
  { cohort: "8기", respondent: "루키D", department: "영업팀", qNo: "Q7", question: "부서 내 소통 수월성", response: "4" },
  { cohort: "8기", respondent: "루키D", department: "영업팀", qNo: "Q8", question: "전반적 만족도", response: "4" },
  { cohort: "8기", respondent: "루키D", department: "영업팀", qNo: "Q9", question: "타인 추천 여부", response: "4" },
  { cohort: "8기", respondent: "루키D", department: "영업팀", qNo: "Q10", question: "노랑talk 느낀 점", response: "타 부서 버디들과 교차 네트워킹할 기회가 특히 유익했고, 외적으로 사기 진작에 큰 계기가 되었습니다." },
  { cohort: "8기", respondent: "루키D", department: "영업팀", qNo: "Q11", question: "건의사항", response: "타부서와 네트워킹은 너무 유익한데, 친해질 가벼운 온보딩 게임이나 공통 액티비티 템플릿이 더 상세하게 제공되면 소통하기가 훨씬 더 부드러울 것 같습니다." },

  // 7기 응답
  { cohort: "7기", respondent: "루키E", department: "디자인팀", qNo: "Q1", question: "온보딩 일정의 체계성", response: "5" },
  { cohort: "7기", respondent: "루키E", department: "디자인팀", qNo: "Q2", question: "버디의 적극적 가이딩", response: "5" },
  { cohort: "7기", respondent: "루키E", department: "디자인팀", qNo: "Q3", question: "비전 및 기업문화 이해도", response: "5" },
  { cohort: "7기", respondent: "루키E", department: "디자인팀", qNo: "Q4", question: "정모(노랑talk) 유익성", response: "5" },
  { cohort: "7기", respondent: "루키E", department: "디자인팀", qNo: "Q5", question: "1차 포상 동기부여", response: "5" },
  { cohort: "7기", respondent: "루키E", department: "디자인팀", qNo: "Q6", question: "2차 포상 소속감 증대", response: "5" },
  { cohort: "7기", respondent: "루키E", department: "디자인팀", qNo: "Q7", question: "부서 내 소통 수월성", response: "5" },
  { cohort: "7기", respondent: "루키E", department: "디자인팀", qNo: "Q8", question: "전반적 만족도", response: "5" },
  { cohort: "7기", respondent: "루키E", department: "디자인팀", qNo: "Q9", question: "타인 추천 여부", response: "5" },
  { cohort: "7기", respondent: "루키E", department: "디자인팀", qNo: "Q10", question: "노랑talk 느낀 점", response: "디자인 가이드라인 정리와 신규 라이브러리 온보딩 시 궁금증을 실시간으로 물어보고 해소할 수 있었던 소중한 시간이었습니다." },
  { cohort: "7기", respondent: "루키E", department: "디자인팀", qNo: "Q11", question: "건의사항", response: "온보딩에서 제공해주는 버디 예산 한도가 1회당 금액이라 살짝 타이트했습니다. 식사 한도액이 조금 더 늘어나면 대화 폭이 풍요로워질 것 같습니다." },

  { cohort: "7기", respondent: "루키F", department: "인사팀", qNo: "Q1", question: "온보딩 일정의 체계성", response: "4" },
  { cohort: "7기", respondent: "루키F", department: "인사팀", qNo: "Q2", question: "버디의 적극적 가이딩", response: "4" },
  { cohort: "7기", respondent: "루키F", department: "인사팀", qNo: "Q3", question: "비전 및 기업문화 이해도", response: "5" },
  { cohort: "7기", respondent: "루키F", department: "인사팀", qNo: "Q4", question: "정모(노랑talk) 유익성", response: "4" },
  { cohort: "7기", respondent: "루키F", department: "인사팀", qNo: "Q5", question: "1차 포상 동기부여", response: "4" },
  { cohort: "7기", respondent: "루키F", department: "인사팀", qNo: "Q6", question: "2차 포상 소속감 증대", response: "4" },
  { cohort: "7기", respondent: "루키F", department: "인사팀", qNo: "Q7", question: "부서 내 소통 수월성", response: "5" },
  { cohort: "7기", respondent: "루키F", department: "인사팀", qNo: "Q8", question: "전반적 만족도", response: "4" },
  { cohort: "7기", respondent: "루키F", department: "인사팀", qNo: "Q9", question: "타인 추천 여부", response: "4" },
  { cohort: "7기", respondent: "루키F", department: "인사팀", qNo: "Q10", question: "노랑talk 느낀 점", response: "버디 선배님이 적극 환영해 주시어 정착 기간 단축에 일조 주셨습니다. 멘탈 케어에도 다정하게 도와주셨습니다." },
  { cohort: "7기", respondent: "루키F", department: "인사팀", qNo: "Q11", question: "건의사항", response: "없음" },

  // 6기 응답
  { cohort: "6기", respondent: "루키G", department: "개발팀", qNo: "Q1", question: "온보딩 일정의 체계성", response: "4" },
  { cohort: "6기", respondent: "루키G", department: "개발팀", qNo: "Q2", question: "버디의 적극적 가이딩", response: "4" },
  { cohort: "6기", respondent: "루키G", department: "개발팀", qNo: "Q3", question: "비전 및 기업문화 이해도", response: "4" },
  { cohort: "6기", respondent: "루키G", department: "개발팀", qNo: "Q4", question: "정모(노랑talk) 유익성", response: "4" },
  { cohort: "6기", respondent: "루키G", department: "개발팀", qNo: "Q5", question: "1차 포상 동기부여", response: "3" },
  { cohort: "6기", respondent: "루키G", department: "개발팀", qNo: "Q6", question: "2차 포상 소속감 증대", response: "4" },
  { cohort: "6기", respondent: "루키G", department: "개발팀", qNo: "Q7", question: "부서 내 소통 수월성", response: "4" },
  { cohort: "6기", respondent: "루키G", department: "개발팀", qNo: "Q8", question: "전반적 만족도", response: "4" },
  { cohort: "6기", respondent: "루키G", department: "개발팀", qNo: "Q9", question: "타인 추천 여부", response: "4" },
  { cohort: "6기", respondent: "루키G", department: "개발팀", qNo: "Q10", question: "노랑talk 느낀 점", response: "친해질 계기로 정말 좋았고 점심 시간 외 깊은 커피타임을 통해 실생활 팁도 풍부히 들었습니다." },
  { cohort: "6기", respondent: "루키G", department: "개발팀", qNo: "Q11", question: "건의사항", response: "전반적인 가이드 문서가 너무 정형화되어 피로했어요. 소통을 좀 더 유연하게 가이드해주면 좋겠습니다." },
];
