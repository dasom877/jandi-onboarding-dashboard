import React, { useState } from "react";
import { OnboardingMain, ActivitySchedule } from "../types";
import { Award, Eye, User, Calendar, RefreshCcw, Smile, AlertTriangle, PlayCircle, Clock, Trash2, Search, Send, Bell } from "lucide-react";
import { sendJandiMessage } from "../utils/jandiSender";

interface StatusDashboardProps {
  mains: OnboardingMain[];
  schedules: ActivitySchedule[];
}

// Date parser helper to calculate 입사일 + 6개월 시점 기준 달의 말일
export function calculate6MonthRewardDate(joinDateStr: string): string {
  if (!joinDateStr) return "-";
  try {
    const parts = joinDateStr.split("-");
    if (parts.length !== 3) return "-";
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    // Add 6 months
    let targetYear = year;
    let targetMonth = month + 6;
    if (targetMonth > 12) {
      targetYear += Math.floor((targetMonth - 1) / 12);
      targetMonth = ((targetMonth - 1) % 12) + 1;
    }

    // Get last day of targetMonth
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    
    const doubleDigits = (n: number) => n < 10 ? `0${n}` : `${n}`;
    return `${targetYear}-${doubleDigits(targetMonth)}-${doubleDigits(lastDay)}`;
  } catch (err) {
    console.error("Reward calculation error:", err);
    return "-";
  }
}

