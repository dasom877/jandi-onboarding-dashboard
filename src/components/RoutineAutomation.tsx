import React, { useState, useEffect } from "react";
import { OnboardingMain, ActivitySchedule } from "../types";
import {
  Bell,
  Send,
  CheckCircle,
  Edit3,
  Trash2,
  Clock,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Layers,
  HelpCircle,
  UserCheck,
  FileText,
  Link2,
  Globe
} from "lucide-react";
import {
  sendJandiMessage,
  getJandiSettings,
  getJandiWebhooks,
  getSelectedWebhookId,
  setSelectedWebhookId,
  JandiWebhookChannel
} from "../utils/jandiSender";
import JandiConfigForm from "./JandiConfigForm";

interface RoutineAutomationProps {
  mains: OnboardingMain[];
  schedules: ActivitySchedule[];
}

interface NotificationQueueItem {
  id: string;
  cohort: string;
  buddy: string;
  rookie: string;
  step: string;
  stepTitle: string;
  message: string;
  status: "배포대기" | "배포완료";
}

interface TimelineAlertItem {
  id: string;
  targetCohort: string;
  targetPerson: string;
  type: "D-7" | "D-3" | "D-Day";
  title: string;
  description: string;
  deadlineDate: string;
  status: "unread" | "checked";
}

// Notification Category Enum matching the user's specific items
type NotificationCategory =
  | "D-3 긴급 리마인드"
  | "온보딩 안내 - 1단계"
  | "온보딩 안내 - 2-1단계"
  | "온보딩 안내 - 2-2단계"
  | "온보딩 안내 - 2-3단계"
  | "온보딩 안내 - 2-4단계"
  | "3단계"
  | "만족도조사";

