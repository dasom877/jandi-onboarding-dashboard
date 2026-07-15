import React, { useState } from "react";
import { Send, CheckCircle2, MessageSquare, AlertCircle } from "lucide-react";
import { sendJandiMessage } from "../utils/jandiSender";
import JandiConfigForm from "./JandiConfigForm";

interface DashboardJandiSenderProps {
  appendTerminalLog: (msg: string) => void;
  incrementAutomation: () => void;
}

export default function DashboardJandiSender({ appendTerminalLog, incrementAutomation }: DashboardJandiSenderProps) {
  const [message, setMessage] = useState(`🌾[공지] 3단계 활동 안내
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
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; msg?: string }>({ type: "idle" });

  const templates = [
    {
      label: "🌾 3단계 활동 안내",
      text: `🌾[공지] 3단계 활동 안내
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
감사합니다.`
    },
    {
      label: "📋 일일 현황",
      text: "📊 [일일 버디-루키 현황] 금일 입사한 신규 노랑루키 사원 총 2명의 1일차 가이드가 무사히 개시되었습니다. 선배 골든버디와의 매칭 정합성이 100% 가동 중입니다."
    },
    {
      label: "💰 포상 대상",
      text: "💰 [근속 포상 대상자 안내] 금주 6달 근속을 달성한 기수 루키 3명의 2차 포상 품의 상신이 대기 중입니다. 인사담당자 검토 후 대시보드에서 일괄 승인 바랍니다."
    },
    {
      label: "⚠️ 미수행 경고",
      text: "⚠️ [미활동 조치 경보] 14기 IT개발부 '김루키' 사원의 1주차 적응 미션 마감 기한이 초과되었습니다. 버디 '박선배' 파트너에게 리마인드 푸시 알림을 자동 전송합니다."
    }
  ];

  const handleSend = async () => {
    if (!message.trim()) {
      setStatus({ type: "error", msg: "전송할 메시지 내용을 입력해주세요." });
      return;
    }

    setIsSending(true);
    setStatus({ type: "idle" });
    appendTerminalLog(`JANDI (Client): Preparing payload to send live message...`);

    try {
      const res = await sendJandiMessage({
        rookieName: "전체 공지",
        message: message.trim()
      });

      if (res.success) {
        setStatus({ type: "success", msg: "잔디 채널로 메시지 전송이 완료되었습니다!" });
        appendTerminalLog(`JANDI (Client): Message successfully delivered. Status: ${res.status || 200}`);
        incrementAutomation();
      } else {
        setStatus({ type: "error", msg: `⚠️ 전송 실패: ${res.error}` });
        appendTerminalLog(`JANDI (Client) Error: ${res.error}`);
      }
    } catch (error: any) {
      console.error("통신 에러 발생:", error);
      setStatus({ type: "error", msg: "⚠️ 네트워크 오류가 발생했습니다." });
      appendTerminalLog(`JANDI (Client) Error: ${error.message || error}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div id="dashboard-jandi-sender" className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs relative overflow-hidden transition-all hover:border-slate-300">
      
      {/* Decorative Jandi integration ribbon */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></span>
            🍀 실시간 잔디(JANDI) 메신저 즉시 발송기
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-medium">
            현재 보고 계신 <b>통합 대시보드</b> 화면에서 직접 또는 구글 Apps Script 연동 웹 앱을 거쳐 잔디 업무 대화방으로 실시간 실무 메시지를 송신합니다.
          </p>
        </div>

        {/* Status indicator badge */}
        <div className="shrink-0">
          {status.type === "success" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[9px] font-extrabold animate-bounce">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              잔디 전송 완료!
            </span>
          )}
          {status.type === "error" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 rounded-full text-[9px] font-extrabold">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              전송 오류 발생
            </span>
          )}
          {status.type === "idle" && !isSending && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-full text-[9px] font-extrabold">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              커넥트 준비 완료
            </span>
          )}
          {isSending && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-[9px] font-extrabold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              잔디로 전송 요청 중...
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Form (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Integrated Config Form */}
          <JandiConfigForm />

          {/* Message Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                전송할 업무 알림 내용 (JANDI Message Body - Markdown 지원)
              </label>
              <span className="text-[9px] text-slate-400 font-medium">실시간 전송 지원</span>
            </div>
            <textarea
              rows={24}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="잔디 방으로 발송할 실시간 안내 문구를 적어주세요..."
              className="w-full text-[11px] leading-relaxed bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4.5 py-3 font-medium text-slate-700 placeholder-slate-350 transition-all focus:outline-hidden resize-y min-h-[350px]"
            />
          </div>

          {/* Feedback messages if any */}
          {status.msg && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
              status.type === "success" 
                ? "bg-emerald-50 border-emerald-150 text-emerald-800" 
                : "bg-rose-50 border-rose-150 text-rose-800"
            }`}>
              {status.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <div className="text-[10px] font-bold leading-relaxed">
                {status.msg}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Templates and Sending Action (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-slate-50 border border-slate-150 rounded-2xl p-4.5">
          
          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              업무용 퀵 템플릿 상신 (Quick Template)
            </span>
            <div className="space-y-1.5">
              {templates.map((tpl, idx) => (
                <button
                  key={idx}
                  onClick={() => setMessage(tpl.text)}
                  className="w-full text-left bg-white hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 transition-all text-[10px] font-extrabold text-slate-700 flex items-center justify-between cursor-pointer group"
                >
                  <span>{tpl.label}</span>
                  <span className="text-[8px] text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity font-extrabold">템플릿 적용</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200/60">
            <button
              onClick={handleSend}
              disabled={isSending || !message.trim()}
              className={`w-full py-3.5 rounded-xl text-xs font-black tracking-tight text-white flex items-center justify-center gap-2 select-none shadow-md shadow-emerald-500/10 active:scale-98 transition-all cursor-pointer ${
                isSending || !message.trim()
                  ? "bg-slate-300 border-slate-300 cursor-not-allowed shadow-none"
                  : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20"
              }`}
            >
              <Send className="w-3.5 h-3.5 text-amber-300" />
              {isSending ? "전송 요청 중..." : "잔디로 알림 전송 실행"}
            </button>
            <p className="text-[8px] text-center text-slate-400 mt-2 font-medium leading-normal">
              통보 수단 제어 설정에 맞추어 직접 웹훅 또는 구글 스프레드시트 Apps Script 릴레이로 전송됩니다.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