export default function StatusDashboard({ mains, schedules }: StatusDashboardProps) {
  const [activeTab, setActiveTab] = useState<"A" | "B" | "C" | "D">("B");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: "success" | "error" | "info" }>({
    show: false,
    msg: "",
    type: "success"
  });

  const triggerToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleSendJandi = async (text: string, title?: string, subtitle?: string, rookieName?: string) => {
    setIsSending(true);
    try {
      const fullMessage = title ? `${title}\n${subtitle ? `> ${subtitle}\n\n` : ""}${text}` : text;
      const res = await sendJandiMessage({
        rookieName: rookieName || "전체 공지",
        message: fullMessage
      });

      if (res.success) {
        triggerToast("🍀 잔디(JANDI) 실시간 알림 발송 성공!", "success");
      } else {
        triggerToast(`잔디 전송 오류: ${res.error}`, "error");
      }
    } catch (err: any) {
      triggerToast("통신 에러: " + (err.message || err), "error");
    } finally {
      setIsSending(false);
    }
  };

  // Determine cohort progress based on steps
  const cohortProgressMap: Record<string, { totalSteps: number; completedSteps: number; currentStepTitle: string; status: string }> = {};
  
  schedules.forEach(s => {
    if (!cohortProgressMap[s.cohort]) {
      cohortProgressMap[s.cohort] = { totalSteps: 0, completedSteps: 0, currentStepTitle: "-", status: "예정" };
    }
    const prog = cohortProgressMap[s.cohort];
    prog.totalSteps++;
    if (s.status === "완료") {
      prog.completedSteps++;
    }
    if (s.status === "진행중") {
      prog.currentStepTitle = `${s.step}단계: ${s.title}`;
      prog.status = "진행중";
    }
  });

  // Apply default active step titles if all are completed or all are planned
  schedules.forEach(s => {
    const prog = cohortProgressMap[s.cohort];
    if (prog && prog.currentStepTitle === "-") {
      if (prog.completedSteps === prog.totalSteps && prog.totalSteps > 0) {
        prog.currentStepTitle = "온보딩 일정 종료 (전원 완료)";
        prog.status = "완료";
      } else {
        const firstStep = schedules.find(item => item.cohort === s.cohort && item.step === 1);
        prog.currentStepTitle = firstStep ? `1단계 예정: ${firstStep.title}` : "예정";
        prog.status = "예정";
      }
    }
  });

  // Classify mains into A, B, C, D
  const listA: OnboardingMain[] = []; // 완료 기수
  const listB: (OnboardingMain & { reward2Estimated: string })[] = []; // 포상 대기/추적 기수
  const listC: (OnboardingMain & { progressPercent: number; currentStep: string })[] = []; // 활동 진행중 기수
  const listD: OnboardingMain[] = []; // 활동 예정 기수

  mains.forEach(m => {
    const isLooKieQuit = !!m.quitDate;
    
    // 1) 완료 기수: 1차, 2차 지급일 모두 정상 입력 완료
    const isCompletedReward = !!m.reward1Date && !!m.reward2Date;

    // 2) 활동 예정 기수: 입사일이 미래인 기수이거나 현황이 '예정'인 기수
    const prog = cohortProgressMap[m.cohort];
    const isScheduled = prog?.status === "예정" && m.joinDate > "2026-06-11";

    if (isCompletedReward) {
      listA.push(m);
    } else if (isScheduled) {
      listD.push(m);
    } else {
      // 3) 활동 진행중 기수: 진행현황에 '진행중'인 단계가 있거나, 또는 아직 종료일이 도래하지 않은 기수
      const isOngoing = prog?.status === "진행중" || m.endDate >= "2026-06-11";
      if (isOngoing && !isLooKieQuit) {
        const total = prog?.totalSteps || 4;
        const comp = prog?.completedSteps || 0;
        const progressPercent = Math.round((comp / total) * 100);
        listC.push({
          ...m,
          progressPercent,
          currentStep: prog?.currentStepTitle || "1단계 대기 중",
        });
      } else {
        // 4) 포상 대기/추적 기수: 활동은 끝났으나 2차포상이 빈칸/지급예정이면서 퇴사일 없는 6개월 대기/추적자
        // (보완: 퇴사 여부도 화면에 확실히 붉게 반영하여 사후 추적하도록 구성)
        const estDate = calculate6MonthRewardDate(m.joinDate);
        listB.push({
          ...m,
          reward2Estimated: estDate
        });
      }
    }
  });

  // Filters search query
  const matchesFilter = (item: any) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.cohort.toLowerCase().includes(q) ||
      item.buddy.toLowerCase().includes(q) ||
      item.rookie.toLowerCase().includes(q)
    );
  };

  const filteredA = listA.filter(matchesFilter);
  const filteredB = listB.filter(matchesFilter);
  const filteredC = listC.filter(matchesFilter);
  const filteredD = listD.filter(matchesFilter);

  return (
    <div id="status-dashboard-view" className="space-y-6">
      {/* SECTION 1: 기수 현황 요약 카드 (상단 대시보드 요약카드) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card A: 완료 */}
        <button
          onClick={() => setActiveTab("A")}
          className={`cursor-pointer text-left p-5 rounded-2xl border transition-all ${
            activeTab === "A"
              ? "bg-white text-slate-800 border-blue-600 ring-4 ring-blue-600/5 shadow-md shadow-blue-600/5 scale-[1.02]"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">포상 지급 완료</p>
            <Smile className={`w-4 h-4 ${activeTab === "A" ? "text-blue-600" : "text-slate-400"}`} />
          </div>
          <p className="text-2xl font-black text-slate-800 tracking-tight">
            {listA.length < 10 ? `0${listA.length}` : listA.length}
            <span className="text-xs font-semibold text-slate-450 ml-1">기수</span>
          </p>
          <div className="w-full h-1 bg-blue-100 mt-3 rounded-full overflow-hidden">
            <div className="w-full h-full bg-blue-600 transition-all duration-500"></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 font-medium">1,2차 포상 지급 완료 전우림</p>
        </button>

        {/* Card B: 포상 대기 (추적) - 핵심 */}
        <button
          onClick={() => setActiveTab("B")}
          className={`cursor-pointer text-left p-5 rounded-2xl border transition-all ${
            activeTab === "B"
              ? "bg-white text-slate-800 border-amber-500 ring-4 ring-amber-500/5 shadow-md shadow-amber-500/5 scale-[1.02]"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">포상 대기/추적</p>
            <Award className={`w-4 h-4 ${activeTab === "B" ? "text-amber-500" : "text-slate-400"}`} />
          </div>
          <p className="text-2xl font-black text-slate-800 tracking-tight">
            {listB.length < 10 ? `0${listB.length}` : listB.length}
            <span className="text-xs font-semibold text-slate-450 ml-1">기수</span>
          </p>
          <div className="w-full h-1 bg-amber-100 mt-3 rounded-full overflow-hidden">
            <div className="w-3/4 h-full bg-amber-500 transition-all duration-500"></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 font-medium">활동 수료 후 6개월 근속 모니터링</p>
        </button>

        {/* Card C: 활동 진행중 */}
        <button
          onClick={() => setActiveTab("C")}
          className={`cursor-pointer text-left p-5 rounded-2xl border transition-all ${
            activeTab === "C"
              ? "bg-white text-slate-800 border-emerald-500 ring-4 ring-emerald-500/5 shadow-md shadow-emerald-500/5 scale-[1.02]"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">활동 진행 중</p>
            <PlayCircle className={`w-4 h-4 ${activeTab === "C" ? "text-emerald-500" : "text-slate-400"}`} />
          </div>
          <p className="text-2xl font-black text-slate-800 tracking-tight">
            {listC.length < 10 ? `0${listC.length}` : listC.length}
            <span className="text-xs font-semibold text-slate-450 ml-1">기수</span>
          </p>
          <div className="w-full h-1 bg-emerald-100 mt-3 rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-emerald-500 transition-all duration-500"></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 font-medium">주차별 단계 선후배 교류 미션 진행 중</p>
        </button>

        {/* Card D: 활동 예정 */}
        <button
          onClick={() => setActiveTab("D")}
          className={`cursor-pointer text-left p-5 rounded-2xl border transition-all ${
            activeTab === "D"
              ? "bg-white text-slate-800 border-indigo-500 ring-4 ring-indigo-500/5 shadow-md shadow-indigo-500/5 scale-[1.02]"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">활동 예정</p>
            <Clock className={`w-4 h-4 ${activeTab === "D" ? "text-indigo-500" : "text-slate-400"}`} />
          </div>
          <p className="text-2xl font-black text-slate-800 tracking-tight">
            {listD.length < 10 ? `0${listD.length}` : listD.length}
            <span className="text-xs font-semibold text-slate-450 ml-1">기수</span>
          </p>
          <div className="w-full h-1 bg-slate-100 mt-3 rounded-full overflow-hidden">
            <div className="w-1/4 h-full bg-slate-300 transition-all duration-500"></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 font-medium">입사 예정 또는 버디 매칭 대기</p>
        </button>
      </div>

      {/* Search and Table block */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Search header & description */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>{activeTab === "A" ? "A. 포상 지급 완료 리스트" : activeTab === "B" ? "B. 포상 대기 및 근속 추적 리스트" : activeTab === "C" ? "C. 활동 진행 중 관리 대시보드" : "D. 온보딩 시작 대기 및 예정 대장"}</span>
              <span className="text-xs bg-slate-200/60 px-2 py-0.5 rounded text-slate-600 font-mono">
                {activeTab === "A" ? filteredA.length : activeTab === "B" ? filteredB.length : activeTab === "C" ? filteredC.length : filteredD.length} Row(s)
              </span>
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              {activeTab === "A" && "1차/2차 보상금이 모두 정상 지급완료되어 장기 근속이 안정화된 기열입니다."}
              {activeTab === "B" && "활동은 끝났으나 2차포상이 신청예정이며, 6달간 사후 퇴사자 유무를 추적 점검하는 선별 구간입니다."}
              {activeTab === "C" && "선후배 간 일정 주차가 진행 중인 상태로 주차별 진척률과 현재 활성화된 진행단계를 확인합니다."}
              {activeTab === "D" && "입사가 확정되었거나 버디 매칭이 성립되어 온보딩 수립을 대기 중인 기열입니다."}
            </p>
          </div>
          <div className="relative w-full md:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="기수, 버디, 루키 이름 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-xs font-medium focus:outline-none focus:border-blue-500 text-slate-805"
            />
          </div>
        </div>

        {/* Dynamic Table Rendering */}
        <div className="overflow-x-auto">
          {activeTab === "A" && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                  <th className="p-4">기수</th>
                  <th className="p-4">골든버디 성명</th>
                  <th className="p-4">노랑루키 성명</th>
                  <th className="p-4">입사일</th>
                  <th className="p-4 text-emerald-600">1차 포상 지급완료일</th>
                  <th className="p-4 text-emerald-600">2차 포상 지급완료일</th>
                  <th className="p-4">근속 상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredA.length > 0 ? (
                  filteredA.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{item.cohort}</td>
                      <td className="p-4 flex items-center gap-1.5 font-medium"><User className="w-3.5 h-3.5 text-slate-400" /> {item.buddy}</td>
                      <td className="p-4 font-medium">{item.rookie}</td>
                      <td className="p-4 text-slate-500 font-mono">{item.joinDate}</td>
                      <td className="p-4 font-mono text-emerald-700 font-semibold">{item.reward1Date}</td>
                      <td className="p-4 font-mono text-emerald-700 font-semibold">{item.reward2Date}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px] border border-emerald-200">
                          안정 근속 중
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400">지급 완료된 포상 전제조건을 만족하는 기수가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === "B" && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                  <th className="p-4">기수</th>
                  <th className="p-4">골든버디 성명</th>
                  <th className="p-4">노랑루키 성명</th>
                  <th className="p-4">노랑루키 입사일</th>
                  <th className="p-4 text-rose-500">2차 포상 지급예정일 (AI 계산)</th>
                  <th className="p-4">근속 상태 (퇴사 여부 반영)</th>
                  <th className="p-4">조치사항</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredB.length > 0 ? (
                  filteredB.map((item, idx) => {
                    const hasQuit = !!item.quitDate;
                    return (
                      <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${hasQuit ? "bg-rose-50/20" : ""}`}>
                        <td className="p-4 font-bold text-slate-850">{item.cohort}</td>
                        <td className="p-4 flex items-center gap-1.5 font-medium"><User className="w-3.5 h-3.5 text-slate-400" /> {item.buddy}</td>
                        <td className="p-4 font-medium">{item.rookie}</td>
                        <td className="p-4 text-slate-500 font-mono">{item.joinDate}</td>
                        <td className="p-4 font-bold font-mono text-rose-700">
                          {hasQuit ? (
                            <span className="line-through text-slate-400">{item.reward2Estimated}</span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {item.reward2Estimated}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {hasQuit ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full font-extrabold text-[10px] border border-rose-200">
                              <Trash2 className="w-3 h-3" />
                              중도 퇴사 ({item.quitDate})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-sky-50 text-sky-700 rounded-full font-extrabold text-[10px] border border-sky-200 animate-pulse">
                              6개월 근속 지속 중
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {hasQuit ? (
                            <span className="text-[11px] text-rose-600 font-bold">지급 불가 (추적 취소)</span>
                          ) : (
                            <button
                              disabled={isSending}
                              onClick={async () => {
                                // 1. Send real-time notification to Jandi
                                await handleSendJandi(
                                  `💰 [6개월 근속 포상 신청 연동] ${item.cohort} ${item.rookie} 루키님의 포상금 품의 승인 요청이 시작되었습니다!`,
                                  `💰 [6개월 근속 포상] ${item.cohort} ${item.rookie} 루키`,
                                  `골든버디 ${item.buddy} 선배와의 매칭 종료 및 2차 포상금 지급 품의서 상신 개시 (지급예정일: ${item.reward2Estimated})`
                                );
                                // 2. Show traditional alert
                                alert(`[근속 확인 및 포상 신청서 연동]\n${item.cohort} ${item.rookie} 루키님의 재직 증명 확인이 성립되었으며,\n2차 포상금 지급 품의서 생성이 시작되었습니다. (잔디 채널 자동 발송 완료)`);
                              }}
                              className={`cursor-pointer text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                                isSending 
                                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                                  : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                              }`}
                            >
                              {isSending ? "전송 중..." : "근속 포상금 신청"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400">포상지급 예비 대기 조건을 달성한 인원이 존재하지 않습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === "C" && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                  <th className="p-4">기수</th>
                  <th className="p-4">매칭 정보 (골든버디 / 노랑루키)</th>
                  <th className="p-4">노랑루키 입사일</th>
                  <th className="p-4">현재 진행 단계 및 핵심내용</th>
                  <th className="p-4">온보딩 시간표 진행률</th>
                  <th className="p-4">남은 기간 (수례 기일)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredC.length > 0 ? (
                  filteredC.map((item, idx) => {
                    const daysLeft = Math.ceil(
                      (new Date(item.endDate).getTime() - new Date("2026-06-11").getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{item.cohort}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                              골든버디: {item.buddy}
                            </span>
                            <span className="text-slate-500 pl-2.5">노랑루키: {item.rookie}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 font-mono">{item.joinDate}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 font-bold rounded-lg block w-fit">
                            {item.currentStep}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden shrink-0">
                              <div className="bg-blue-600 h-full" style={{ width: `${item.progressPercent}%` }}></div>
                            </div>
                            <span className="font-bold text-slate-700 font-mono">{item.progressPercent}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${daysLeft >= 0 ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                            {daysLeft >= 0 ? `${daysLeft}일 남음 (~${item.endDate})` : `${Math.abs(daysLeft)}일 초과`}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400">현재 일정 진행 중 상태의 온보딩 기수가 존재하지 않습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === "D" && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                  <th className="p-4">기수</th>
                  <th className="p-4">활동 시작 예정일</th>
                  <th className="p-4">노랑루키 입사일</th>
                  <th className="p-4">골든버디/노랑루키 매칭 정보</th>
                  <th className="p-4">활동 요건 가체킹</th>
                  <th className="p-4">조치</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredD.length > 0 ? (
                  filteredD.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{item.cohort}</td>
                      <td className="p-4 text-blue-700 font-bold font-mono">{item.startDate}</td>
                      <td className="p-4 text-slate-500 font-mono">{item.joinDate}</td>
                      <td className="p-4">
                        <div className="text-slate-800 font-semibold">
                          골든버디: {item.buddy} ↔ 노랑루키: {item.rookie}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-bold text-[10px] border border-indigo-100">
                          웰컴키트 및 계정 가체킹 완료
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          disabled={isSending}
                          onClick={async () => {
                            // 1. Send real-time notification to Jandi
                            await handleSendJandi(
                              `📢 [온보딩 사전 알림 전송] ${item.cohort} 골든버디(${item.buddy}님)과 노랑루키(${item.rookie}님)의 온보딩 매칭 시작 안내가 발송되었습니다.`,
                              `📢 [시작 대기] ${item.cohort} 온보딩 개시 사전 알림`,
                              `골든버디(${item.buddy}님) ↔ 노랑루키(${item.rookie}님). 예정 시작일: ${item.startDate}`
                            );
                            // 2. Show traditional alert
                            alert(`[${item.cohort} 온보딩 사전 알림 전송]\n골든버디(${item.buddy}님)과 노랑루키(${item.rookie}님)에게 시작 안내 메일이 예약 전송되었습니다. (잔디 채널 자동 발송 완료)`);
                          }}
                          className={`cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded transition-colors ${
                            isSending
                              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                              : "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700"
                          }`}
                        >
                          {isSending ? "전송 중..." : "사전 알림 메시지 발송"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400">시작 대기 대상 기수가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Floating Gorgeous Jandi Toast Notification */}
      {toast.show && (
        <div 
          id="jandi-dashboard-toast" 
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 border rounded-2xl px-5 py-4 shadow-2xl max-w-sm transition-all duration-300 transform translate-y-0 scale-100 animate-fadeIn ${
            toast.type === "success" 
              ? "bg-emerald-900 border-emerald-700 text-white" 
              : toast.type === "error"
              ? "bg-rose-900 border-rose-700 text-white"
              : "bg-slate-900 border-slate-700 text-white"
          }`}
        >
          <div className="p-1.5 rounded-lg bg-white/10 shrink-0">
            <Send className="w-4 h-4 text-amber-300" />
          </div>
          <div className="flex-1">
            <h5 className="text-xs font-bold text-amber-300">잔디(JANDI) 커넥터 피드백</h5>
            <p className="text-[11px] text-white/90 font-medium mt-0.5 leading-snug">{toast.msg}</p>
          </div>
        </div>
      )}
    </div>
  );
}
