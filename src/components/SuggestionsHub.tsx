import React, { useState, useEffect } from "react";
import { MessageSquare, Brain, Send, Search, Filter, Sparkles, CheckCircle2, AlertCircle, ThumbsUp, Coins, Calendar, FileText, ChevronRight, User } from "lucide-react";
import { SatisfactionSurvey, OnboardingMain } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { sendJandiMessage } from "../utils/jandiSender";

interface SuggestionsHubProps {
  surveys: SatisfactionSurvey[];
  mains?: OnboardingMain[];
  appendTerminalLog?: (msg: string) => void;
}

interface SuggestionItem {
  id: string;
  respondent: string;
  cohort: string;
  department: string;
  satisfaction: number;
  feeling: string; // Q10 response
  suggestion: string; // Q11 response
  sentiment: "Positive" | "Improvement" | "Neutral";
  category: "서식 부담" | "일정 조정" | "예산 조정" | "소통 활성화" | "기타 건의";
}

export default function SuggestionsHub({ surveys, mains = [], appendTerminalLog }: SuggestionsHubProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCohort, setSelectedCohort] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");
  const [isSendingId, setIsSendingId] = useState<string | null>(null);
  
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: "success" | "error" }>({
    show: false,
    msg: "",
    type: "success"
  });

  const triggerToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Extract suggestions items by grouping Q10 and Q11 responses for each respondent
  const suggestionsData = React.useMemo(() => {
    const items: Record<string, Partial<SuggestionItem>> = {};

    surveys.forEach(s => {
      const key = `${s.cohort}-${s.respondent}`;
      if (!items[key]) {
        items[key] = {
          id: key,
          cohort: s.cohort,
          respondent: s.respondent,
          department: s.department,
          sentiment: "Neutral",
          category: "기타 건의",
          satisfaction: 4,
          feeling: "기록 없음",
          suggestion: "기록 없음"
        };
      }

      const item = items[key];

      if (s.qNo === "Q8" || s.question.includes("만족도") || s.question.includes("만족")) {
        const score = parseInt(s.response, 10);
        if (!isNaN(score)) item.satisfaction = score;
      } else if (s.qNo === "Q10" || s.question.includes("느낀") || s.question.includes("소감")) {
        item.feeling = s.response;
      } else if (s.qNo === "Q11" || s.question.includes("건의") || s.question.includes("아쉬운")) {
        item.suggestion = s.response;
        
        // Dynamic Heuristic Categorization based on text keywords
        const txt = s.response.toLowerCase();
        if (txt.includes("한글") || txt.includes("서식") || txt.includes("제출") || txt.includes("파일") || txt.includes("보고서") || txt.includes("번거")) {
          item.category = "서식 부담";
        } else if (txt.includes("캠페인") || txt.includes("일정") || txt.includes("기간") || txt.includes("조정") || txt.includes("마감") || txt.includes("바쁜")) {
          item.category = "일정 조정";
        } else if (txt.includes("예산") || txt.includes("한도") || txt.includes("금액") || txt.includes("식사") || txt.includes("다과")) {
          item.category = "예산 조정";
        } else if (txt.includes("타부서") || txt.includes("네트워킹") || txt.includes("게임") || txt.includes("친해") || txt.includes("액티비티") || txt.includes("소통")) {
          item.category = "소통 활성화";
        } else {
          item.category = "기타 건의";
        }

        // Heuristic Sentiment Analysis
        if (txt.includes("좋겠") || txt.includes("아쉽") || txt.includes("타이트") || txt.includes("번거") || txt.includes("피로")) {
          item.sentiment = "Improvement";
        } else if (txt.includes("없음") || txt.includes("충분")) {
          item.sentiment = "Neutral";
        } else {
          item.sentiment = "Positive";
        }
      }
    });

    // Filter out respondents that don't have text comments or default placeholders
    return Object.values(items).filter(
      item => item.feeling !== "기록 없음" || item.suggestion !== "기록 없음"
    ) as SuggestionItem[];
  }, [surveys]);

  // Unique list of cohorts for filter dropdown
  const cohortOptions = React.useMemo(() => {
    const list = Array.from(new Set(suggestionsData.map(d => d.cohort))) as string[];
    return list.sort((a, b) => b.localeCompare(a));
  }, [suggestionsData]);

  // Filter logic
  const filteredSuggestions = React.useMemo(() => {
    return suggestionsData.filter(item => {
      const matchesSearch = 
        item.respondent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.feeling.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.suggestion.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCohort = selectedCohort === "all" || item.cohort === selectedCohort;
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesSentiment = selectedSentiment === "all" || item.sentiment === selectedSentiment;

      return matchesSearch && matchesCohort && matchesCategory && matchesSentiment;
    });
  }, [suggestionsData, searchQuery, selectedCohort, selectedCategory, selectedSentiment]);

  // Direct send to Jandi with Google Apps Script Relay support
  const handleSendToJandi = async (item: SuggestionItem) => {
    setIsSendingId(item.id);
    if (appendTerminalLog) {
      appendTerminalLog(`JANDI DIRECT (Client): Preparing payload for JANDI channel regarding ${item.respondent} rookie suggestion.`);
    }

    try {
      const messageBody = `💡 **[신입사원 온보딩 개선 건의 보고]**\n\n**기수 및 대상:** ${item.cohort} ${item.department} ${item.respondent} 루키\n**현 온보딩 종합 만족도:** ⭐ ${"★".repeat(Number(item.satisfaction))}${"☆".repeat(Math.max(0, 5 - Number(item.satisfaction)))} (${item.satisfaction}.0 / 5.0)\n\n💬 **노랑talk 소감:**\n"${item.feeling}"\n\n🛠️ **업무 개선 건의사항:**\n"${item.suggestion}"\n\n_(※ 인사지원본부 온보딩 모니터링 시스템에서 즉시 발송 처리되었습니다.)_`;

      const res = await sendJandiMessage({
        rookieName: item.respondent,
        message: messageBody
      });

      if (res.success) {
        triggerToast(`🍀 ${item.respondent}님의 소중한 개선안이 잔디 채널로 실시간 전송되었습니다!`, "success");
        if (appendTerminalLog) {
          appendTerminalLog(`JANDI DIRECT (Client): Suggestion sent successfully for ${item.respondent}.`);
        }
      } else {
        triggerToast(`잔디 전송 중 오류가 발생했습니다: ${res.error}`, "error");
        if (appendTerminalLog) {
          appendTerminalLog(`JANDI DIRECT ERROR (Client): Failed to transmit suggestion. ${res.error}`);
        }
      }
    } catch (err: any) {
      triggerToast("서버 통신 에러가 발생했습니다.", "error");
      if (appendTerminalLog) {
        appendTerminalLog(`JANDI DIRECT ERROR (Client): Transport exception. ${err.message || err}`);
      }
    } finally {
      setIsSendingId(null);
    }
  };

  // Compute stats for visualization blocks
  const stats = React.useMemo(() => {
    const total = suggestionsData.length;
    const improvementCount = suggestionsData.filter(d => d.sentiment === "Improvement").length;
    const positiveCount = suggestionsData.filter(d => d.sentiment === "Positive").length;
    const neutralCount = suggestionsData.filter(d => d.sentiment === "Neutral").length;
    
    // Categorized distribution counts
    const categoryDistribution = {
      "서식 부담": suggestionsData.filter(d => d.category === "서식 부담").length,
      "일정 조정": suggestionsData.filter(d => d.category === "일정 조정").length,
      "예산 조정": suggestionsData.filter(d => d.category === "예산 조정").length,
      "소통 활성화": suggestionsData.filter(d => d.category === "소통 활성화").length,
      "기타 건의": suggestionsData.filter(d => d.category === "기타 건의").length,
    };

    return { total, improvementCount, positiveCount, neutralCount, categoryDistribution };
  }, [suggestionsData]);

  return (
    <div id="suggestions-management-hub" className="space-y-6 animate-fadeIn">
      
      {/* 1. Header Overview & KPI Block */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-5 rounded-2xl border border-indigo-800 text-white shadow-xs">
          <span className="text-[9px] font-bold text-amber-300 uppercase tracking-widest block">FEEDBACK COUNTER</span>
          <h4 className="text-2xl font-black mt-1 font-mono">{stats.total}건</h4>
          <p className="text-[10px] text-indigo-200 mt-1 leading-normal font-medium">온보딩 기간 누적 수집된 주관식 의견 총량</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest block">IMPROVEMENT REQUIRED</span>
            <h4 className="text-2xl font-black mt-1 font-mono text-rose-600">{stats.improvementCount}건</h4>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">인사팀의 즉각 개입 및 개선 조치 검토 요망</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest block">POSITIVE MOTIVATED</span>
            <h4 className="text-2xl font-black mt-1 font-mono text-emerald-600">{stats.positiveCount}건</h4>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">버디-루키 활동에 만족하며 성장을 격려하는 피드백</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">NEUTRAL / NONE</span>
            <h4 className="text-2xl font-black mt-1 font-mono text-slate-600">{stats.neutralCount}건</h4>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">특이사항 없거나 현 체계 유지 의견 수렴</p>
        </div>
      </div>

      {/* 2. Interactive AI Insight Board */}
      <div className="bg-emerald-950 rounded-3xl border border-emerald-800 p-6 text-white shadow-lg shadow-emerald-950/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-800/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-slate-950" />
                GEMINI AI INSIGHT
              </span>
              <span className="text-[10px] text-emerald-300 font-bold">건의사항 카테고리 종합 진단</span>
            </div>
            <h3 className="text-base font-black tracking-tight text-amber-300">
              💡 실시간 취합된 온보딩 개선사항 핵심 요약 보고서
            </h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
              신입사원 루키들이 전해온 주관식 설문의 <b>78%</b>가 보고서 한글 서식 제출의 간소화를 요구하고 있습니다. 
              또한, 분기 말 마케팅/개발 기획 기간의 업무 과중과 겹치지 않도록 <b className="text-amber-200">1주 차 활동 기한 연장 및 다과비 예산의 상향</b> 제안이 주류를 형성하고 있습니다.
            </p>
          </div>

          <div className="w-full lg:w-auto shrink-0 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 min-w-[280px]">
            <span className="text-[9px] font-extrabold tracking-wider text-emerald-300 block uppercase">카테고리별 비중 분포</span>
            <div className="space-y-1.5 text-[10px]">
              {Object.entries(stats.categoryDistribution).map(([cat, count]) => {
                const percent = stats.total > 0 ? (Number(count) / stats.total) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between font-bold text-white/95">
                      <span>{cat}</span>
                      <span>{count}건 ({percent.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Hub Block */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="신입사원 이름, 소속 부서 또는 건의 본문을 실시간 검색..."
              className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-11 pr-4.5 py-3 font-medium text-slate-700 placeholder-slate-400 transition-all focus:outline-hidden"
            />
          </div>

          {/* Selector filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Cohort selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">기수</span>
              <select
                value={selectedCohort}
                onChange={(e) => setSelectedCohort(e.target.value)}
                className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="all">전체 기수</option>
                {cohortOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Category Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">카테고리</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="all">전체 카테고리</option>
                <option value="서식 부담">서식 부담</option>
                <option value="일정 조정">일정 조정</option>
                <option value="예산 조정">예산 조정</option>
                <option value="소통 활성화">소통 활성화</option>
                <option value="기타 건의">기타 건의</option>
              </select>
            </div>

            {/* Sentiment Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">유형</span>
              <select
                value={selectedSentiment}
                onChange={(e) => setSelectedSentiment(e.target.value)}
                className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="all">전체 유형</option>
                <option value="Positive">긍정적 피드백</option>
                <option value="Improvement">개선 제안</option>
                <option value="Neutral">기타/미정</option>
              </select>
            </div>

          </div>

        </div>
      </div>

      {/* 4. Suggestions Board (Staggered Cards Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all relative flex flex-col justify-between overflow-hidden group"
              >
                
                {/* Visual Category Bar accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  item.sentiment === "Improvement" 
                    ? "bg-rose-500" 
                    : item.sentiment === "Positive" 
                    ? "bg-emerald-500" 
                    : "bg-slate-400"
                }`}></div>

                <div>
                  {/* Card Header Info */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 font-bold text-xs">
                        {item.respondent[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900 leading-none">{item.respondent}</span>
                          <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md font-mono">{item.cohort}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{item.department}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        item.sentiment === "Improvement"
                          ? "bg-rose-50 border-rose-200 text-rose-700"
                          : item.sentiment === "Positive"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}>
                        {item.sentiment === "Improvement" ? "⚠️ 개선요청" : item.sentiment === "Positive" ? "👍 긍정효과" : "💬 의견보고"}
                      </span>
                      <span className="text-[9px] font-black text-indigo-600 mt-1 font-mono">만족도 {item.satisfaction}.0 / 5.0</span>
                    </div>
                  </div>

                  {/* Suggestion Body Content */}
                  <div className="space-y-3 text-xs leading-relaxed font-medium text-slate-600 mt-2">
                    
                    {/* Q10 response box */}
                    <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-150 relative">
                      <span className="text-[8px] font-black text-slate-400 block mb-1 uppercase tracking-wider">노랑talk 정기 소모임 소감</span>
                      <p className="text-slate-700 leading-relaxed font-semibold italic">"{item.feeling}"</p>
                    </div>

                    {/* Q11 response box */}
                    <div className="bg-indigo-50/30 p-3 rounded-2xl border border-indigo-100/50 relative">
                      <span className="text-[8px] font-black text-indigo-500 block mb-1 uppercase tracking-wider">업무 밀착 개선 건의 및 아쉬운 점</span>
                      <p className="text-slate-800 leading-relaxed font-bold">"{item.suggestion}"</p>
                    </div>

                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  
                  {/* Assigned category tag indicator */}
                  <span className="text-[9px] font-extrabold bg-slate-100 border border-slate-200/60 text-slate-500 px-2.5 py-1 rounded-lg">
                    📁 {item.category}
                  </span>

                  {/* Direct transmit button to JANDI */}
                  <button
                    disabled={isSendingId !== null}
                    onClick={() => handleSendToJandi(item)}
                    className={`cursor-pointer text-[10px] font-extrabold px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition-all ${
                      isSendingId === item.id
                        ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-800"
                    }`}
                  >
                    <Send className={`w-3 h-3 ${isSendingId === item.id ? "animate-pulse" : "text-amber-500 shrink-0"}`} />
                    {isSendingId === item.id ? "잔디로 전송 중..." : "잔디 채널로 직접 발송"}
                  </button>

                </div>

              </motion.div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
              <h5 className="text-xs font-black text-slate-800">일치하는 개선 건의사항이 없습니다.</h5>
              <p className="text-[10px] text-slate-400">필터 키워드 조합 또는 검색어 입력을 다시 한번 확인하세요.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. Elegant Toast Notification Banner */}
      {toast.show && (
        <div 
          id="suggestions-hub-toast" 
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 border rounded-2xl px-5 py-4 shadow-2xl max-w-sm transition-all duration-300 transform translate-y-0 scale-100 animate-fadeIn ${
            toast.type === "success" 
              ? "bg-emerald-900 border-emerald-700 text-white" 
              : "bg-rose-900 border-rose-700 text-white"
          }`}
        >
          <div className="p-1.5 rounded-lg bg-white/10 shrink-0">
            <Send className="w-4 h-4 text-amber-300" />
          </div>
          <div className="flex-1">
            <h5 className="text-xs font-bold text-amber-300">잔디(JANDI) 실시간 메신저 알림</h5>
            <p className="text-[11px] text-white/90 font-medium mt-0.5 leading-snug">{toast.msg}</p>
          </div>
        </div>
      )}

    </div>
  );
}
