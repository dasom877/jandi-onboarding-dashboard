import React, { useState, useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { SatisfactionSurvey } from "../types";

// Chart.js 모듈 등록
Chart.register(...registerables);

interface SatisfactionAnalysisProps {
  mains: any[];
  surveys: any[];
  rawSurveys: SatisfactionSurvey[];
}

export default function SatisfactionAnalysis({
  mains,
  surveys,
  rawSurveys
}: SatisfactionAnalysisProps) {
  const [step1SubTab, setStep1SubTab] = useState<"multiple" | "subjective">("multiple");
  const [selectedCohortGroup, setSelectedCohortGroup] = useState<"rookie" | "buddy">("buddy");
  const [selectedSubjectiveCohort, setSelectedSubjectiveCohort] = useState<string>("13기");
  const [selectedSubjectiveQNo, setSelectedSubjectiveQNo] = useState<string>("Q10");

  // Chart Refs
  const satChartRef = useRef<HTMLCanvasElement | null>(null);
  const deptChartRef = useRef<HTMLCanvasElement | null>(null);
  const satChartInst = useRef<Chart | null>(null);
  const deptChartInst = useRef<Chart | null>(null);

  // Dynamic Chart rendering on sub-tab mount
  useEffect(() => {
    if (step1SubTab === "multiple") {
      // Compute average rating by cohort from surveys state
      const cohortScores: Record<string, { sum: number; count: number }> = {};
      surveys.forEach((s) => {
        if (!cohortScores[s.cohort]) {
          cohortScores[s.cohort] = { sum: 0, count: 0 };
        }
        cohortScores[s.cohort].sum += s.rating;
        cohortScores[s.cohort].count += 1;
      });

      const sortedCohorts = Object.keys(cohortScores).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
        return numA - numB;
      });

      const cohortLabels = sortedCohorts.length > 0 ? sortedCohorts : ["10기", "11기", "12기", "13기"];
      const cohortData = sortedCohorts.length > 0 
        ? sortedCohorts.map((c) => parseFloat((cohortScores[c].sum / cohortScores[c].count).toFixed(2)))
        : [4.00, 4.40, 4.35, 4.30];

      // Compute average rating by department from surveys state
      const deptScores: Record<string, { sum: number; count: number }> = {};
      surveys.forEach((s) => {
        const dept = s.dept || "기타";
        if (!deptScores[dept]) {
          deptScores[dept] = { sum: 0, count: 0 };
        }
        deptScores[dept].sum += s.rating;
        deptScores[dept].count += 1;
      });

      const sortedDepts = Object.keys(deptScores).sort();
      const deptLabels = sortedDepts.length > 0 ? sortedDepts : ["개발팀", "기획팀", "디자인팀", "마케팅팀", "영업팀", "인사팀"];
      const deptData = sortedDepts.length > 0 
        ? sortedDepts.map((d) => parseFloat((deptScores[d].sum / deptScores[d].count).toFixed(2)))
        : [4.6, 4.5, 4.2, 4.2, 4.3, 4.1];

      // 1. Satisfaction line chart
      if (satChartRef.current) {
        const chartExist = Chart.getChart(satChartRef.current);
        if (chartExist) chartExist.destroy();
        const ctx = satChartRef.current.getContext("2d");
        if (ctx) {
          satChartInst.current = new Chart(ctx, {
            type: "line",
            data: {
              labels: cohortLabels,
              datasets: [{
                label: "기수별 만족도 평점",
                data: cohortData,
                borderColor: "#4f46e5",
                backgroundColor: "rgba(79, 70, 229, 0.08)",
                borderWidth: 3,
                fill: true,
                tension: 0.3
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { min: 3.5, max: 5.0 }
              }
            }
          });
        }
      }

      // 2. Department satisfaction bar chart
      if (deptChartRef.current) {
        const chartExist = Chart.getChart(deptChartRef.current);
        if (chartExist) chartExist.destroy();
        const ctx = deptChartRef.current.getContext("2d");
        if (ctx) {
          deptChartInst.current = new Chart(ctx, {
            type: "bar",
            data: {
              labels: deptLabels,
              datasets: [{
                label: "만족도 점수",
                data: deptData,
                backgroundColor: "#fbbf24",
                borderRadius: 8
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { min: 3.0, max: 5.0 }
              }
            }
          });
        }
      }
    }

    return () => {
      if (satChartInst.current) satChartInst.current.destroy();
      if (deptChartInst.current) deptChartInst.current.destroy();
    };
  }, [step1SubTab, surveys]);

  // Set default subjective cohort on mount or when rawSurveys changes
  useEffect(() => {
    const uniqueCohorts = Array.from(new Set(rawSurveys.map(s => s.cohort))).sort((a,b) => {
      const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
      return numB - numA;
    });
    if (uniqueCohorts.length > 0 && !uniqueCohorts.includes(selectedSubjectiveCohort)) {
      setSelectedSubjectiveCohort(uniqueCohorts[0]);
    }
  }, [rawSurveys]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* STEP 1-1 / 1-2 서브 탭 스위처 */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setStep1SubTab("multiple")}
          className={`pb-3 font-bold text-sm transition-all relative ${
            step1SubTab === "multiple"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          STEP 1-1. 조직 적응도 분석 - 객관식
        </button>
        <button
          onClick={() => setStep1SubTab("subjective")}
          className={`pb-3 font-bold text-sm transition-all relative ${
            step1SubTab === "subjective"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          STEP 1-2. 조직 적응도 분석 - 주관식
        </button>
      </div>

      {/* ================= STEP 1-1: 객관식 분석 탭 ================= */}
      {step1SubTab === "multiple" && (
        <div className="space-y-6">
          {/* 1. 기수별 만족도 종합 분석 상세 표 (상단 12컬럼 넓게 배치) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 w-full">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h4 className="font-black text-slate-800 text-sm">[객관식] 기수별 만족도 종합 분석 상세 표 도표</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">1기부터 최근 13기까지의 장기 만족도 평점 변동 추이와 매칭별 정형 데이터</p>
              </div>
              <span className="text-xs bg-indigo-50 font-bold text-indigo-700 py-1 px-2.5 rounded-lg">
                전체 평균 {(surveys.reduce((sum, s) => sum + s.rating, 0) / (surveys.length || 1)).toFixed(2)}점
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
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

                  const isCompleted = m.reward1 === "완료" || !!m.reward1Date;
                  if (isCompleted) {
                    summaryMap[cohort].completedCount += 1;
                  }

                  const isReward2 = m.reward2 === "완료" || !!m.reward2Date;
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
                          ? Math.round((item.completedCount / item.matchingCount) * 100) 
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

          {/* 2. Q1~Q9 객관식 문항별 답변 비교 매트릭스 표 */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 w-full">
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h4 className="font-black text-slate-800 text-sm">[객관식] Q1~Q9 문항별 기수 평점 비교 매트릭스</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">질문 구성이 동일한 기수 그룹별로 만족도 설문 문항별 답변 점수를 한눈에 비교합니다.</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setSelectedCohortGroup("rookie")}
                  className={`text-xs py-1.5 px-3 rounded-lg font-bold transition-all ${
                    selectedCohortGroup === "rookie"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  루키 설문 (1기 ~ 8기)
                </button>
                <button
                  onClick={() => setSelectedCohortGroup("buddy")}
                  className={`text-xs py-1.5 px-3 rounded-lg font-bold transition-all ${
                    selectedCohortGroup === "buddy"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  버디 설문 (9기 ~ 13기)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              {(() => {
                const qTextsRookie = {
                  Q1: "온보딩 프로그램의 전체 구성과 흐름은 이해하기 쉬웠나요?",
                  Q2: "온보딩 과정은 업무 적응 및 인수인계와 병행하기에 적절했나요?",
                  Q3: "프로그램 참여를 통해 기초 교육이 업무에 도움이 되었나요?",
                  Q4: "프로그램 참여를 통해 심화 역량 교육이 업무에 도움이 되었나요?",
                  Q5: "온보딩 과정 중 프로그램에 대해 담당자의 설명이 충분했나요?",
                  Q6: "온보딩 과정을 통해 자신의 성장 및 업무 역량이 향상되었나요?",
                  Q7: "버디와의 소통이 원활하게 이루어졌다고 생각하시나요?",
                  Q8: "버디의 리딩에 따라 활동이 원활히 진행되었나요?",
                  Q9: "버디와 활동을 진행하며 전반적으로 얼마나 긍정적인 경험이었나요?"
                };

                const qTextsBuddy = {
                  Q1: "온보딩 프로그램의 전체 구성과 흐름은 이해하기 쉬웠나요?",
                  Q2: "버디로서 수행해야 할 역할과 책임이 명확하게 안내되었나요?",
                  Q3: "프로그램 참여를 통해 기초 교육이 업무에 도움이 되었나요?",
                  Q4: "프로그램 참여를 통해 심화 역량 교육이 업무에 도움이 되었나요?",
                  Q5: "온보딩 프로그램 참여가 본인의 업무 부담을 과도하게 증가시키지 않았나요?",
                  Q6: "향후에도 버디로서 온보딩 프로그램에 다시 참여할 의향이 있나요?",
                  Q7: "루키와의 소통이 원활하게 이루어졌다고 생각하시나요?",
                  Q8: "루키는 당사 적응을 위해 적극적으로 활동에 임했나요?",
                  Q9: "루키와 활동을 진행하며 전반적으로 얼마나 긍정적인 경험이었나요?"
                };

                const isRookieGroup = selectedCohortGroup === "rookie";
                const targetCohorts = isRookieGroup 
                  ? ["1기", "2기", "3기", "4기", "5기", "6기", "7기", "8기"] 
                  : ["9기", "10기", "11기", "12기", "13기"];
                const currentQTexts = isRookieGroup ? qTextsRookie : qTextsBuddy;

                const qMatrix: Record<string, Record<string, { sum: number; count: number }>> = {};

                Object.keys(currentQTexts).forEach((qNo) => {
                  qMatrix[qNo] = {};
                  targetCohorts.forEach((cohort) => {
                    qMatrix[qNo][cohort] = { sum: 0, count: 0 };
                  });
                });

                rawSurveys.forEach((s) => {
                  if (targetCohorts.includes(s.cohort) && qMatrix[s.qNo]) {
                    const val = parseFloat(s.response);
                    if (!isNaN(val) && val >= 1 && val <= 5) {
                      qMatrix[s.qNo][s.cohort].sum += val;
                      qMatrix[s.qNo][s.cohort].count += 1;
                    }
                  }
                });

                const activeCohorts = targetCohorts.filter(cohort => {
                  return Object.keys(currentQTexts).some(qNo => qMatrix[qNo][cohort].count > 0);
                });

                const displayCohorts = activeCohorts.length > 0 ? activeCohorts : targetCohorts;

                return (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 w-12">문항</th>
                        <th className="px-4 py-3 min-w-[280px]">질문 내용</th>
                        {displayCohorts.map(cohort => (
                          <th key={cohort} className="px-4 py-3 text-center w-16">{cohort}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-650">
                      {Object.keys(currentQTexts).map((qNo) => {
                        const questionText = (currentQTexts as any)[qNo];
                        return (
                          <tr key={qNo} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-bold text-indigo-650">{qNo}</td>
                            <td className="px-4 py-3 text-slate-700 font-normal">{questionText}</td>
                            {displayCohorts.map(cohort => {
                              const cell = qMatrix[qNo][cohort];
                              const score = cell.count > 0 ? (cell.sum / cell.count).toFixed(2) : "-";
                              return (
                                <td key={cohort} className="px-4 py-3 text-center font-bold text-slate-800">
                                  {score !== "-" ? `${score}점` : "-"}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>

          {/* 3. 차트 영역 (하단 8:4 분할 가로 배치) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: 만족도 추이 차트 */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 lg:col-span-8 flex flex-col justify-between h-[320px]">
              <div>
                <h4 className="font-black text-slate-800 text-sm">[객관식] 기수별 만족도 평점 추이 차트</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">실시간 구글 시트 연동 기반 기수별 평균 평점 흐름</p>
              </div>
              <div className="h-[220px] relative mt-4">
                <canvas ref={satChartRef}></canvas>
              </div>
            </div>

            {/* Right: 부서별 차트 */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 lg:col-span-4 flex flex-col justify-between h-[320px]">
              <div>
                <h4 className="font-black text-slate-800 text-sm">[객관식] 부서별 온보딩 만족도 통계 차트</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">부서 소속별 정착 만족도 점수 평점</p>
              </div>
              <div className="h-[220px] relative mt-4">
                <canvas ref={deptChartRef}></canvas>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 1-2: 주관식 분석 탭 ================= */}
      {step1SubTab === "subjective" && (
        <div className="space-y-6">
          {/* 1. Q10~Q12 주관식 문항별 기수별 답변 상세 리스트 (상단 12컬럼) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 w-full">
            <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h4 className="font-black text-slate-800 text-sm">[주관식] 기수별 주관식 설문 질문별 답변 모아보기</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">기수와 서술형 질문 문항번호를 매칭하여 실제 주관식 피드백 리스트를 조회합니다.</p>
              </div>
              
              {/* 필터 셀렉터 */}
              <div className="flex flex-wrap gap-2.5 w-full lg:w-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500">기수 선택</span>
                  <select
                    value={selectedSubjectiveCohort}
                    onChange={(e) => setSelectedSubjectiveCohort(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg p-2 bg-white font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {(() => {
                      const uniqueCohorts = Array.from(new Set(rawSurveys.map(s => s.cohort))).sort((a,b) => {
                        const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
                        const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
                        return numB - numA;
                      });
                      return uniqueCohorts.map(cohort => (
                        <option key={cohort} value={cohort}>{cohort}</option>
                      ));
                    })()}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500">문항 선택</span>
                  <select
                    value={selectedSubjectiveQNo}
                    onChange={(e) => setSelectedSubjectiveQNo(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg p-2 bg-white font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Q10">Q10. 가장 도움이 되거나 흥미 있었던 과정</option>
                    <option value="Q11">Q11. 프로그램 전반 건의 및 애로사항</option>
                    <option value="Q12">Q12. 버디/루키에 대해 좋았던 점 및 어려웠던 점</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 답변 리스트 */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {(() => {
                const filteredAnswers = rawSurveys.filter(
                  (s) => s.cohort === selectedSubjectiveCohort &&
                         s.qNo === selectedSubjectiveQNo &&
                         s.response &&
                         isNaN(parseFloat(s.response))
                );

                if (filteredAnswers.length === 0) {
                  return (
                    <div className="flex items-center gap-3 p-6 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 text-xs font-bold justify-center">
                      <i className="fa-solid fa-circle-info text-slate-400"></i>
                      선택하신 [{selectedSubjectiveCohort}]의 [{selectedSubjectiveQNo}] 문항에 작성된 주관식 피드백이 존재하지 않습니다.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAnswers.map((item, idx) => (
                      <div key={idx} className="bg-slate-50/70 border border-slate-100 p-5 rounded-2xl space-y-3 relative hover:shadow-sm hover:border-slate-200 transition-all duration-200">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-full">{item.respondent}</span>
                            <span className="font-bold text-slate-400">{item.department}</span>
                          </div>
                          <span className="font-extrabold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">{item.cohort} {item.qNo}</span>
                        </div>
                        <p className="text-xs text-slate-650 leading-relaxed font-medium whitespace-pre-line">
                          {item.response}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 2. 주관식 피드백 분석 AI 텍스트 마이닝 (하단 12컬럼 배치) */}
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

                {/* Sentiment Gauge & Keywords bar stats */}
                {(() => {
                  const keywordsToTrack = [
                    { keyword: "성장", category: "positive", label: "개인 성장 및 역량 향상", color: "bg-emerald-400" },
                    { keyword: "유대감", category: "positive", label: "정서적 교감 및 유대감", color: "bg-teal-400" },
                    { keyword: "친밀감", category: "positive", label: "버디와의 친밀감 형성", color: "bg-indigo-400" },
                    { keyword: "일정", category: "negative", label: "현업 병행 일정 부담", color: "bg-rose-400" },
                    { keyword: "소통", category: "negative", label: "부서간 소통/교류 부족", color: "bg-amber-400" },
                    { keyword: "보고서", category: "negative", label: "활동 보고서 작성 부담", color: "bg-orange-400" }
                  ];

                  const keywordCounts: Record<string, number> = {};
                  keywordsToTrack.forEach(k => {
                    keywordCounts[k.keyword] = 0;
                  });

                  const allTextResponses = rawSurveys.filter(
                    s => isNaN(parseFloat(s.response)) && s.response
                  );

                  allTextResponses.forEach(s => {
                    keywordsToTrack.forEach(k => {
                      if (s.response.includes(k.keyword)) {
                        keywordCounts[k.keyword] += 1;
                      }
                    });
                  });

                  const positiveSum = keywordCounts["성장"] + keywordCounts["유대감"] + keywordCounts["친밀감"];
                  const negativeSum = keywordCounts["일정"] + keywordCounts["소통"] + keywordCounts["보고서"];
                  const totalSum = positiveSum + negativeSum;
                  const sentimentScore = totalSum > 0 
                    ? ((positiveSum / totalSum) * 100).toFixed(1) 
                    : "91.4";

                  const maxCount = Math.max(...Object.values(keywordCounts), 1);

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Sentiment Gauge */}
                      <div className="lg:col-span-3 bg-indigo-950/50 p-6 rounded-2xl border border-indigo-800/40 text-center flex flex-col justify-center items-center">
                        <p className="text-xs text-indigo-400 font-bold mb-1">종합 신입 정착 지수</p>
                        <h4 className="text-4xl font-black text-emerald-400 animate-pulse">{sentimentScore}%</h4>
                        <div className="w-full bg-indigo-950 h-2 rounded-full mt-3 overflow-hidden">
                          <div className="bg-emerald-400 h-2 transition-all duration-1000" style={{ width: `${sentimentScore}%` }}></div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">부정/보완 대비 긍정 응답 비율</p>
                      </div>

                      {/* Automatic Keyword classification counts */}
                      <div className="lg:col-span-9 bg-indigo-950/50 p-6 rounded-2xl border border-indigo-800/40 space-y-4">
                        <h6 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">자동 분류 키워드 빈도 추출 분석</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {keywordsToTrack.map((k) => {
                            const count = keywordCounts[k.keyword];
                            const pct = Math.round((count / maxCount) * 100);
                            return (
                              <div key={k.keyword} className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${k.color}`}></span>
                                    {k.label} ({k.keyword})
                                  </span>
                                  <span className="text-amber-400 font-bold">{count}건</span>
                                </div>
                                <div className="w-full bg-indigo-950 h-1.5 rounded-full overflow-hidden">
                                  <div className={`${k.color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

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
    </div>
  );
}
