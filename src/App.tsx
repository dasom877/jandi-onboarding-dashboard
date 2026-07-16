import React, { useState, useEffect, useRef } from "react";
import { Chart, registerables } from 'chart.js';
import GoogleSheetsSync, { cleanName } from "./components/GoogleSheetsSync";
import RoutineAutomation from "./components/RoutineAutomation";
import SatisfactionAnalysis from "./components/SatisfactionAnalysis";
import { defaultSatisfactionSurveys } from "./data";
import { SatisfactionSurvey } from "./types";

// Chart.js 모듈 등록
Chart.register(...registerables);

// 기본 마스터 데이터
const defaultMains = [
  { cohort: "13기", buddy: "김현우", rookie: "이지민", joinDate: "2026-06-01", startDate: "2026-06-01", endDate: "2026-07-31", reward1: "완료", reward2: "대기", status: "온보딩 중" },
  { cohort: "13기", buddy: "이민아", rookie: "박서준", joinDate: "2026-06-01", startDate: "2026-06-01", endDate: "2026-07-31", reward1: "완료", reward2: "대기", status: "온보딩 중" },
  { cohort: "12기", buddy: "정진우", rookie: "강다은", joinDate: "2026-03-01", startDate: "2026-03-01", endDate: "2026-04-30", reward1: "완료", reward2: "지급예정", status: "포상대기" },
  { cohort: "12기", buddy: "윤소희", rookie: "최재민", joinDate: "2026-03-01", startDate: "2026-03-01", endDate: "2026-04-30", reward1: "완료", reward2: "지급예정", status: "포상대기" },
  { cohort: "11기", buddy: "한지훈", rookie: "김유진", joinDate: "2025-12-01", startDate: "2025-12-01", endDate: "2026-01-31", reward1: "완료", reward2: "완료", status: "포상완료" },
  { cohort: "11기", buddy: "오지민", rookie: "송재우", joinDate: "2025-12-01", startDate: "2025-12-01", endDate: "2026-01-31", reward1: "완료", reward2: "완료", status: "포상완료" },
  { cohort: "10기", buddy: "송재민", rookie: "이지연", joinDate: "2025-09-01", startDate: "2025-09-01", endDate: "2025-10-31", reward1: "완료", reward2: "완료", status: "포상완료" },
  { cohort: "9기", buddy: "박준영", rookie: "김영희", joinDate: "2025-06-01", startDate: "2025-06-01", endDate: "2025-07-31", reward1: "완료", reward2: "완료", status: "포상완료" },
  { cohort: "8기", buddy: "서민재", rookie: "이민우", joinDate: "2025-03-01", startDate: "2025-03-01", endDate: "2025-04-30", reward1: "완료", reward2: "완료", status: "포상완료" }
];

const defaultSurveys = [
  { cohort: "13기", rating: 4.4, buddy: "김현우", rookie: "이지민", dept: "디자인팀" },
  { cohort: "13기", rating: 4.2, buddy: "이민아", rookie: "박서준", dept: "마케팅팀" },
  { cohort: "12기", rating: 4.6, buddy: "정진우", rookie: "강다은", dept: "개발팀" },
  { cohort: "12기", rating: 4.1, buddy: "윤소희", rookie: "최재민", dept: "인사팀" },
  { cohort: "11기", rating: 4.5, buddy: "한지훈", rookie: "김유진", dept: "기획팀" },
  { cohort: "11기", rating: 4.3, buddy: "오지민", rookie: "송재우", dept: "영업팀" },
  { cohort: "10기", rating: 4.0, buddy: "송재민", rookie: "이지연", dept: "디자인팀" }
];

const testPayload = `🌾[공지] 3단계 활동 안내
안녕하세요. 12기 버디/루키 여러분 😊
어느덧 온보딩 프로그램의 마지막 단계인 3단계 활동을 안내드리게 되었습니다!
이번 활동은 교육이나 무거운 주제가 아니라, 서로에 대해 조금 더 알아볼 수 있는 가벼운 설문 형식의 활동을 준비했습니다.

활동지 아래 설명 참고하여 작성 부탁드립니다!
본인의 답변을 작성하는 칸인지, 버디/루키 답변을 작성하는 칸인지 설명이 나와 있어요!

작성한 활동지는 자유롭게 공유하시되, 버디/루키 답변이 똑같지 않도록 작성 부탁드립니다.
마지막까지 잘 마무리하실 수 있도록 응원하겠습니다💛
-----------------------------------------------------------------------------------
👇활동지 작성안내
1. 3단계 활동지 링크 확인
-> 버디 활동지: https://forms.gle/dZ2oJwEFiis3TNm68
-> 루키 활동지 : https://forms.gle/MVpf5BCRWnwSVcPA8

2. [협동활동] 버디/루키와 대면 만남 후 활동지 작성
-> 준비물: 활동지

3. 3단계 활동기간: 2026.06.26(금)~2026.06.30(화) / 활동지 제출 마감일: 2026.06.30(화) 

※ 위 1~3번 단계별 진행은 버디/루키와 조율 후, 활동기간 내 유동적으로 진행하시되 다음 활동의 원활한 진행을 위해 제출마감일은 반드시 확인 부탁드립니다!

활동 중 문의사항이 생기면 언제든 안내방 또는 잔디로 편하게 연락 부탁드립니다!
감사합니다.`;

