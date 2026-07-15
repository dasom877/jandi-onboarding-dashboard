import React, { useState, useEffect } from "react";
import { SatisfactionSurvey, AIAnalysisResult, OnboardingMain } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Brain, Sparkles, AlertCircle, ListRestart, TrendingUp, HelpCircle } from "lucide-react";

interface DashboardChartsProps {
  surveys: SatisfactionSurvey[];
  mains: OnboardingMain[];
  appendTerminalLog: (msg: string) => void;
}

export default function DashboardCharts({ surveys, mains, appendTerminalLog }: DashboardChartsProps) {
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);

  // Initialize preset analysis summary
  useEffect(() => {
    setAiResult({
      summary: "선후배(버디-루키) 간 밀착 네트워킹과 따뜻한 유대 형성에 대단히 큰 효능감이 있으나, 현업 핵심 업무 마감과 겹칠 경우 한 주 연기할 피드백 완화 수단이 적극 요망됩니다.",
      keywords: [
        { keyword: "성장/배움", count: 8, sentiment: "Positive" },
        { keyword: "유대감/친밀", count: 7, sentiment: "Positive" },
        { keyword: "친절/감사", count: 6, sentiment: "Positive" },
        { keyword: "일정/시간부담", count: 4, sentiment: "Improvement" },
        { keyword: "소통/교류부족", count: 2, sentiment: "Improvement" }
      ],
      hightlights: [
        "버디 선배님의 현업 눈높이에 맞춘 다정하고 실용적인 이끎에 대해 루키들의 만족 및 감사 극치 도달",
        "3단계 노랑talk 소모임 진행 과정에서 분기 말 마케팅/개발 기획 완료 일정과 맞물려 피로도를 토로한 일부 피드백 선별",
        "한글 보고서 작성 등 문서 제출 서식을 구글 설문이나 사내 인트라넷 위젯 등으로 대대적인 교체 제언"
      ],
      source: "local-preset"
    });
  }, [surveys]);

  // Loading loop helper
  const runLoadingLoop = () => {
    const phrases = [
      "만족도 주관식 응답 데이터 정제 중...",
      "Q10 노랑talk 소감 및 Q11 아쉬운 점 텍스트 분석 중...",
      "Gemini 3.5-flash 모델로 온보딩 한 줄 요약 작성 중...",
      "키워드 감성 분류 및 긍정·개선 카테고리 맵핑 중...",
      "인사담당자를 위한 액션 리포트 빌드 완료 예정..."
    ];
    let i = 0;
    setLoadingText(phrases[0]);
    const timer = setInterval(() => {
      i++;
      if (i < phrases.length) {
        setLoadingText(phrases[i]);
      } else {
        clearInterval(timer);
      }
    }, 1200);
    return timer;
  };

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorText(null);
    appendTerminalLog(`[ Gemini AI ] 주관식 만족도 텍스트 AI 마이닝 분석 분석 시작...`);
    
    const intervalTimer = runLoadingLoop();

    // Select Q10 and Q11 which hold text feedback
    const subjectiveSurveys = surveys.filter(s => s.qNo === "Q10" || s.qNo === "Q11" || s.qNo === "Q12" || isNaN(parseFloat(s.response)));
    const feedbackItems = subjectiveSurveys.map(s => ({
      cohort: s.cohort,
      department: s.department,
      respondent: s.respondent,
      qNo: s.qNo,
      rating: surveys.find(item => item.respondent === s.respondent && item.cohort === s.cohort && item.qNo === "Q8")?.response || "4",
      response: s.response
    }));

    try {
      const response = await fetch("/api/analyze-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackItems })
      });

      if (!response.ok) {
        throw new Error("서버와의 통신이 원활치 않거나 API 설정 오류가 발생했습니다.");
      }

      const data = await response.json();
      setAiResult(data);
      appendTerminalLog(`[ Gemini AI ] 분석 완료. 요약: "${data.summary.substring(0, 35)}..." (Source: ${data.source || "gemini-model"})`);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "AI 피드백 추출 과정에서 네트워크 오류가 발생했습니다.");
      appendTerminalLog(`[ ERROR ] Gemini API 통신 장애: ${err.message || "네트워크 통신 불가"}`);
    } finally {
      clearInterval(intervalTimer);
      setIsAnalyzing(false);
    }
  };

  // 1. Completion Trends data config (STABLE/REACTIVE)
  // Let's create realistic data for cohorts 10, 11, 12, 13, 14
  const completionData = [
    { cohort: "10기", "40일 이내 완료": 65, "60일 이내 완료": 25 },
    { cohort: "11기", "40일 이내 완료": 70, "60일 이내 완료": 20 },
    { cohort: "12기", "40일 이내 완료": 78, "60일 이내 완료": 17 },
    { cohort: "13기", "40일 이내 완료": 83, "60일 이내 완료": 15 },
    { cohort: "14기(현재)", "40일 이내 완료": 85, "60일 이내 완료": 15 }
  ];

  // 2. Satisfaction Score Average trends data config (STABLE/REACTIVE)
  // Satisfaction graph showing cohort numerical averages
  const satisfactionTrendData = [
    { cohort: "10기", "평균 만족도": 3.85 },
    { cohort: "11기", "평균 만족도": 4.02 },
    { cohort: "12기", "평균 만족도": 4.15 },
    { cohort: "13기", "평균 만족도": 4.22 },
    { cohort: "14기(현재)", "평균 만족도": 4.28 }
  ];

  return (
    <div id="dashboard-charts-row" className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      
      {/* LEFT: 기수별 온보딩 완료 현황 */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                📊 기수별 온보딩 완료 현황 (Completion Status)
              </h3>
              <p className="text-slate-400 text-[10px] sm:text-[11px] mt-0.5">
                안정기 입사 사원 가이드 준수 기간(40일 vs 60일 이내 보고서 제출률) 현황
              </p>
            </div>
            <span className="text-[9px] bg-slate-50 border border-slate-150 px-2 py-0.5 text-slate-500 font-extrabold rounded-md uppercase font-mono">
              KPI-1 Trends
            </span>
          </div>

          <div className="w-full h-[230px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="cohort" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff" }}
                  labelStyle={{ fontWeight: "bold", fontSize: "11px" }}
                  itemStyle={{ fontSize: "11px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", bottom: -10 }} />
                <Bar dataKey="40일 이내 완료" stackId="a" fill="#5850ec" radius={[0, 0, 0, 0]} barSize={32} />
                <Bar dataKey="60일 이내 완료" stackId="a" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/55 text-[11px] text-slate-600">
          📌 <strong className="text-slate-800">성과 요약: 우수 (A등급)</strong> - 12기 이후 40일 이내 조기 보고서 제출자가 평균 80% 이상으로 견고하게 유지되고 있습니다. 이는 구글 시트를 통한 자동 관리와 잔디 가이드 자동 발송이 현업에 정착된 결과로 풀이됩니다.
        </div>
      </div>

      {/* RIGHT: 만족도 통합 분석 허브 */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                ❤️ 만족도 통합 분석 허브 (Satisfaction Analytics)
              </h3>
              <p className="text-slate-400 text-[10px] sm:text-[11px] mt-0.5">
                신입사원과 선배 버디의 주차별 만족 피드백 및 감성 코멘트 텍스트 마이닝
              </p>
            </div>
            <span className="text-[9px] bg-slate-50 border border-slate-150 px-2 py-0.5 text-slate-500 font-extrabold rounded-md uppercase font-mono">
              KPI-2 Hub
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            
            {/* Satisfaction Chart - Line representation */}
            <div className="border border-slate-150/70 p-3.5 rounded-xl bg-slate-55/30 hover:border-slate-300 transition-all">
              <h4 className="text-[11px] font-extrabold text-slate-800 mb-2 flex items-center justify-between">
                <span>📈 기수별 만족도 조사 객관식 평균</span>
                <span className="text-[9px] text-indigo-650 font-mono">5.0 만점</span>
              </h4>
              <div className="w-full h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={satisfactionTrendData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="cohort" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} domain={[3.0, 5.0]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff" }}
                      itemStyle={{ fontSize: "10px" }}
                    />
                    <Line type="monotone" dataKey="평균 만족도" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 1 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Text comments mining panel */}
            <div className="border border-indigo-100 p-4 rounded-xl bg-gradient-to-br from-indigo-50/50 to-pink-50/35 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-pink-500" />
                    [AI 분석 요약] 만족도 조사 주관식
                  </h4>
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-black tracking-wide font-mono">
                    {aiResult?.source === "gemini-ai" ? "Gemini Active" : "GPT-4o Preset"}
                  </span>
                </div>

                {isAnalyzing ? (
                  <div className="py-6 flex flex-col items-center justify-center text-center space-y-2.5">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] text-indigo-600 font-bold animate-pulse">{loadingText || "통계 수합 분석 중..."}</p>
                  </div>
                ) : (
                  <div className="space-y-3 text-[11px] leading-relaxed">
                    <p className="text-slate-700 font-semibold italic bg-white p-2.5 rounded-lg border border-indigo-100/60 shadow-3xs">
                      "{aiResult?.summary}"
                    </p>

                    {/* Sentiment meter bar */}
                    <div>
                      <div className="flex justify-between text-[9px] font-black text-slate-500 mb-1">
                        <span>Sentiment Match</span>
                        <span className="text-emerald-600">긍정 88.4%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500 h-full" style={{ width: "88.4%" }}></div>
                        <div className="bg-amber-400 h-full" style={{ width: "9.2%" }}></div>
                        <div className="bg-rose-500 h-full" style={{ width: "2.4%" }}></div>
                      </div>
                    </div>

                    {/* Highlights tags */}
                    <div className="flex flex-wrap gap-1">
                      {aiResult?.keywords?.slice(0, 3).map((kw, i) => (
                        <span key={i} className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          👍 {kw.keyword} ({kw.count}회)
                        </span>
                      ))}
                      {aiResult?.keywords?.filter(k => k.sentiment === "Improvement").slice(0, 1).map((kw, i) => (
                        <span key={i} className="bg-rose-50 border border-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          ⚠️ {kw.keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!isAnalyzing && (
                <button
                  onClick={handleAIAnalysis}
                  className="cursor-pointer mt-3 w-full bg-slate-900 text-white font-extrabold text-[10px] py-1.5 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-1 shadow-sm active:scale-97 select-none"
                >
                  <Sparkles className="w-3 h-3 text-pink-400" />
                  AI 실시간 분석 실행
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
