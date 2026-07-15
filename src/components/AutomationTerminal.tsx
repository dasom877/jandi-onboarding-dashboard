import React, { useState, useEffect, useRef } from "react";
import { OnboardingMain, ActivitySchedule } from "../types";
import { Send, CheckCircle, RefreshCw, Layers, ShieldAlert, AlertTriangle, Monitor, Play, Trash } from "lucide-react";
import { sendJandiMessage } from "../utils/jandiSender";
import JandiConfigForm from "./JandiConfigForm";

interface AutomationTerminalProps {
  mains: OnboardingMain[];
  schedules: ActivitySchedule[];
  incrementAutomation: () => void;
  appendTerminalLog: (msg: string) => void;
  terminalLogs: string[];
  clearTerminalLogs: () => void;
}

interface RoutineTaskItem {
  id: string;
  rookie: string;
  cohort: string;
  dept: string;
  buddy: string;
  step: number;
  stepTitle: string;
  worksheetStatus: "미발송" | "완료";
  rewardDesc: string;
  status: "배포대기" | "배포완료";
  message: string;
}

export default function AutomationTerminal({
  mains,
  schedules,
  incrementAutomation,
  appendTerminalLog,
  terminalLogs,
  clearTerminalLogs
}: AutomationTerminalProps) {
  // 1. Target Webhook State (Preset with developer placeholder but fully editable)
  const [webhookUrl, setWebhookUrl] = useState("https://wh.jandi.com/connect-api/webhook/27388464/6e67c46677fd21750badc363ae2393d9");
  const [testPayload, setTestPayload] = useState(`🌾[공지] 3단계 활동 안내
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
감사합니다.`);
  const [isTestSending, setIsTestSending] = useState(false);

  // 2. Local reactive task entries
  const [tasks, setTasks] = useState<RoutineTaskItem[]>([]);
  const [activeModalTask, setActiveModalTask] = useState<RoutineTaskItem | null>(null);

  // Auto Scroll Ref for Terminal console
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs]);

  // Construct tasks list reactively based on mains and schedules
  useEffect(() => {
    // Generate realistic sample records for 12기 and 13기 as requested in mockup
    const initialTasks: RoutineTaskItem[] = [
      {
        id: "task-1",
        rookie: "신은지",
        cohort: "12기",
        dept: "마케팅팀",
        buddy: "김영희",
        step: 3,
        stepTitle: "상대방 소통 '노랑talk' (회비 3만원 지급)",
        worksheetStatus: "미발송",
        rewardDesc: "2차 포상 예정 (2026-06-19)",
        status: "배포대기",
        message: "💬 [12기 마케팅팀 신은지 루키 - 골든버디 김영희 선배님]\n금일은 신입사원 정기 3단계 미션 '노랑talk (1:1 밀착 캐주얼 다과회)' 주간입니다! 인사팀에서 지원하는 티타임 쿠폰(3만원 상당) 결재가 전용 부서로 활성화되었습니다. 신종 은지후배와 함께 근속 안정을 축하하는 소박한 커피 타임을 갖고 소중한 우정을 나눠 보시기 바랍니다. 💛"
      },
      {
        id: "task-2",
        rookie: "한소희",
        cohort: "12기",
        dept: "개발팀",
        buddy: "박준영",
        step: 1,
        stepTitle: "조직 내부 적응 및 문화 세미나",
        worksheetStatus: "완료",
        rewardDesc: "1차 포상 지급 (2026-06-15)",
        status: "배포완료",
        message: "🚀 [12기 개발팀 한소희 루키 - 골든버디 박준영 선배님]\n온보딩 1단계 미션인 '사내 기술 인프라 가이드 전수' 배포 완료 되었습니다."
      },
      {
        id: "task-3",
        rookie: "김노랑",
        cohort: "13기",
        dept: "디자인팀",
        buddy: "최성우",
        step: 2,
        stepTitle: "OJT 부서 밀착 가이드 배포",
        worksheetStatus: "미발송",
        rewardDesc: "1차 포상 예정 (2026-07-10)",
        status: "배포대기",
        message: "🚀 [13기 디자인팀 김노랑 루키 - 골든버디 최성우 선배님]\n오늘은 부서 첫 실무 투입 과정인 2단계 'OJT 실무 흐름 가이드라인' 미션 개시일입니다! 김노랑 후배에게 필요한 Figma 공유 라이브러리 및 디자인 협업 보드 링크를 배정하고 기본적인 실습을 가이드해 주시기 바랍니다."
      },
      {
        id: "task-4",
        rookie: "정은우",
        cohort: "13기",
        dept: "영업팀",
        buddy: "강현수",
        step: 1,
        stepTitle: "조직 내부 적응 및 사내 인프라",
        worksheetStatus: "미발송",
        rewardDesc: "1차 포상 예정 (2026-07-15)",
        status: "배포대기",
        message: "💛 [13기 영업팀 정은우 루키 - 골든버디 강현수 선배님]\n환영합니다! 정은우 루키님의 1단계 온보딩 안착 가이드 미션이 발효되었습니다. 사내 메신저 슬랙 정착, 인트라넷 이메일 캘린더 매핑 등이 무사 도달하도록 리드 부탁드립니다."
      }
    ];

    // Merge or read details from real synced mains if available to enrich database
    if (mains.length > 7) {
      const activeMains = mains.filter(f => f.cohort.includes("12") || f.cohort.includes("13") || f.cohort.includes("11"));
      if (activeMains.length > 0) {
        const dynamicTasks = activeMains.map((m, idx) => {
          const step = (idx % 3) + 1;
          const isCompleted = idx === 1;
          return {
            id: `dyn-task-${idx}`,
            rookie: m.rookie,
            cohort: m.cohort,
            dept: m.department || "인사팀",
            buddy: m.buddy,
            step,
            stepTitle: step === 1 ? "조직 내부 적응 가이드" : step === 2 ? "현업 OJT 트레인" : "노랑talk 소모임 가이드",
            worksheetStatus: isCompleted ? "완료" as const : "미발송" as const,
            rewardDesc: m.reward1Date ? `1차 포상 예정 (${m.reward1Date})` : `완료 종료일: ${m.endDate}`,
            status: isCompleted ? "배포완료" as const : "배포대기" as const,
            message: `📣 [${m.cohort} ${m.department || "HR"} ${m.rookie} 루키] 골든버디 선배 ${m.buddy}님! ${step}단계 미션 가이드 공유드립니다.`
          };
        });
        setTasks(dynamicTasks);
        return;
      }
    }
    setTasks(initialTasks);
  }, [mains]);

  const handleTestSend = async () => {
    if (!testPayload) return;
    setIsTestSending(true);
    appendTerminalLog(`[ SENDING ] Connecting to remote JANDI...`);
    
    try {
      const res = await sendJandiMessage({
        rookieName: "테스트 사원",
        message: testPayload
      });

      if (res.success) {
        appendTerminalLog(`[ SUCCESS ] JANDI message delivered!`);
        incrementAutomation();
      } else {
        appendTerminalLog(`[ FAILED ] Delivery failed: ${res.error}`);
      }
    } catch (e: any) {
      appendTerminalLog(`[ ERROR ] Network error: ${e.message}`);
    } finally {
      setIsTestSending(false);
    }
  };

  const handleOpenDeployModal = (task: RoutineTaskItem) => {
    setActiveModalTask(task);
  };

  const executeDeployAction = async (forceOnly = false) => {
    if (!activeModalTask) return;
    const task = activeModalTask;
    setActiveModalTask(null);

    appendTerminalLog(`[ DEPLOY ] Initializing worksheet guide handoff for ${task.rookie} Rookie...`);

    if (forceOnly) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "배포완료", worksheetStatus: "완료" } : t));
      appendTerminalLog(`[ BYPASSED ] Simple local complete marked. Webhook payload bypassed by user request.`);
      incrementAutomation();
      return;
    }

    // Call Jandi via modular sendJandiMessage
    try {
      appendTerminalLog(`[ SENDING ] Post request for Rookie: ${task.rookie} to JANDI...`);
      const fullMessage = `📢 온보딩 ${task.step}단계 미션 가이드 자동 발효\n> 동기화 대상: ${task.cohort} | 골든버디: ${task.buddy} ↔ 루키: ${task.rookie}\n\n${task.message}`;
      
      const res = await sendJandiMessage({
        rookieName: task.rookie,
        message: fullMessage
      });

      if (res.success) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "배포완료", worksheetStatus: "완료" } : t));
        appendTerminalLog(`[ SUCCESS ] Real-time notification delivered successfully to Golden Buddy ${task.buddy}.`);
        incrementAutomation();
      } else {
        appendTerminalLog(`[ ERROR ] Delivery rejected: ${res.error}`);
        alert(`잔디 메신저 연결에 문제가 있습니다: ${res.error}`);
      }
    } catch (err: any) {
      appendTerminalLog(`[ FAULT ] Network error on remote delivery: ${err.message}`);
      alert("네트워크 장애로 전송이 연기되었습니다. 터미널의 에러 로그를 검진하세요.");
    }
  };

  return (
    <div id="automation-terminal-row" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* LEFT COLUMN: 60% Width - 온보딩 스케줄 timeline 테이블 */}
      <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                ☘️ 실시간 온보딩 루틴 &amp; 활동지 배포 제어 (Onboarding Worksheets)
              </h3>
              <p className="text-slate-400 text-[10px] sm:text-[11px] mt-0.5">
                신생 12, 13기 노랑루키 가이드 매핑. 활동지를 실시간 격발 발송하여 소통 지연을 전면 타파합니다.
              </p>
            </div>
            <span className="text-[9px] bg-slate-50 border border-slate-150 px-2 py-0.5 text-slate-500 font-extrabold rounded-md uppercase font-mono">
              Live Scheduler
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100 mt-2">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-[9px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">루키 성명</th>
                  <th className="py-2.5 px-3">기수 / 부서</th>
                  <th className="py-2.5 px-3">다음 단계 일정</th>
                  <th className="py-1.5 px-2 text-center">활동지 배포</th>
                  <th className="py-2.5 px-3">포상금 예정일</th>
                  <th className="py-2.5 px-3 text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-extrabold text-slate-800">
                      {task.rookie}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-600">
                      {task.cohort} {task.dept}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-indigo-600">
                      {task.step}단계 진행중
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {task.status === "배포완료" ? (
                        <span className="bg-slate-50 text-slate-400 border border-slate-200 px-2 py-1 rounded font-bold text-[9px] inline-block">
                          ✅ 배포완료
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenDeployModal(task)}
                          className="cursor-pointer bg-indigo-600 hover:bg-indigo-720 text-white font-extrabold px-2.5 py-1 rounded text-[9px] hover:shadow-xs active:scale-95 transition-all inline-block select-none"
                        >
                          활동지 배포
                        </button>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-520">
                      {task.rewardDesc}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                        task.status === "배포완료"
                          ? "bg-slate-100 text-slate-600 border border-slate-200"
                          : "bg-indigo-100 text-indigo-700 border border-indigo-200 animate-pulse"
                      }`}>
                        {task.status === "배포완료" ? "완료" : "배포대기"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-[10px] text-slate-400 leading-normal">
          * 테이블 정보는 인사팀 내부 메인 대장과 실시간 동조됩니다. 정기 알림 배포가 마감되면 1차/2차 포상 승인 일정과 자동 연산되어 연동됩니다.
        </div>
      </div>

      {/* RIGHT COLUMN: 40% Width - JANDI Webhook 및 실시간 로그 터미널 */}
      <div className="lg:col-span-5 bg-slate-850 rounded-3xl p-6 border border-slate-750 flex flex-col justify-between text-white shadow-xl min-h-[350px]">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <h3 className="text-sm font-black text-slate-200 tracking-tight font-sans">
                🍀 JANDI 자동 통보 및 실시간 커넥터 로그 (Logs Terminal)
              </h3>
            </div>
            <button 
              onClick={clearTerminalLogs}
              title="콘솔 로그 초기화"
              className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <Trash className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 bg-slate-900 rounded-xl p-4 border border-slate-700/50">
            <div className="text-slate-800">
              <JandiConfigForm />
            </div>
             <div className="space-y-1.5">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">메시지 실시간 즉시 발송기</label>
              <div className="flex flex-col gap-2">
                <textarea
                  rows={12}
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  placeholder="발송할 메시지 내용을 입력하세요..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-300 focus:outline-none focus:border-indigo-500 font-medium resize-y min-h-[140px] leading-relaxed"
                />
                <button
                  onClick={handleTestSend}
                  disabled={isTestSending || !testPayload}
                  className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 font-bold text-[10px] py-2 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1 shrink-0 select-none text-white shadow-md shadow-emerald-600/10"
                >
                  <Send className="w-3.5 h-3.5" />
                  즉시 발송 실행
                </button>
              </div>
            </div>
          </div>

          {/* Shell logging Console screen */}
          <div className="mt-4 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-[9px] text-zinc-300 h-[120px] overflow-y-auto leading-relaxed shadow-inner">
            {terminalLogs.length === 0 ? (
              <p className="text-zinc-650 italic">[ System ] No ongoing socket connections. Monitoring inactive.</p>
            ) : (
              <div className="space-y-1">
                {terminalLogs.map((log, idx) => (
                  <p key={idx} className={
                    log.includes("ERROR") || log.includes("FAILED") ? "text-rose-400" :
                    log.includes("SUCCESS") || log.includes("ONLINE") ? "text-emerald-400" :
                    log.includes("DEPLOY") ? "text-indigo-300" :
                    "text-zinc-300"
                  }>
                    {log}
                  </p>
                ))}
                <div ref={terminalEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between text-[9px] text-slate-500 font-semibold font-mono">
          <span>PORT: 3000 | HOST: 0.0.0.0</span>
          <span>WEBSOCKET CONNECTED</span>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 2. Custom JANDI Modal Overlay Dialog (Bypasses parent blockers) */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeModalTask && (
        <div id="jandi-modal-overlay" className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-205 max-w-md w-full shadow-2xl overflow-hidden transform duration-200 scale-100 text-slate-800">
            
            <div className="bg-slate-50 px-6 py-4.5 border-b border-slate-100 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Send className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">🍀 잔디(JANDI) 실시간 발송 승인</h4>
                <p className="text-[10px] text-slate-400 font-medium">온보딩 수동 스마트 격발 시스템 가속기</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 text-[11px] text-slate-600 space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">발송 목적 기수:</span>
                  <span className="font-bold text-slate-800">{activeModalTask.cohort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">버디 수신 대상:</span>
                  <span className="font-bold text-slate-800">골든버디 {activeModalTask.buddy} 선배</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">담당 루키 이름:</span>
                  <span className="font-bold text-slate-800">{activeModalTask.rookie} (온보딩 {activeModalTask.step}단계 미션)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">마일스톤 주제:</span>
                  <span className="font-bold text-indigo-700 text-[11px] truncate max-w-[200px]">{activeModalTask.stepTitle}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">발송 메시지 본문 가이드</label>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-700 leading-relaxed font-sans max-h-36 overflow-y-auto italic whitespace-pre-line shadow-3xs">
                  {activeModalTask.message}
                </div>
              </div>
              
              <div className="bg-indigo-50 text-indigo-700 rounded-xl p-3.5 text-[10px] leading-relaxed border border-indigo-150/40">
                💡 <b>조작 안내</b>: '발송 실행'을 클릭하면 기입된 수신 웹훅으로 알림이 즉시 격발됩니다. 웹훅 연결 없이 완료 처리만 하실 분은 왼쪽 아래의 '단순 완료 강제전환' 버튼을 활용해 주십시오.
              </div>
            </div>

            <div className="bg-slate-50/70 px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => executeDeployAction(true)}
                className="cursor-pointer text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all text-[11px] font-bold px-3 py-2 rounded-xl border border-slate-200"
              >
                단순 완료 강제전환
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveModalTask(null)}
                  className="cursor-pointer text-slate-500 hover:bg-slate-100 active:scale-95 transition-all text-[11px] font-bold px-4 py-2 rounded-xl"
                >
                  취소
                </button>
                <button
                  onClick={() => executeDeployAction(false)}
                  className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] px-5 py-2 rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  발송 실행
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