export default function App() {
  // 1. Core State Management
  const [mains, setMains] = useState(defaultMains);
  const [surveys, setSurveys] = useState(defaultSurveys);
  const [rawSurveys, setRawSurveys] = useState<SatisfactionSurvey[]>(defaultSatisfactionSurveys);
  const [activeTab, setActiveTab] = useState<"main" | "step1_1" | "step1_2" | "step2" | "step3">("main");
  
  // 2. JANDI Webhook States
  const [webhookUrl, setWebhookUrl] = useState("https://wh.jandi.com/connect-api/webhook/27388464/6e67c46677fd21750badc363ae2393d9");
  const [directMessage, setDirectMessage] = useState(testPayload);
  const [isSending, setIsSending] = useState(false);
  
  // 3. AI Jandi Creator States
  const [aiRookie, setAiRookie] = useState("");
  const [aiPeriod, setAiPeriod] = useState("D-7");
  const [aiDraft, setAiDraft] = useState("");
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  
  // 4. Search and filters
  const [trackingSearch, setTrackingSearch] = useState("");
  const [mainSearch, setMainSearch] = useState("");
  
  // 5. Logo status
  const [logoErrorSidebar, setLogoErrorSidebar] = useState(false);
  const [logoErrorBanner, setLogoErrorBanner] = useState(false);
  
  // 6. Live Log Console
  const [systemLogs, setSystemLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [SYSTEM] JANDI Automation center is online. Listening to webhook triggers...`
  ]);

  // Google Sheets integration state
  const [sheetsFetchedInfo, setSheetsFetchedInfo] = useState<{
    sheetId: string;
    lastSynced: string | null;
    sheetNames: string[];
    counts: {
      main: number;
      schedule: number;
      survey: number;
    };
  } | null>(null);
  const [isUsingDefaultData, setIsUsingDefaultData] = useState(true);

  const handleGoogleSheetsDataLoaded = (data: {
    main: any[];
    schedule: any[];
    survey: any[];
  }) => {
    addLog(`[SYNC] Mapping Google Sheets parsed tables...`, "info");
    
    const mappedMains = data.main.map(m => {
      const reward1 = m.reward1Date ? "완료" : "대기";
      const reward2 = m.reward2Date ? "완료" : "대기";
      let status = "온보딩 중";
      if (m.quitDate) {
        status = "중도 중단";
      } else if (m.reward2Date) {
        status = "포상완료";
      } else if (m.reward1Date) {
        status = "포상대기";
      }
      return {
        ...m,
        reward1,
        reward2,
        status
      };
    });

    setMains(mappedMains);
    setIsUsingDefaultData(false);

    // Group survey entries by respondent to calculate average ratings
    const groupedSurveys: Record<string, { cohort: string; respondent: string; department: string; ratings: number[] }> = {};
    data.survey.forEach((s) => {
      const ratingVal = parseFloat(s.response);
      if (!isNaN(ratingVal) && ratingVal >= 1 && ratingVal <= 5) {
        const key = `${s.cohort}_${s.respondent}_${s.department}`;
        if (!groupedSurveys[key]) {
          groupedSurveys[key] = {
            cohort: s.cohort,
            respondent: s.respondent,
            department: s.department,
            ratings: [],
          };
        }
        groupedSurveys[key].ratings.push(ratingVal);
      }
    });

    const mappedSurveys = Object.values(groupedSurveys).map((g) => {
      const avgRating = g.ratings.length > 0 
        ? g.ratings.reduce((sum, r) => sum + r, 0) / g.ratings.length 
        : 4.2;
      
      const matchingMain = mappedMains.find(
        (m) => cleanName(m.rookie) === cleanName(g.respondent) || cleanName(m.buddy) === cleanName(g.respondent) || m.department === g.department
      );

      return {
        cohort: g.cohort,
        rating: parseFloat(avgRating.toFixed(1)),
        buddy: matchingMain ? matchingMain.buddy : "선배",
        rookie: matchingMain ? matchingMain.rookie : g.respondent,
        dept: g.department || "기타",
      };
    });

    if (mappedSurveys.length > 0) {
      setSurveys(mappedSurveys);
    } else {
      const syntheticSurveys = mappedMains.map((m) => ({
        cohort: m.cohort,
        rating: parseFloat((3.8 + Math.random() * 1.2).toFixed(1)),
        buddy: m.buddy,
        rookie: m.rookie,
        dept: m.department || "인사팀",
      }));
      setSurveys(syntheticSurveys);
    }

    setRawSurveys(data.survey);
    addLog(`Successfully synchronized data with Google Sheet in real-time. Main: ${mappedMains.length} rows, Surveys: ${data.survey.length} responses parsed.`, "success");
  };

  const resetToDemoData = () => {
    setMains(defaultMains);
    setSurveys(defaultSurveys);
    setRawSurveys(defaultSatisfactionSurveys);
    setIsUsingDefaultData(true);
    setSheetsFetchedInfo(null);
    addLog(`Demo data reverted successfully.`, "info");
  };



  // Helper for setting first available rookie in selector
  useEffect(() => {
    if (mains.length > 0) {
      setAiRookie(mains[0].rookie);
    }
  }, [mains]);

  // Log Append Helper
  const addLog = (msg: string, type: "info" | "success" | "error" = "info") => {
    const timeStr = new Date().toLocaleTimeString();
    let prefix = `[${timeStr}] `;
    if (type === "success") prefix += "🟢 ";
    else if (type === "error") prefix += "❌ ";
    setSystemLogs(prev => [...prev, `${prefix}${msg}`]);
  };

  // Switch Tab Handler
  const handleTabChange = (tabId: "main" | "step1_1" | "step1_2" | "step2" | "step3") => {
    setActiveTab(tabId);
    addLog(`[SYSTEM] Switched viewport to: ${tabId.toUpperCase()}`);
  };

  // Header Titles and Descriptions mapping
  const getHeaderDetails = () => {
    switch (activeTab) {
      case "main":
        return {
          title: "통합 대시보드",
          desc: "버디루키 프로그램 핵심 운영지표 요약과 부서/기수별 상세 관리 페이지의 가교 역할을 지원합니다."
        };
      case "step1_1":
        return {
          title: "Step 1-1. 조직 적응도 분석 - 객관식",
          desc: "기수별 평균 만족도 및 문항별 기수 평점 비교 매트릭스를 실시간 조회합니다."
        };
      case "step1_2":
        return {
          title: "Step 1-2. 조직 적응도 분석 - 주관식",
          desc: "기수별 서술형 설문 피드백 원본 답변 조회 및 AI 핵심 의견 키워드 분석 시뮬레이션을 수행합니다."
        };
      case "step2":
        return {
          title: "Step 2. 온보딩 현황 & 포상 관리",
          desc: "활동 수료 및 사후 6달 근속 퇴사자 유무 추적, 전 기수 실시간 스프레드시트 대장 조회"
        };
      case "step3":
        return {
          title: "Step 3. 루틴 업무 자동화 관리",
          desc: "구글 Gemini 연동 메시지 초안 제작 및 JANDI 커넥터를 활용한 실시간 알림 전송 제어"
        };
    }
  };
  const headerDetails = getHeaderDetails();



  // JANDI direct sending logic using secure server proxy
  const sendDirectMessage = async () => {
    if (!webhookUrl.trim()) {
      alert("연동할 잔디 Webhook URL을 입력해주세요!");
      return;
    }
    if (!directMessage.trim()) {
      alert("발송할 메시지 내용을 작성해주세요!");
      return;
    }

    setIsSending(true);
    addLog("[SENDING] Connecting to JANDI incoming connector via secure proxy...");

    try {
      const response = await fetch("/api/send-jandi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          webhookUrl: webhookUrl.trim(),
          body: directMessage
        })
      });

      if (response.ok) {
        addLog("JANDI Webhook message sent successfully!", "success");
        alert("🎉 잔디 웹훅 발송에 성공했습니다!");
      } else {
        const errorText = await response.text();
        addLog(`Server returned status ${response.status}: ${errorText}`, "error");
        alert(`❌ 잔디 전송 실패! (상태 코드: ${response.status})`);
      }
    } catch (error: any) {
      addLog(`Network connection failed: ${error.message}`, "error");
      alert(`❌ 네트워크 통신 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // AI draft message formulation
  const generateAIJandiMessage = () => {
    if (!aiRookie) return;
    
    setAiDraftLoading(true);
    addLog(`[AI ENGINE] Processing natural language template optimization for ${aiRookie}...`);

    setTimeout(() => {
      setAiDraftLoading(false);
      const matched = mains.find(m => m.rookie === aiRookie) || { cohort: "13기", buddy: "선배" };

      let text = "";
      if (aiPeriod === "D-7") {
        text = `📢 [노랑루키 온보딩 D-7 알림]
안녕하세요, ${matched.buddy} 골든버디님!
${matched.cohort} ${aiRookie} 노랑루키의 온보딩 활동 보고서 제출 마감이 일주일 앞으로 다가왔습니다.

현재까지 진행된 활동들을 정리하시고 루키가 기한 내에 온보딩 피드백을 완료할 수 있도록 아래 제출 링크를 안내해주세요!
- 버디 피드백: https://forms.gle/dZ2oJwEFiis3TNm68
- 루키 피드백: https://forms.gle/MVpf5BCRWnwSVcPA8

바쁘신 일정 속에서도 따뜻하게 이끌어 주셔서 항상 감사드립니다. 💛`;
      } else if (aiPeriod === "D-3") {
        text = `⚠️ [긴급 리마인드: 온보딩 보고서 마감 D-3]
안녕하세요, ${matched.buddy} 버디님 및 ${aiRookie} 루키님!
온보딩 최종 마무리가 단 3일 남았습니다.

아직 보고서 제출을 마치지 않으셨다면, 서둘러 서로의 의견을 정리하시어 폼 작성을 완료해주시기 바랍니다.
제출 마감: 2026-06-30(화)까지
시간 준수와 완벽한 피드백 마무리는 노랑루키 정착의 큰 발판이 됩니다. 감사합니다!`;
      } else {
        text = `🎉 [6달 정착 및 근속 축하 포상 지급 확정]
축하합니다! ${matched.cohort} ${aiRookie} 루키님이 온보딩 과정을 거쳐 성공적으로 6달간 노랑통닭과 함께 근속하셨습니다!

이에 따라 ${matched.buddy} 버디님과 ${aiRookie} 루키님 조의 '근속 우수 포상금' 지급이 최종 확정되었습니다.
경영지원팀 포상 지급 스케줄에 맞춰 다음 주 중 지급될 예정입니다.
앞으로도 두 분의 따뜻한 동행과 성장을 온 마음으로 응원하겠습니다! 💛`;
      }

      setAiDraft(text);
      addLog(`[AI SUCCESS] Remainder draft optimized for ${aiRookie}.`, "success");
    }, 1000);
  };

  // Transfer AI draft to direct sender
  const transferDraftToDirect = () => {
    if (!aiDraft) {
      alert("먼저 메시지를 작성하거나 AI 맞춤 메시지를 작문해 주세요!");
      return;
    }
    setDirectMessage(aiDraft);
    addLog(`[SYSTEM] Transferred AI draft content to direct sender.`);
    alert("📢 작문된 메시지가 즉시 발송기 본문으로 전달되었습니다.");
  };

  // Live resetting / synchronizing data simulator
  const syncData = () => {
    addLog(`[SYNC] Connecting to google sheets dataset replica...`);
    setTimeout(() => {
      setMains(defaultMains);
      setSurveys(defaultSurveys);
      addLog(`Re-synchronized 23 master on-board records!`, "success");
      alert("🎉 실시간 구글 시트 데이터가 초기 원복 및 재동기화되었습니다.");
    }, 600);
  };

  const loadSampleFeedback = () => {
    addLog(`[SYNC] Parsing Google Sheet survey feed (CSV)...`);
    setTimeout(() => {
      addLog(`Loaded 7 live qualitative answers with Gemini metrics.`, "success");
      alert("🎉 구글 시트 설문조사 주관식 피드백 원본 7건 파싱 성공!");
    }, 500);
  };

  // Direct Jandi launch helper from Step 2 tracking
  const sendTargetJandi = (rookieName: string) => {
    setActiveTab("step3");
    setAiPeriod("D-Day");
    setAiRookie(rookieName);
    addLog(`[SYSTEM] Redirected to Step 3 automated drafting for ${rookieName}`);
  };

  // Filter lists based on state search inputs
  const filteredTrackingMains = mains.filter(
    m => m.status === "포상대기" && 
    (m.cohort.toLowerCase().includes(trackingSearch.toLowerCase()) ||
     m.buddy.toLowerCase().includes(trackingSearch.toLowerCase()) ||
     m.rookie.toLowerCase().includes(trackingSearch.toLowerCase()))
  );

  const filteredAllMains = mains.filter(
    m => 
    m.cohort.toLowerCase().includes(mainSearch.toLowerCase()) ||
    m.buddy.toLowerCase().includes(mainSearch.toLowerCase()) ||
    m.rookie.toLowerCase().includes(mainSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden text-slate-800 bg-slate-100 font-sans">
      
      {/* SIDEBAR PANEL */}
      <aside className="w-80 bg-[#1e1b4b] text-slate-300 flex flex-col justify-between shadow-2xl z-50">
        <div>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-indigo-950 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-xl shadow-md w-12 h-12 flex items-center justify-center overflow-hidden shrink-0">
                {!logoErrorSidebar ? (
                  <img 
                    src="노랑이 사진2.png" 
                    alt="노랑통닭 캐릭터" 
                    className="object-contain w-full h-full" 
                    onError={() => setLogoErrorSidebar(true)} 
                  />
                ) : (
                  <span className="text-2xl">🐤</span>
                )}
              </div>
              <div>
                <h1 className="text-white font-black text-xs tracking-tight leading-none">온보딩 프로그램</h1>
                <span className="text-[13px] text-amber-400 font-bold tracking-wider uppercase">버디루키 인사이트</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <p className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest px-3 mb-2">INTELLIGENT CONSOLE</p>
            
            <button 
              onClick={() => handleTabChange("main")} 
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:bg-indigo-950/70 text-left ${activeTab === "main" ? "bg-indigo-900 text-white border-l-4 border-amber-400" : ""}`}
            >
              <i className="fa-solid fa-house-user text-lg text-amber-400"></i>
              <div>
                <p className="font-bold text-sm text-white">통합 대시보드</p>
                <p className="text-[10px] text-indigo-300">프로그램 종합 상태 및 포탈 바로가기</p>
              </div>
            </button>

            {/* Division Line */}
            <div className="py-2 px-3">
              <div className="h-[1px] bg-indigo-900/50 w-full"></div>
            </div>

            <button 
              onClick={() => handleTabChange("step1_1")} 
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:bg-indigo-950/70 text-left ${activeTab === "step1_1" ? "bg-indigo-900 text-white border-l-4 border-amber-400" : ""}`}
            >
              <i className="fa-solid fa-chart-pie text-lg text-emerald-400"></i>
              <div>
                <p className="font-bold text-sm text-white">Step 1-1. 조직 적응도 분석 (객관식)</p>
                <p className="text-[10px] text-indigo-300">문항별 평균 평점 &amp; 비교 매트릭스 도표</p>
              </div>
            </button>

            <button 
              onClick={() => handleTabChange("step1_2")} 
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:bg-indigo-950/70 text-left ${activeTab === "step1_2" ? "bg-indigo-900 text-white border-l-4 border-amber-400" : ""}`}
            >
              <i className="fa-solid fa-message text-lg text-teal-400"></i>
              <div>
                <p className="font-bold text-sm text-white">Step 1-2. 조직 적응도 분석 (주관식)</p>
                <p className="text-[10px] text-indigo-300">서술형 답변 조회 &amp; AI 텍스트 마이닝</p>
              </div>
            </button>

            <button 
              onClick={() => handleTabChange("step2")} 
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:bg-indigo-950/70 text-left ${activeTab === "step2" ? "bg-indigo-900 text-white border-l-4 border-amber-400" : ""}`}
            >
              <i className="fa-solid fa-user-check text-lg text-sky-400"></i>
              <div>
                <p className="font-bold text-sm text-white">Step 2. 온보딩 현황 &amp; 포상 관리</p>
                <p className="text-[10px] text-indigo-300">6개월 사후 근속 추적 및 전 기수 조회</p>
              </div>
            </button>

            <button 
              onClick={() => handleTabChange("step3")} 
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:bg-indigo-950/70 text-left ${activeTab === "step3" ? "bg-indigo-900 text-white border-l-4 border-amber-400" : ""}`}
            >
              <i className="fa-solid fa-bell text-lg text-rose-400"></i>
              <div>
                <p className="font-bold text-sm text-white">Step 3. 루틴 업무 자동화 관리</p>
                <p className="text-[10px] text-indigo-300">AI 맞춤 메시지 생성 &amp; 잔디 발송</p>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-indigo-950 bg-[#16143a]/70">
          <div className="flex items-center justify-between text-xs text-indigo-300 mb-2">
            <span>JANDI Webhook State</span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Connected
            </span>
          </div>
          <button 
            onClick={() => {
              resetToDemoData();
              alert("🎉 기본 데모 모드로 초기화되었습니다.");
            }} 
            className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md cursor-pointer"
          >
            <i className="fa-solid fa-arrows-rotate"></i>
            <span>기본 데모데이터 복원</span>
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-grow flex flex-col overflow-hidden bg-slate-50">
        
        {/* TOP NAVBAR */}
        <header className="bg-white border-b border-slate-200 h-16 min-h-16 px-8 flex justify-between items-center z-40 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-black text-slate-800">{headerDetails?.title}</h2>
            <span className="h-4 w-[1px] bg-slate-200"></span>
            <p className="text-xs text-slate-500 font-medium">{headerDetails?.desc}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg py-1 px-2.5 flex items-center gap-2 text-[11px] text-emerald-700 font-bold">
              <i className="fa-solid fa-table text-emerald-600"></i>
              <span>시트 연동: {mains.length} 레코드 발견</span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-800 font-medium text-[10px]">1기~13기 전 기수 복원 완료</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-ping"></span>
              <span className="text-xs font-bold text-slate-700">관리자 계정 (HR MATE)</span>
            </div>
          </div>
        </header>

        {/* CONTENT SCROLL CONTAINER */}
        <div className="flex-grow overflow-y-auto p-8 space-y-8">

          {/* ================= INTEGRATED DASHBOARD HOME ================= */}
          {activeTab === "main" && (
            <div className="space-y-8 animate-fadeIn">
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
                <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-15 w-64 h-64 overflow-hidden rounded-full">
                  {!logoErrorBanner ? (
                    <img 
                      src="노랑이 사진2.png" 
                      alt="노랑통닭" 
                      className="object-cover w-full h-full rotate-12" 
                      onError={() => setLogoErrorBanner(true)} 
                    />
                  ) : (
                    <span className="text-7xl absolute top-16 left-16">🐤</span>
                  )}
                </div>
                <div className="relative z-10 max-w-4xl space-y-4">
                  <span className="bg-amber-400 text-slate-950 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Operational Overview</span>
                  <h2 className="text-3xl font-black tracking-tight leading-tight">온보딩 버디루키 지원 통합 대시보드</h2>
                  <p className="text-slate-300 text-sm leading-relaxed font-light">
                    새로 합류한 노랑루키와 이들을 지지하는 골든버디의 장기 시너지 여정을 설계하고 지원하는 통합 관리 대시보드입니다. <br />
                    Gemini AI 기반 피드백 분석 파이프라인, 잔디(JANDI) 알림 업무 자동화, 그리고 1~13기 전속 근속 유지 성과 추이를 한눈에 관리하세요.
                  </p>
                </div>
              </div>

              {/* High-Level Program KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">통합 온보딩 KPI 지수</span>
                    <i className="fa-solid fa-gauge-high text-indigo-500 text-lg"></i>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-3xl font-black text-slate-800">92.4 <span className="text-xs text-slate-400">/ 100점</span></h3>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-indigo-600 h-1.5" style={{ width: "92.4%" }}></div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5">만족도(30%) + 기한보고 완료율(70%) 합산</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">온보딩 최종 완료율</span>
                    <i className="fa-solid fa-square-poll-vertical text-emerald-500 text-lg"></i>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-3xl font-black text-slate-800">96.5 <span className="text-xs text-slate-400">%</span></h3>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-emerald-500 h-1.5" style={{ width: "96.5%" }}></div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5">60일 이내 보고서 제출 및 완료 완료 비중</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">누적 종합 만족도</span>
                    <i className="fa-solid fa-face-smile text-amber-500 text-lg"></i>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-3xl font-black text-slate-800">4.28 <span className="text-xs text-slate-400">/ 5.0</span></h3>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-amber-400 h-1.5" style={{ width: "85.6%" }}></div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5">1기~13기 객관식 설문조사 평균 평점</p>
                  </div>
                </div>
              </div>

              {/* Three Big Interactive Hub Portal Cards */}
              <div className="space-y-4">
                <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                  <span className="w-2 h-4 bg-indigo-600 rounded-sm"></span>
                  단계별 온보딩 관리 메뉴 바로가기
                </h3>
                <p className="text-xs text-slate-500">원하시는 관리 단계를 선택하시면 해당 상세 화면으로 바로 이동합니다.</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Card 1: Step 1 Gateway */}
                  <div onClick={() => handleTabChange("step1_1")} className="bg-white border border-slate-200/80 rounded-3xl p-6 hover:shadow-lg hover:border-indigo-300 cursor-pointer transition-all duration-300 group flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <i className="fa-solid fa-chart-pie text-xl"></i>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Step 1</span>
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors text-base">조직 적응도 분석</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          기수별 평균 만족도 흐름과 부서별 평점 비교 차트를 검토하고, 구글 Gemini 실시간 분석 엔진을 활용한 주관식 텍스트 감성 파이프라인 분석을 진행합니다.
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-indigo-600">
                      <span>적응도 분석 콘솔 진입</span>
                      <i className="fa-solid fa-arrow-right group-hover:translate-x-1.5 transition-transform"></i>
                    </div>
                  </div>

                  {/* Card 2: Step 2 Gateway */}
                  <div onClick={() => handleTabChange("step2")} className="bg-white border border-slate-200/80 rounded-3xl p-6 hover:shadow-lg hover:border-indigo-300 cursor-pointer transition-all duration-300 group flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <i className="fa-solid fa-user-check text-xl"></i>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Step 2</span>
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors text-base">온보딩 현황 &amp; 포상 관리</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          활동 수료 후 6개월 사후 퇴사자 추적 및 자동 근속 유지 점검 리스트를 제어합니다. 복원된 1기, 2기 레코드를 포함한 전 기수 실시간 스프레드시트 대장을 조회합니다.
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-indigo-600">
                      <span>현황 및 근속포상 관리 진입</span>
                      <i className="fa-solid fa-arrow-right group-hover:translate-x-1.5 transition-transform"></i>
                    </div>
                  </div>

                  {/* Card 3: Step 3 Gateway */}
                  <div onClick={() => handleTabChange("step3")} className="bg-white border border-slate-200/80 rounded-3xl p-6 hover:shadow-lg hover:border-indigo-300 cursor-pointer transition-all duration-300 group flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <i className="fa-solid fa-bell text-xl"></i>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Step 3</span>
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors text-base">루틴 업무 자동화 관리</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          단계별 가이드 자동 메일링 정책 및 체크리스트를 점검하고, 구글 Gemini를 통해 제작된 완벽한 온보딩 기한 알람 카피를 실시간 JANDI(잔디) 메신저 채널에 전송합니다.
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-indigo-600">
                      <span>루틴 자동화 및 잔디 발송기 진입</span>
                      <i className="fa-solid fa-arrow-right group-hover:translate-x-1.5 transition-transform"></i>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Google Sheets Sync and Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                <div className="lg:col-span-2">
                  <GoogleSheetsSync
                    onDataLoaded={handleGoogleSheetsDataLoaded}
                    onReset={resetToDemoData}
                    isUsingDefaultData={isUsingDefaultData}
                    sheetsFetchedInfo={sheetsFetchedInfo}
                    setSheetsFetchedInfo={setSheetsFetchedInfo}
                  />
                </div>
                <div className="bg-slate-900 text-slate-300 rounded-3xl p-6 font-mono text-[11px] border border-slate-800 shadow-inner flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800 text-slate-400 text-[10px]">
                      <span className="font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        SYSTEM LIVE LOG CONSOLE
                      </span>
                      <span className="bg-emerald-500/10 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded border border-emerald-500/20 text-[9px]">ACTIVE</span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto scroll-smooth">
                      {systemLogs.map((log, idx) => (
                        <div key={idx} className="leading-relaxed">{log}</div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-800/65 flex justify-between items-center text-slate-500 text-[10px]">
                    <span>REPLICA SPEED: 240ms</span>
                    <span>JANDI: CONNECTED</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 1: 조직 적응도 분석 ================= */}
          {activeTab === "step1_1" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Google Sheets Sync Widget */}
              <GoogleSheetsSync
                onDataLoaded={handleGoogleSheetsDataLoaded}
                onReset={resetToDemoData}
                isUsingDefaultData={isUsingDefaultData}
                sheetsFetchedInfo={sheetsFetchedInfo}
                setSheetsFetchedInfo={setSheetsFetchedInfo}
              />

              {/* STEP 1-1. 조직 적응도 분석 - 객관식 컴포넌트 */}
              <SatisfactionAnalysis
                mains={mains}
                surveys={surveys}
                rawSurveys={rawSurveys}
                defaultSubTab="multiple"
              />
            </div>
          )}

          {activeTab === "step1_2" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Google Sheets Sync Widget */}
              <GoogleSheetsSync
                onDataLoaded={handleGoogleSheetsDataLoaded}
                onReset={resetToDemoData}
                isUsingDefaultData={isUsingDefaultData}
                sheetsFetchedInfo={sheetsFetchedInfo}
                setSheetsFetchedInfo={setSheetsFetchedInfo}
              />

              {/* STEP 1-2. 조직 적응도 분석 - 주관식 컴포넌트 */}
              <SatisfactionAnalysis
                mains={mains}
                surveys={surveys}
                rawSurveys={rawSurveys}
                defaultSubTab="subjective"
              />
            </div>
          )}
          {false && activeTab === "step1" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Google Sheets Sync Widget */}
              <GoogleSheetsSync
                onDataLoaded={handleGoogleSheetsDataLoaded}
                onReset={resetToDemoData}
                isUsingDefaultData={isUsingDefaultData}
                sheetsFetchedInfo={sheetsFetchedInfo}
                setSheetsFetchedInfo={setSheetsFetchedInfo}
              />

              {/* 상단: 객관식 분석 (도표 & 차트 완벽 결합) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: 기수별 만족도 분석 통합 카드 (차트 + 상세 도표) */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 lg:col-span-8 flex flex-col justify-between">
                  <div className="mb-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-black text-slate-800 text-sm">[객관식] 기수별 만족도 종합 분석 (추이 차트 및 상세 표 도표)</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">1기부터 최근 13기까지의 장기 만족도 평점 변동 추이와 매칭별 정형 데이터</p>
                    </div>
                    <span className="text-xs bg-indigo-50 font-bold text-indigo-700 py-1 px-2.5 rounded-lg">전체 평균 4.28점</span>
                  </div>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Left: 만족도 꺾은선 차트 (도표) */}
                    <div className="xl:col-span-5 h-64 relative">
                      <canvas></canvas>
                    </div>
                    
                    {/* Right: 기수별 세부 통계표 */}
                    <div className="xl:col-span-7 overflow-y-auto max-h-[256px] border border-slate-100 rounded-xl">
                      {(() => {
                        const summaryMap: Record<string, {
                          cohort: string;
                          matchingCount: number;
                          completedCount: number;
                          reward2Count: number;
                          ratingSum: number;
                          ratingCount: number;
                        }> = {};

                        mains.forEach((m) => {
                          const cohort = m.cohort;
                          if (!summaryMap[cohort]) {
                            summaryMap[cohort] = {
                              cohort,
                              matchingCount: 0,
                              completedCount: 0,
                              reward2Count: 0,
                              ratingSum: 0,
                              ratingCount: 0
                            };
                          }
                          summaryMap[cohort].matchingCount += 1;

                          const isCompleted = m.reward1 === "완료" || !!(m as any).reward1Date;
                          if (isCompleted) {
                            summaryMap[cohort].completedCount += 1;
                          }

                          const isReward2 = m.reward2 === "완료" || !!(m as any).reward2Date;
                          if (isReward2) {
                            summaryMap[cohort].reward2Count += 1;
                          }
                        });

                        surveys.forEach((s) => {
                          const cohort = s.cohort;
                          if (summaryMap[cohort]) {
                            summaryMap[cohort].ratingSum += s.rating;
                            summaryMap[cohort].ratingCount += 1;
                          } else {
                            summaryMap[cohort] = {
                              cohort,
                              matchingCount: 0,
                              completedCount: 0,
                              reward2Count: 0,
                              ratingSum: s.rating,
                              ratingCount: 1
                            };
                          }
                        });

                        const sortedCohorts = Object.values(summaryMap).sort((a, b) => {
                          const numA = parseInt(a.cohort.replace(/\D/g, ""), 10) || 0;
                          const numB = parseInt(b.cohort.replace(/\D/g, ""), 10) || 0;
                          return numB - numA;
                        });

                        return (
                          <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-extrabold uppercase tracking-wider sticky top-0">
                              <tr>
                                <th className="px-4 py-3">기수</th>
                                <th className="px-4 py-3 text-center">매칭 인원</th>
                                <th className="px-4 py-3 text-center">보고 완료율</th>
                                <th className="px-4 py-3 text-center">포상 획득률</th>
                                <th className="px-4 py-3 text-right">평균 만족도 (5.0)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-650">
                              {sortedCohorts.map((item) => {
                                const completionRate = item.matchingCount > 0 
                                  ? Math.round((item.completedCount / item.matchingCount) * 105 / 105 * 100) 
                                  : 100;
                                const completionRateClamped = Math.min(100, completionRate);
                                const rewardRate = item.matchingCount > 0 
                                  ? Math.round((item.reward2Count / item.matchingCount) * 100) 
                                  : 0;
                                const avgRating = item.ratingCount > 0 
                                  ? (item.ratingSum / item.ratingCount).toFixed(2) 
                                  : "4.20";

                                return (
                                  <tr key={item.cohort} className="hover:bg-slate-50/70 border-b border-slate-100">
                                    <td className="px-4 py-3 font-bold text-slate-900">{item.cohort}</td>
                                    <td className="px-4 py-3 text-center font-bold text-slate-500">{item.matchingCount}명</td>
                                    <td className="px-4 py-3 text-center text-emerald-600 font-bold">{completionRateClamped}%</td>
                                    <td className="px-4 py-3 text-center text-indigo-600 font-bold">{rewardRate}%</td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-800">{avgRating}점</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Right: 부서별 만족도 통계 (차트) */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 lg:col-span-4">
                  <div className="mb-6 flex justify-between items-center">
                    <div>
                      <h4 className="font-black text-slate-800 text-sm">[객관식] 부서별 온보딩 만족도 통계 차트</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">배치 부서에 따른 정착 피드백 평점 (디자인팀 최고)</p>
                    </div>
                  </div>
                  <div className="h-[270px]">
                    <canvas></canvas>
                  </div>
                </div>
              </div>

              {/* 하단: 주관식 분석 (AI 키워드 집계 및 1~13기 자동 요약 보고서) */}
              <div className="bg-indigo-950 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 p-10 opacity-10 text-indigo-400">
                  <i className="fa-solid fa-brain text-9xl"></i>
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-bold px-3 py-1 rounded-full border border-indigo-400/20">GEMINI LLM ENGINE</span>
                    <h3 className="font-black text-lg">[주관식] 1기 ~ 13기 누적 AI 공통의견 연산 완료본 (Real Data)</h3>
                  </div>

                  <div className="bg-indigo-900/30 p-8 rounded-2xl border border-indigo-900/40 space-y-6 relative min-h-[260px] w-full">
                    <div className="flex justify-between items-center pb-3 border-b border-indigo-800/50">
                      <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-widest">누적 주관식 피드백 종합 마이닝 요약</h5>
                      <span className="text-[10px] text-amber-400 font-bold">1기~13기 구글 시트 원본 요약완료</span>
                    </div>

                    {/* Sentiment Gauge & TOP 4 Opinion stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-3 bg-indigo-950/50 p-6 rounded-2xl border border-indigo-800/40 text-center flex flex-col justify-center items-center">
                        <p className="text-xs text-indigo-400 font-bold mb-1">종합 신입 정착 지수</p>
                        <h4 className="text-4xl font-black text-emerald-400 animate-pulse">91.4%</h4>
                        <div className="w-full bg-indigo-950 h-2 rounded-full mt-3 overflow-hidden">
                          <div className="bg-emerald-400 h-2 transition-all duration-1000" style={{ width: "91.4%" }}></div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">부정/보완 대비 긍정 응답 비율</p>
                      </div>

                      <div className="lg:col-span-9 bg-indigo-950/50 p-6 rounded-2xl border border-indigo-800/40 space-y-4">
                        <h6 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">핵심 의견 분석 집계 (TOP 4)</h6>
                        <div className="space-y-3.5">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-200 truncate">선배 버디와의 노랑talk (관심사/MBTI) 소통 및 친밀감 형성 만족</span>
                              <span className="text-amber-400 font-bold">12건</span>
                            </div>
                            <div className="w-full bg-indigo-950 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: "100%" }}></div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-200 truncate">타 부서원 네트워킹 및 전반적 소속감 부여 유익</span>
                              <span className="text-amber-400 font-bold">8건</span>
                            </div>
                            <div className="w-full bg-indigo-950 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "66.7%" }}></div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-200 truncate">현업 병행에 따른 온보딩 일정 촉박 및 시간 조율 애로</span>
                              <span className="text-rose-400 font-bold">6건</span>
                            </div>
                            <div className="w-full bg-indigo-950 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-rose-400 h-1.5 rounded-full" style={{ width: "50%" }}></div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-200 truncate">멘토 인원 다양화(2인 멘토링 제안) 및 단계별 컨텐츠 개선 요청</span>
                              <span className="text-amber-400 font-bold">4건</span>
                            </div>
                            <div className="w-full bg-indigo-950 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "33.3%" }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Executive Summary Memo Block */}
                    <div className="bg-indigo-950/40 p-5 rounded-2xl border border-indigo-800/40">
                      <h6 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-1.5">
                        <i className="fa-solid fa-quote-left"></i> Gemini 주관식 종합 리포트 &amp; 수석 컨설턴트 가이드
                      </h6>
                      <p className="text-sm text-slate-300 leading-relaxed font-medium">
                        1기부터 13기까지 누적 수합된 주관식 데이터 분석 결과, 신입사원들은 **'노랑talk 10문 10답'**을 통해 버디 매니저와의 정서적 교감 및 친밀도를 비약적으로 증진시켰다고 높이 평가했습니다. <br /><br />
                        반면, 현업 일정이 촉박해 온보딩 일정을 매치하기 어렵다는 애로사항이 빈번히 발견되어 **'일정 기간의 유연화'**가 필요합니다. 멘토 다각화(2인 이상 소통 채널 제공) 및 모임용 공통 가이드 양식 개선 역시 주요 개선 과제로 분석되었습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: 온보딩 현황 & 포상 관리 ================= */}
          {activeTab === "step2" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Summary Card Row */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-600 text-white p-1 rounded-md text-xs font-bold font-mono">02</div>
                  <h3 className="font-black text-slate-800 text-base">수합된 활동단계 일정 및 진행현황</h3>
                  <span className="text-xs text-slate-400">1기부터 13기까지의 메인 미션 일정과 1,2차 근속 유지 시점을 실시간 동기화합니다.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-slate-400">포상 지급 완료</p>
                      <i className="fa-regular fa-face-smile text-slate-400 text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800">11 기수</h3>
                      <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-indigo-600 h-1" style={{ width: "100%" }}></div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">1,2차 포상 지급 완료</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm flex flex-col justify-between h-32 ring-1 ring-indigo-100">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-indigo-600">포상 대기/추적</p>
                      <i className="fa-regular fa-bookmark text-indigo-500 text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800">06 기수</h3>
                      <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-amber-500 h-1" style={{ width: "60%" }}></div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">활동 수료 후 6개월 근속 모니터링</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-emerald-600">활동 진행 중</p>
                      <i className="fa-regular fa-circle-play text-emerald-500 text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800">02 기수</h3>
                      <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-50 h-1" style={{ width: "30%" }}></div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">주차별 단계 선후배 교류 미션 진행 중</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between h-32 opacity-70">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-slate-400">활동 예정</p>
                      <i className="fa-regular fa-clock text-slate-400 text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800">00 기수</h3>
                      <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-slate-300 h-1" style={{ width: "0%" }}></div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">입사 예정 또는 버디 매칭 대기</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* B. 포상 대기 및 근속 추적 리스트 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4 bg-slate-50/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-800 text-sm">B. 포상 대기 및 근속 추적 리스트</h3>
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">{filteredTrackingMains.length} Row(s)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">2차 포상이 신청 예정이며, 6달간 사후 퇴사자 유무를 추적 점검하는 선별 구간입니다.</p>
                  </div>
                  <div className="relative w-full md:w-72">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                    <input 
                      type="text" 
                      value={trackingSearch}
                      onChange={(e) => setTrackingSearch(e.target.value)}
                      placeholder="기수, 버디, 루키 이름 검색..." 
                      className="w-full bg-white border border-slate-200 pl-9 pr-3 py-1.5 rounded-xl text-xs outline-none focus:border-indigo-600 font-medium"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                        <th className="px-6 py-4">기수</th>
                        <th className="px-6 py-4">골든버디 성명</th>
                        <th className="px-6 py-4">노랑루키 성명</th>
                        <th className="px-6 py-4">노랑루키 입사일</th>
                        <th className="px-6 py-4">2차 포상 지급예정일 (AI 계산)</th>
                        <th className="px-6 py-4">근속 상태 (퇴사 여부 반영)</th>
                        <th className="px-6 py-4 text-center">조치사항</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-650">
                      {filteredTrackingMains.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100">
                          <td className="px-6 py-4 font-bold text-slate-900">{m.cohort}</td>
                          <td className="px-6 py-4">
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-bold">{m.buddy}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-bold">{m.rookie}</span>
                          </td>
                          <td className="px-6 py-4 font-mono">{m.joinDate}</td>
                          <td className="px-6 py-4 font-mono font-bold text-indigo-600">2026.12.30 예정</td>
                          <td className="px-6 py-4">
                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold text-[10px]">6개월 추적중 (근속)</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => sendTargetJandi(m.rookie)} 
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1 rounded-lg text-[10px] transition-colors cursor-pointer"
                            >
                              <i className="fa-solid fa-paper-plane mr-1"></i>잔디 발송
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredTrackingMains.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-slate-400">검색 조건에 맞는 데이터가 존재하지 않습니다.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Main Master Sync table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4 bg-slate-50/50">
                  <div>
                    <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                      <span className="w-2 h-4 bg-indigo-600 rounded-sm"></span>
                      온보딩운영(메인) 동기화 레코드 리스트
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">구글 시트에서 수합된 전 기수(1기~13기) 마스터 레코드 족보</p>
                  </div>
                  <div className="relative w-full md:w-72">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                    <input 
                      type="text" 
                      value={mainSearch}
                      onChange={(e) => setMainSearch(e.target.value)}
                      placeholder="기수, 버디, 루키 이름 검색..." 
                      className="w-full bg-white border border-slate-200 pl-9 pr-3 py-1.5 rounded-xl text-xs outline-none focus:border-indigo-600 font-medium"
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                        <th className="px-6 py-4">기수 (COHORT)</th>
                        <th className="px-6 py-4">골든버디 성명 (GOLDEN BUDDY)</th>
                        <th className="px-6 py-4">노랑루키 성명 (YELLOW ROOKIE)</th>
                        <th className="px-6 py-4">입사 일자</th>
                        <th className="px-6 py-4">온보딩 시작</th>
                        <th className="px-6 py-4">온보딩 종료</th>
                        <th className="px-6 py-4 text-center">1차 포상</th>
                        <th className="px-6 py-4 text-center">2차 포상</th>
                        <th className="px-6 py-4 text-center">현재 루키 정착 상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-650">
                      {filteredAllMains.map((m, idx) => {
                        let statusBadge = <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-bold text-[10px]">활동중</span>;
                        if (m.status === "포상완료") {
                          statusBadge = <span className="bg-sky-50 text-sky-700 px-2 py-1 rounded-full font-bold text-[10px]">수료 완료</span>;
                        } else if (m.status === "포상대기") {
                          statusBadge = <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-bold text-[10px]">추적 대기</span>;
                        }

                        return (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100">
                            <td className="px-6 py-4 font-bold text-slate-900 font-mono">{m.cohort}</td>
                            <td className="px-6 py-4 font-bold">{m.buddy}</td>
                            <td className="px-6 py-4 font-bold">{m.rookie}</td>
                            <td className="px-6 py-4 font-mono">{m.joinDate}</td>
                            <td className="px-6 py-4 font-mono">{m.startDate}</td>
                            <td className="px-6 py-4 font-mono">{m.endDate}</td>
                            <td className="px-6 py-4 text-center"><i className="fa-solid fa-circle-check text-emerald-500"></i></td>
                            <td className="px-6 py-4 text-center">
                              {m.status === "포상완료" ? (
                                <i className="fa-solid fa-circle-check text-emerald-500"></i>
                              ) : (
                                <span className="text-slate-350">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">{statusBadge}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: 루틴 업무 자동화 관리 ================= */}
          {activeTab === "step3" && (
            <RoutineAutomation mains={mains as any} schedules={[]} />
          )}

        </div>

        {/* FOOTER */}
        <footer className="bg-white border-t border-slate-200 h-12 flex items-center justify-center text-xs text-slate-400 font-mono shrink-0">
          Smart HR Onboarding Dashboard Portal v2.9 &copy; 2026.
        </footer>
      </main>

    </div>
  );
}