export default function RoutineAutomation({ mains, schedules }: RoutineAutomationProps) {
  // 1. Core State
  const [channels, setChannels] = useState<JandiWebhookChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>("channel-1");
  const [notificationQueue, setNotificationQueue] = useState<NotificationQueueItem[]>([]);
  const [timelineAlerts, setTimelineAlerts] = useState<TimelineAlertItem[]>([]);
  
  // Custom Toast state
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: "success" | "error" | "info" }>({
    show: false,
    msg: "",
    type: "info"
  });

  const showToastMessage = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ show: true, msg, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  // 2. Load Jandi Channels on Mount & listen to storage events
  useEffect(() => {
    setChannels(getJandiWebhooks());
    setActiveChannelId(getSelectedWebhookId());

    const handleStorageChange = () => {
      setChannels(getJandiWebhooks());
      setActiveChannelId(getSelectedWebhookId());
    };
    window.addEventListener("storage_jandi_settings", handleStorageChange);
    return () => {
      window.removeEventListener("storage_jandi_settings", handleStorageChange);
    };
  }, []);

  const handleActiveChannelChange = (id: string) => {
    setActiveChannelId(id);
    setSelectedWebhookId(id);
    showToastMessage(`🎯 수신 채널이 변경되었습니다: ${channels.find(c => c.id === id)?.name || "기본 채널"}`, "info");
  };

  // 3. Draft Builder State
  const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>("온보딩 안내 - 1단계");
  
  // Editable customization state
  const [customCohort, setCustomCohort] = useState("");
  const [customBuddy, setCustomBuddy] = useState("");
  const [customRookie, setCustomRookie] = useState("");
  
  // Customize Links requested by user: "여기서 기수별로 이름이랑 링크만 교체할 수 있게 재구성해줘"
  const [linkSheet, setLinkSheet] = useState("https://docs.google.com/spreadsheets/d/1IV0nE90c1Bye-jDXs4SO9CnjxiUaAilQhsc-B_7mXeY/edit");
  const [linkBuddyForm, setLinkBuddyForm] = useState("https://forms.gle/dZ2oJwEFiis3TNm68");
  const [linkRookieForm, setLinkRookieForm] = useState("https://forms.gle/MVpf5BCRWnwSVcPA8");

  // Final message editor body
  const [finalDraftText, setFinalDraftText] = useState("");
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);
  const [jandiStatus, setJandiStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; msg?: string }>({ type: "idle" });

  // Filter unique valid Buddy-Rookie pairs from Google Sheets mains data
  const buddyRookiePairs = React.useMemo(() => {
    if (!mains || mains.length === 0) {
      return [
        { cohort: "13기", buddy: "김현우", rookie: "이지민", department: "플랫폼개발팀" },
        { cohort: "13기", buddy: "송호준", rookie: "강하늘", department: "HR전략팀" },
        { cohort: "12기", buddy: "장세라", rookie: "김노랑", department: "브랜드디자인팀" },
        { cohort: "12기", buddy: "이지훈", rookie: "이빛나", department: "글로벌마케팅본부" }
      ];
    }
    
    return mains
      .filter(item => item.buddy && item.buddy !== "미지정" && item.rookie && item.rookie !== "미지정")
      .map(item => ({
        cohort: item.cohort || "선택기수",
        buddy: item.buddy,
        rookie: item.rookie,
        department: item.department || "현업부서"
      }));
  }, [mains]);

  // Sync loaded dropdown pair selection to inputs
  useEffect(() => {
    if (buddyRookiePairs.length > 0 && selectedPairIndex < buddyRookiePairs.length) {
      const activePair = buddyRookiePairs[selectedPairIndex];
      setCustomCohort(activePair.cohort);
      setCustomBuddy(activePair.buddy);
      setCustomRookie(activePair.rookie);
      setIsManuallyEdited(false); // Reset manual lock on identity switch
    }
  }, [buddyRookiePairs, selectedPairIndex]);

  // Standard Template Definitions
  const templates: Record<NotificationCategory, string> = {
    "D-3 긴급 리마인드": `⏰ [D-3 긴급 리마인드] 온보딩 활동지 제출 긴급 리마인드 알림 ⏰

안녕하세요, {버디} 버디 선배님, {루키} 루키님! 😊
두 분이 진행하고 계신 온보딩 단계 활동 가이드 및 미션지 제출 마감이 단 [3일] 남았습니다.

아직 제출을 완료하지 않으셨다면, 기한 내 아래 제출 링크를 확인하셔서 동행 미션 결과물을 제출해 주시길 부탁드립니다.

📌 대상: {기수} ({버디} 버디 선배님 ↔ {루키} 루키님)
📅 제출 마감일: 2026.06.30(화) 23:59까지
🔗 버디 미션지 제출 : {버디링크}
🔗 루키 미션지 제출 : {루키링크}

마지막까지 유대 가득히 잘 마무리하실 수 있도록 인사팀에서 응원합니다! 💛`,

    "온보딩 안내 - 1단계": `💛 [온보딩 안내 - 1단계] 사내 정착 및 상호 문화 적응의 첫 걸음 💛

안녕하세요, {기수} 골든버디 {버디}님, 노랑루키 {루키}님! 😊
드디어 두 분의 뜻깊은 동행, 온보딩 1단계 활동이 시작되었습니다!

1단계 활동은 사내 적응을 위한 가벼운 대면 대화와 기본 인트라넷 인프라 환경 조성을 목적으로 합니다. 아래 전체 가이드 시트와 제출 폼을 활용해 첫 단추를 채워보세요!

📌 단계명: 1단계 - 조직 내부 적응 및 회사 문화 이해
📅 권장 기간: 입사 후 2주일 이내
🔗 온보딩 가이드 전체 시트 : {시트링크}
🔗 [버디용] 1단계 제출폼 : {버디링크}
🔗 [루키용] 1단계 제출폼 : {루키링크}

두 분이 만들어낼 따뜻하고 멋진 에너지를 온 마음으로 기대하고 응원합니다! 🚀`,

    "온보딩 안내 - 2-1단계": `🚀 [온보딩 안내 - 2-1단계] 부서 실무 밀착 적응 및 기초 업무 싱크 🚀

안녕하세요, {기수} 골든버디 {버디}님, 노랑루키 {루키}님! 😊
본격적인 실무 적응의 첫 매듭인 온보딩 2-1단계 활동을 안내해 드립니다.

이번 단계부터는 부서 내 업무 프로세스에 가볍게 탑승하는 OJT 기반 소통이 중요해집니다. 버디 선배님과 함께 일일 실무 가이드를 정렬하고 활동을 진행해 보세요!

📌 단계명: 2-1단계 - 현업 트레이닝 및 일일 미션
📅 권장 기간: 입사 3주 ~ 4주차 진행
🔗 온보딩 가이드 전체 시트 : {시트링크}
🔗 [버디용] 2-1단계 제출폼 : {버디링크}
🔗 [루키용] 2-1단계 제출폼 : {루키링크}

매일 조금씩 성장해 가는 소중한 일상을 인사팀이 항상 지지합니다. 💛`,

    "온보딩 안내 - 2-2단계": `🚀 [온보딩 안내 - 2-2단계] 중기 직무 적응력 진단 및 상호 피드백 🚀

안녕하세요, {기수} 골든버디 {버디}님, 노랑루키 {루키}님! 😊
업무 속도가 붙기 시작하는 온보딩 2-2단계 진행 안내입니다.

서로의 일하는 방식을 한층 더 이해하고, 부서 내 소통 채널과 가이드를 조율하며 보다 편안한 안착 상태를 완성해 나가는 기간입니다.

📌 단계명: 2-2단계 - 직무 성숙도 점검 및 정기 미팅
📅 권장 기간: 입사 5주 ~ 6주차 진행
🔗 온보딩 가이드 전체 시트 : {시트링크}
🔗 [버디용] 2-2단계 제출폼 : {버디링크}
🔗 [루키용] 2-2단계 제출폼 : {루키링크}

궁금하거나 아쉬운 부분은 서로 편안하게 나누며 즐거운 소통 이어가세요! 👍`,

    "온보딩 안내 - 2-3단계": `🚀 [온보딩 안내 - 2-3단계] 심화 실무 협업 및 상호 신뢰 제고 🚀

안녕하세요, {기수} 골든버디 {버디}님, 노랑루키 {루키}님! 😊
협동 활동의 깊이를 더해가는 온보딩 2-3단계 활동을 안내해 드립니다.

이제 루키님도 부서 내에서 주도적으로 목소리를 내며 신뢰받는 동료로 무럭무럭 자라고 있습니다! 버디 선배님과 함께 중간 회고를 나누며 상호 성장 가속도를 높여보세요.

📌 단계명: 2-3단계 - 실무 독립성 확보 및 파트너십 구축
📅 권장 기간: 입사 7주 ~ 8주차 진행
🔗 온보딩 가이드 전체 시트 : {시트링크}
🔗 [버디용] 2-3단계 제출폼 : {버디링크}
🔗 [루키용] 2-3단계 제출폼 : {루키링크}

두 분이 서로 주고받는 따뜻한 피드백이 최고의 성장 밑거름입니다. 🌟`,

    "온보딩 안내 - 2-4단계": `🚀 [온보딩 안내 - 2-4단계] 실무 밀착 2단계 마무리 및 종합 자가 회고 🚀

안녕하세요, {기수} 골든버디 {버디}님, 노랑루키 {루키}님! 😊
어느덧 직무 적응을 총망라하는 대망의 2단계 최종 마디(2-4단계)에 도달했습니다!

그동안 버디 선배님과 호흡하며 갈고닦아온 팀 내 직무 적응 상태를 스스로 점검하고 종합적인 피드백을 공유하는 마스터클래스 주간입니다.

📌 단계명: 2-4단계 - 최종 실무 자가진단 및 종합 회고
📅 권장 기간: 입사 9주 ~ 10주차 진행
🔗 온보딩 가이드 전체 시트 : {시트링크}
🔗 [버디용] 2-4단계 제출폼 : {버디링크}
🔗 [루키용] 2-4단계 제출폼 : {루키링크}

서로의 앞날을 가장 든든히 격려하며 멋지게 2단계를 마무리하세요! 💛`,

    "3단계": `🌾 [공지] 3단계 활동 안내 - '노랑talk' (1:1 밀착 소통) 💬

안녕하세요, {기수} 골든버디 - 노랑루키 여러분 😊
어느덧 온보딩 공식 프로그램의 멋진 피날레인 [3단계 활동]을 기쁜 마음으로 안내드립니다!

이번 3단계는 학습이나 실무 무거운 주제가 아니라, 서로를 향한 따뜻한 안착 축하와 1:1 진솔한 티타임 소통 미션입니다.

회사 지원비(3만원 상당)로 맛있는 커피와 디저트를 나누며 편안한 회포를 한 숟가락 풀어보세요! 💛

👇 활동 및 제출 가이드:
1. 3단계 활동지 및 제출 링크 확인
   - 버디 활동지: {버디링크}
   - 루키 활동지: {루키링크}

2. [협동 미션] 대면 티타임 만남 후 각각 설문 형태로 미션지 작성
3. 활동 및 제출 마감일: 2026.06.30(화)까지

※ 다음 온보딩 준비와 원활한 행정 지원을 위해 제출 마감일은 반드시 엄수해 주시길 부탁드립니다! 
궁금한 점은 언제든 온보딩 안내방이나 잔디로 인사팀에 편하게 노크해 주세요. 감사합니다! 💛`,

    "만족도조사": `📊 [설문] 3개월 온보딩 프로그램 종합 만족도 및 피드백 조사 안내 📊

안녕하세요, {기수} 버디님, 루키님! 😊

약 3개월간의 기나긴 온보딩 프로그램 대장정을 완주해 내신 두 분께 진심 어린 축하와 깊은 감사의 박수를 올립니다. 👏

더 나은 온보딩 복지와 따뜻한 동행 문화를 가꾸어 나가기 위해 두 분의 진솔한 피드백과 설문을 경청하고자 하니, 한 분도 빠짐없이 참여를 부탁드립니다!

📌 대상: {기수} 전체 골든버디 및 노랑루키
📅 설문 제출 기한: 2026.07.03(금)까지
🔗 만족도 종합 설문 링크 : {루키링크}

남겨주시는 정성 어린 한 마디가 다음 기수에 합류할 새로운 루키들의 길을 이끄는 소중한 나침반이 됩니다. 감사합니다! 💛`
  };

  // Live Interpolation of placeholders in real-time
  useEffect(() => {
    if (!isManuallyEdited) {
      const templateText = templates[selectedCategory];
      const interpolated = templateText
        .replace(/{기수}/g, customCohort || "기수 미정")
        .replace(/{버디}/g, customBuddy || "버디 미정")
        .replace(/{루키}/g, customRookie || "루키 미정")
        .replace(/{시트링크}/g, linkSheet)
        .replace(/{버디링크}/g, linkBuddyForm)
        .replace(/{루키링크}/g, linkRookieForm);
      setFinalDraftText(interpolated);
    }
  }, [
    selectedCategory,
    customCohort,
    customBuddy,
    customRookie,
    linkSheet,
    linkBuddyForm,
    linkRookieForm,
    isManuallyEdited
  ]);

  // Handle send trigger for custom draft builder
  const handleSendDraft = async () => {
    if (!finalDraftText.trim()) return;

    try {
      setJandiStatus({ type: "loading" });
      const activeChan = channels.find(c => c.id === activeChannelId) || channels[0];
      const targetWebhookUrl = activeChan ? activeChan.url : "";

      showToastMessage(`🚀 [발송중] '${activeChan?.name || "지정 잔디방"}'으로 실시간 알림 전송 중...`, "info");

      const response = await sendJandiMessage({
        rookieName: customRookie,
        message: finalDraftText,
        webhookUrl: targetWebhookUrl
      });

      if (response.success) {
        setJandiStatus({ type: "success", msg: "성공적으로 실시간 전송 완료!" });
        showToastMessage(`🎉 [전송 성공] 잔디 채널 '${activeChan?.name}'에 온보딩 공지가 성공적으로 전송되었습니다!`, "success");
        
        // Push to temporary queue to show historical sends
        const newQueueItem: NotificationQueueItem = {
          id: `q-sent-${Date.now()}`,
          cohort: customCohort,
          buddy: customBuddy,
          rookie: customRookie,
          step: selectedCategory.includes("1단계") ? "1단계" : selectedCategory.includes("2단계") || selectedCategory.includes("2-") ? "2단계" : "3단계",
          stepTitle: selectedCategory,
          message: finalDraftText,
          status: "배포완료"
        };
        setNotificationQueue(prev => [newQueueItem, ...prev]);
      } else {
        setJandiStatus({ type: "error", msg: `전송 실패: ${response.error}` });
        showToastMessage(`❌ [전송 실패] 잔디 웹훅 연결 상태를 점검해 주세요. 에러: ${response.error}`, "error");
      }
    } catch (err: any) {
      setJandiStatus({ type: "error", msg: err.message || "연결 통신 에러" });
      showToastMessage(`❌ [네트워크 오류] 잔디 통신 실패: ${err.message}`, "error");
    }
  };

  // Initialize Timeline Alert & Release Queue from 'mains'
  React.useEffect(() => {
    if (mains && mains.length > 0) {
      const activeMains = mains.filter(
        person =>
          person.cohort &&
          (person.cohort.includes("12") ||
            person.cohort.includes("13") ||
            person.cohort.includes("12기") ||
            person.cohort.includes("13기"))
      );
      
      const targetMains = activeMains.length > 0 ? activeMains : mains;

      // 1. Build initial scheduler queue for information
      const initialQueue: NotificationQueueItem[] = [];
      targetMains.slice(0, 5).forEach((person, idx) => {
        const stepNum = (idx % 3) + 1;
        let stepLabel = `${stepNum}단계`;
        let stepTitleText = stepNum === 1 ? "온보딩 안내 - 1단계" : stepNum === 2 ? "온보딩 안내 - 2-1단계" : "3단계";
        
        let messageText = `💛 [${person.cohort} 골든버디 ${person.buddy}님] 오늘부터 ${person.rookie} 루키님의 1단계 활동이 공식 시작됩니다! 첫 주 차에는 사내 인트라넷 환경설정과 웰컴 온보딩 세션을 챙겨주세요.\n🔗 시트링크: ${linkSheet}`;
        if (stepNum === 2) {
          messageText = `🚀 [${person.cohort} 골든버디 ${person.buddy}님] ${person.rookie} 루키님이 본격적인 부서 실무 궤도에 진입합니다! OJT 일일 미션을 진행해 주시고 피드백을 등록해 주세요.\n🔗 미션제출: ${linkBuddyForm}`;
        } else if (stepNum === 3) {
          messageText = `💬 [${person.cohort} 골든버디 ${person.buddy}님] 오늘부터 3단계 '노랑talk' 미션 주간입니다! 회사 지원비(3만원 상당)로 ${person.rookie} 루키님과 맛있는 티타임을 즐기며 소통 회포를 풀어주세요.`;
        }

        initialQueue.push({
          id: `q-init-${idx}`,
          cohort: person.cohort,
          buddy: person.buddy,
          rookie: person.rookie,
          step: stepLabel,
          stepTitle: stepTitleText,
          message: messageText,
          status: "배포대기"
        });
      });
      setNotificationQueue(initialQueue);

      // 2. Build Timeline alerts
      const actualAlerts: TimelineAlertItem[] = [];
      targetMains.forEach((person, idx) => {
        if (person.reward1Date) {
          actualAlerts.push({
            id: `t-act-1-${idx}`,
            targetCohort: person.cohort,
            targetPerson: person.rookie,
            type: "D-7",
            title: `1차 포상금 지급일정 도래 (${person.rookie} 루키)`,
            description: `${person.cohort} ${person.rookie} 루키의 3개월 정착 포상금 지급일(${person.reward1Date})이 일주일 앞으로 다가왔습니다. 지속 근속 여부를 점검하시고 지급 기안을 완료해 주세요.`,
            deadlineDate: person.reward1Date,
            status: "unread"
          });
        }
        if (person.reward2Date) {
          actualAlerts.push({
            id: `t-act-2-${idx}`,
            targetCohort: person.cohort,
            targetPerson: person.rookie,
            type: idx % 2 === 0 ? "D-3" : "D-Day",
            title: `2차 6개월 만기 정착 완주 포상 (${person.rookie} 루키)`,
            description: `${person.cohort} ${person.rookie} 루키의 6개월 만기일(${person.reward2Date})입니다! 정상 안착이 완료되었으니 2차 완주 축하금 50만원 품의안을 결재 처리하십시오.`,
            deadlineDate: person.reward2Date,
            status: "unread"
          });
        }
      });
      
      if (actualAlerts.length === 0) {
        setTimelineAlerts([
          {
            id: "t-fb-1",
            targetCohort: "13기",
            targetPerson: "이지민",
            type: "D-3",
            title: "활동 1단계 주간 피드백 등록 기한 경과",
            description: "13기 이지민 루키의 입사 적응 주간이 종료됩니다. 골든버디 김현우 선배님의 1주차 피드백 등록 여부를 모니터링하세요.",
            deadlineDate: "2026-07-02",
            status: "unread"
          },
          {
            id: "t-fb-2",
            targetCohort: "13기",
            targetPerson: "강하늘",
            type: "D-7",
            title: "3개월 안착 포상 심사 예정 (송호준 버디)",
            description: "13기 강하늘 루키의 입사 90일 근속 예정 포상일입니다. 중도 이탈 없는 안정적인 근무가 지속 중입니다.",
            deadlineDate: "2026-09-01",
            status: "unread"
          }
        ]);
      } else {
        setTimelineAlerts(actualAlerts.slice(0, 8)); // Max 8 for clean aesthetics
      }
    }
  }, [mains]);

  const handleMarkAlert = (id: string) => {
    setTimelineAlerts(prev =>
      prev.map(alert => (alert.id === id ? { ...alert, status: "checked" } : alert))
    );
    showToastMessage("Checked!", "success");
  };

  const handleForceComplete = (id: string) => {
    setNotificationQueue(prev =>
      prev.map(q => (q.id === id ? { ...q, status: "배포완료" } : q))
    );
    showToastMessage("상태가 강제로 '배포완료'로 승인 전환되었습니다.", "info");
  };

  return (
    <div id="routine-automation" className="space-y-8 animate-fadeIn">
      {/* 1. Header Information Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="bg-indigo-500/20 text-indigo-300 font-extrabold text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border border-indigo-500/30">
              Onboarding Communication Engine
            </span>
            <h3 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2">
              <Bell className="w-6 h-6 text-indigo-400" />
              온보딩 표준 알림 및 잔디(JANDI) 연동 센터
            </h3>
            <p className="text-slate-400 text-xs max-w-3xl leading-relaxed">
              기수별 대상자 선정, 가이드북 링크 교체, 표준 단계별 메시지 템플릿 실시간 치환을 지원하여 잔디 채널로 가장 완벽한 톤앤매너 공지 사항을 안전하게 발송할 수 있도록 재구성된 통합 대시보드입니다.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700/60 font-mono shrink-0">
            <div className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <div className="text-xs">
              <span className="text-slate-400 block text-[9px] font-semibold uppercase tracking-wider">현재 선택된 잔디방</span>
              <span className="font-bold text-emerald-400 truncate max-w-[160px] block">
                {channels.find(c => c.id === activeChannelId)?.name || "기본 연결 채널"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Standard Step-by-Step Draft Builder Widget (PRESET MULTI-WEBHOOK LINKED) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4.5 bg-indigo-600 rounded-full"></span>
              🎯 단계별 표준 알림 초안 제작 및 발송기 (Step Draft System)
            </h4>
            <p className="text-slate-400 text-[11px] font-medium">
              원하는 버디-루키를 선택하고 알림 구분을 고르면 기수별 이름과 공유 링크가 적용된 표준 템플릿이 자동으로 완성됩니다.
            </p>
          </div>
          
          {/* Quick Target Channel Selector inside Builder */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider shrink-0">수신 채널 변경:</span>
            <select
              value={activeChannelId}
              onChange={(e) => handleActiveChannelChange(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {channels.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Builder Inputs Controls */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-5 space-y-4.5">
            {/* Step A: Selector Target Buddy / Rookie */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                1. 대상 버디 / 루키 선택 (동기화 데이터 연동)
              </label>
              <select
                value={selectedPairIndex}
                onChange={(e) => setSelectedPairIndex(Number(e.target.value))}
                className="w-full text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-800 rounded-xl px-3 py-3 focus:outline-none transition-all cursor-pointer"
              >
                {buddyRookiePairs.map((pair, idx) => (
                  <option key={idx} value={idx}>
                    [{pair.cohort}] {pair.buddy} 버디 ↔ {pair.rookie} 루키 ({pair.department})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 font-medium">
                * 위 목록은 "AI 온보딩 대시보드" 구글 시트에서 실시간 수합한 입사 기록 데이터베이스에서 자동 수집되었습니다.
              </p>
            </div>

            {/* Manual tweaks if needed */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[9px] font-bold text-slate-400 block mb-1">기수 수정</span>
                <input
                  type="text"
                  value={customCohort}
                  onChange={(e) => {
                    setCustomCohort(e.target.value);
                    setIsManuallyEdited(false);
                  }}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 block mb-1">버디 이름</span>
                <input
                  type="text"
                  value={customBuddy}
                  onChange={(e) => {
                    setCustomBuddy(e.target.value);
                    setIsManuallyEdited(false);
                  }}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 font-bold text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 block mb-1">루키 이름</span>
                <input
                  type="text"
                  value={customRookie}
                  onChange={(e) => {
                    setCustomRookie(e.target.value);
                    setIsManuallyEdited(false);
                  }}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 font-bold text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Step B: Notification Category Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                2. 알림 구분 선택 (8가지 고정 분류)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(templates) as NotificationCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setIsManuallyEdited(false);
                    }}
                    className={`cursor-pointer px-2.5 py-2.5 text-left rounded-xl border text-[10px] font-bold transition-all truncate flex items-center gap-1.5 ${
                      selectedCategory === cat
                        ? "bg-slate-900 border-slate-950 text-white shadow-xs"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      cat === "D-3 긴급 리마인드" ? "bg-rose-500 animate-pulse" :
                      cat.startsWith("온보딩 안내 - 1") ? "bg-indigo-500" :
                      cat.includes("2단계") || cat.includes("2-") ? "bg-amber-500" :
                      cat === "3단계" ? "bg-emerald-500" : "bg-sky-500"
                    }`}></span>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Step C: Customize Links */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                3. 기수 대표 전용 가이드 & 설문 제출 링크 교체
              </span>
              
              <div className="space-y-2.5 text-[11px]">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-extrabold text-slate-500">
                    <span>온보딩 가이드북 전체 구글 시트 주소 ({`{시트링크}`})</span>
                    <a href={linkSheet} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-0.5">
                      시트열기 <Globe className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <input
                    type="text"
                    value={linkSheet}
                    onChange={(e) => {
                      setLinkSheet(e.target.value);
                      setIsManuallyEdited(false);
                    }}
                    placeholder="https://docs.google.com/spreadsheets/..."
                    className="w-full text-[10px] bg-white border border-slate-250 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 font-mono text-slate-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-500 block">버디 활동 제출폼 링크 ({`{버디링크}`})</span>
                    <input
                      type="text"
                      value={linkBuddyForm}
                      onChange={(e) => {
                        setLinkBuddyForm(e.target.value);
                        setIsManuallyEdited(false);
                      }}
                      className="w-full text-[10px] bg-white border border-slate-250 rounded-lg px-2 py-1.5 font-mono text-slate-600 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-500 block">루키 활동 제출폼 링크 ({`{루키링크}`})</span>
                    <input
                      type="text"
                      value={linkRookieForm}
                      onChange={(e) => {
                        setLinkRookieForm(e.target.value);
                        setIsManuallyEdited(false);
                      }}
                      className="w-full text-[10px] bg-white border border-slate-250 rounded-lg px-2 py-1.5 font-mono text-slate-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Preview Output Draft editor Area */}
          <div className="xl:col-span-7 flex flex-col justify-between h-full bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  📝 실시간 치환 결과 및 알림 내용 최종 편집
                </label>
                <span className="text-[9px] bg-slate-200/80 text-slate-600 font-extrabold px-2 py-0.5 rounded font-mono uppercase">
                  {isManuallyEdited ? "✏️ 수동 편집됨" : "⚡ 자동 실시간 반영"}
                </span>
              </div>
              
              <textarea
                rows={21}
                value={finalDraftText}
                onChange={(e) => {
                  setFinalDraftText(e.target.value);
                  setIsManuallyEdited(true);
                }}
                placeholder="자동 치환이 대기 중입니다..."
                className="w-full bg-white border border-slate-250 rounded-xl px-4 py-3.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed resize-y min-h-[380px] select-text"
              />
            </div>

            <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-3.5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-[11px]">
                  <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">메시지 수신 채널</span>
                  <span className="font-extrabold text-slate-800">
                    🟢 {channels.find(c => c.id === activeChannelId)?.name || "기본 연결방"}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setIsManuallyEdited(false);
                      showToastMessage("템플릿 기본값으로 재복구 되었습니다.", "info");
                    }}
                    disabled={!isManuallyEdited}
                    className="cursor-pointer text-slate-500 hover:text-slate-800 border border-slate-200 text-[10px] font-black px-3.5 py-2.5 rounded-xl active:scale-95 transition-all bg-white disabled:opacity-30 disabled:pointer-events-none"
                  >
                    초기화 (재동기화)
                  </button>

                  <button
                    onClick={handleSendDraft}
                    disabled={jandiStatus.type === "loading" || !finalDraftText}
                    className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all shadow-md shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {jandiStatus.type === "loading" ? "실시간 전송 중..." : "실시간 잔디 전송"}
                  </button>
                </div>
              </div>

              {jandiStatus.msg && (
                <div className={`p-2 rounded-lg text-[10px] font-black text-center border ${
                  jandiStatus.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                }`}>
                  ℹ️ {jandiStatus.msg}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Advanced Integration Configuration Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 space-y-5">
        <div>
          <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
            🛠️ 잔디 연동 및 Incoming Webhook 멀티플 세부 설정
          </h4>
          <p className="text-slate-400 text-[11px] mt-0.5">
            잔디 발송 방식(구글 Apps Script 및 직접 Webhook 주소 관리)을 제어하고 다중 알림 채널을 생성 및 커스터마이징합니다.
          </p>
        </div>
        <JandiConfigForm />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Grid: Historical Scheduled Queues */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
              스마트 온보딩 배포 대기열 및 전송 대기 항목 ({notificationQueue.filter(q => q.status === "배포대기").length})
            </h4>
            <p className="text-slate-400 text-[11px] mt-0.5">스프레드시트 입사일 기준으로 HR 모듈이 자동 수집한 미션 가이드 일정입니다.</p>
          </div>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {notificationQueue.map((item) => (
              <div
                key={item.id}
                className={`border rounded-2xl p-4.5 transition-all text-xs ${
                  item.status === "배포완료"
                    ? "border-slate-150 bg-slate-50 opacity-70"
                    : "border-slate-200 bg-slate-50/20"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded text-[9px] border border-indigo-100">
                      {item.cohort}
                    </span>
                    <span className="font-bold text-slate-700">
                      버디 {item.buddy} ↔ 루키 {item.rookie}
                    </span>
                    <span className="text-slate-400 font-medium">| {item.step} 미션</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[9px] ${
                    item.status === "배포완료" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}>
                    {item.status}
                  </span>
                </div>

                <p className="text-slate-600 leading-relaxed bg-white border border-slate-150 rounded-xl p-3 shadow-2xs italic whitespace-pre-line text-[11px]">
                  {item.message}
                </p>

                {item.status === "배포대기" && (
                  <div className="flex justify-end gap-2 mt-3.5">
                    <button
                      onClick={() => handleForceComplete(item.id)}
                      className="cursor-pointer text-slate-500 hover:text-slate-800 border border-slate-200 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-white"
                    >
                      강제 배포완료 처리
                    </button>
                    <button
                      onClick={async () => {
                        const success = await sendJandiMessage({
                          rookieName: item.rookie,
                          message: item.message
                        });
                        if (success.success) {
                          setNotificationQueue(prev =>
                            prev.map(q => (q.id === item.id ? { ...q, status: "배포완료" } : q))
                          );
                          showToastMessage("배포가 안전하게 실시간 발송 완료되었습니다!", "success");
                        } else {
                          showToastMessage(`발송 실패: ${success.error}`, "error");
                        }
                      }}
                      className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"
                    >
                      <Send className="w-3 h-3" />
                      바로 전송 실행
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Grid: Deadline Calculators & Timeline 경보 */}
        <div className="lg:col-span-5 bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col text-white justify-between">
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-rose-500 rounded-full"></span>
                  기일 연산기 및 정착 리스크 모니터
                </h4>
                <p className="text-slate-400 text-[11px] mt-0.5">활동 기한 및 완주 축하금(3/6개월) 도래 시점의 경보 대기판입니다.</p>
              </div>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            </div>

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              {timelineAlerts.map(alert => {
                const isChecked = alert.status === "checked";
                const borderLeft = 
                  alert.type === "D-Day" ? "border-l-4 border-rose-500" :
                  alert.type === "D-3" ? "border-l-4 border-amber-500" :
                  "border-l-4 border-blue-500";
                const bg = isChecked ? "bg-slate-800/20 opacity-40" : "bg-slate-800/55";

                return (
                  <div key={alert.id} className={`p-4 rounded-xl relative transition-all text-xs ${borderLeft} ${bg}`}>
                    <span className={`absolute top-4 right-4 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                      alert.type === "D-Day" ? "bg-rose-600 text-white" : alert.type === "D-3" ? "bg-amber-500 text-slate-950" : "bg-blue-600 text-white"
                    }`}>
                      {alert.type}
                    </span>

                    <div className="pr-12 space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 font-mono tracking-wide block">경보 지정일: {alert.deadlineDate}</span>
                      <h5 className="font-bold text-slate-100 text-xs">{alert.title}</h5>
                      <p className="text-slate-400 leading-relaxed text-[11px]">{alert.description}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/50 flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-medium">대상: {alert.targetCohort} {alert.targetPerson}</span>
                      {alert.status === "unread" ? (
                        <button
                          onClick={() => handleMarkAlert(alert.id)}
                          className="cursor-pointer text-blue-400 hover:underline font-bold"
                        >
                          읽음 완료
                        </button>
                      ) : (
                        <span className="text-slate-500 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> 담당자 검토완료
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/40 text-[11px] space-y-2 mt-5">
            <h5 className="font-extrabold text-slate-200 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              자동 기일 분석 스탯 (Auto-Matrix)
            </h5>
            <ul className="space-y-1.5 text-slate-400">
              <li className="flex justify-between border-b border-slate-900 pb-1">
                <span>공식 티타임 지원금 정산</span>
                <span className="text-indigo-400 font-bold">3단계 입사 즉시 발생</span>
              </li>
              <li className="flex justify-between border-b border-slate-900 pb-1">
                <span>1차 포상 품의서 기한</span>
                <span className="text-slate-300">3개월 무사근속 검증</span>
              </li>
              <li className="flex justify-between pb-0.5">
                <span>2차 만주 완주 축하금</span>
                <span className="text-amber-400 font-bold">6개월 만기 자동 안내</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Floating custom beautiful toast notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 border border-slate-800 text-white rounded-2xl px-5 py-4 shadow-2xl max-w-sm animate-slideUp">
          <div className={`p-1.5 rounded-lg text-white ${toast.type === "success" ? "bg-emerald-600" : toast.type === "error" ? "bg-rose-600" : "bg-indigo-600"}`}>
            <Bell className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-100 leading-tight flex-1">{toast.msg}</p>
        </div>
      )}
    </div>
  );
}
