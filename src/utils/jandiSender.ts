export interface JandiWebhookChannel {
  id: string;
  name: string;
  url: string;
}

export interface JandiSettings {
  sendMode: "webhook" | "apps_script";
  webhookUrl: string;
  appsScriptUrl: string;
}

const OLD_DEFAULT_WEBHOOK = "https://wh.jandi.com/connect-api/webhook/27388464/7d45146733fa60e8ed6d0f3c188b0a3a";
const DEFAULT_WEBHOOK = "https://wh.jandi.com/connect-api/webhook/27388464/6e67c46677fd21750badc363ae2393d9";

const DEFAULT_WEBHOOKS: JandiWebhookChannel[] = [
  { id: "channel-1", name: "📢 [인사팀] 온보딩 총괄 알림방", url: "https://wh.jandi.com/connect-api/webhook/27388464/6e67c46677fd21750badc363ae2393d9" },
  { id: "channel-2", name: "💛 [버디/루키] 13기 소통 채널", url: "https://wh.jandi.com/connect-api/webhook/27388464/7d45146733fa60e8ed6d0f3c188b0a3a" },
  { id: "channel-3", name: "🧪 [테스트] 개인 수신/디버깅 채널", url: "https://wh.jandi.com/connect-api/webhook/27388464/6e67c46677fd21750badc363ae2393d9" }
];

export function getJandiWebhooks(): JandiWebhookChannel[] {
  if (typeof window === "undefined") return DEFAULT_WEBHOOKS;
  const stored = localStorage.getItem("jandi_webhooks");
  if (!stored) {
    localStorage.setItem("jandi_webhooks", JSON.stringify(DEFAULT_WEBHOOKS));
    return DEFAULT_WEBHOOKS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_WEBHOOKS;
  }
}

export function saveJandiWebhooks(webhooks: JandiWebhookChannel[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("jandi_webhooks", JSON.stringify(webhooks));
  window.dispatchEvent(new Event("storage_jandi_settings"));
}

export function getSelectedWebhookId(): string {
  if (typeof window === "undefined") return "channel-1";
  return localStorage.getItem("jandi_active_webhook_id") || "channel-1";
}

export function setSelectedWebhookId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("jandi_active_webhook_id", id);
  window.dispatchEvent(new Event("storage_jandi_settings"));
}

export function getJandiSettings(): JandiSettings {
  if (typeof window === "undefined") {
    return { sendMode: "webhook", webhookUrl: DEFAULT_WEBHOOK, appsScriptUrl: "" };
  }
  const sendMode = (localStorage.getItem("jandi_send_mode") as "webhook" | "apps_script") || "webhook";
  
  // Keep compatibility with older single-webhook URL, use selected channel's URL if available
  const channels = getJandiWebhooks();
  const activeId = getSelectedWebhookId();
  const activeChan = channels.find(c => c.id === activeId) || channels[0];
  const webhookUrl = activeChan ? activeChan.url : (localStorage.getItem("jandi_webhook_url") || DEFAULT_WEBHOOK);
  
  const appsScriptUrl = localStorage.getItem("jandi_apps_script_url") || "";
  return { sendMode, webhookUrl, appsScriptUrl };
}

export function saveJandiSettings(settings: Partial<JandiSettings>) {
  if (typeof window === "undefined") return;
  if (settings.sendMode) localStorage.setItem("jandi_send_mode", settings.sendMode);
  if (settings.webhookUrl !== undefined) {
    localStorage.setItem("jandi_webhook_url", settings.webhookUrl);
    // Also update active channel URL to stay in sync
    const channels = getJandiWebhooks();
    const activeId = getSelectedWebhookId();
    const updatedChannels = channels.map(c => c.id === activeId ? { ...c, url: settings.webhookUrl! } : c);
    localStorage.setItem("jandi_webhooks", JSON.stringify(updatedChannels));
  }
  if (settings.appsScriptUrl !== undefined) localStorage.setItem("jandi_apps_script_url", settings.appsScriptUrl);
  
  // Trigger storage event so other tabs/components listen
  window.dispatchEvent(new Event("storage_jandi_settings"));
}

export async function sendJandiMessage(params: {
  rookieName: string;
  message: string;
  webhookUrl?: string;
  appsScriptUrl?: string;
  sendMode?: "webhook" | "apps_script";
}): Promise<{ success: boolean; status?: number; error?: string }> {
  const current = getJandiSettings();
  const sendMode = params.sendMode || current.sendMode;
  const webhookUrl = params.webhookUrl || current.webhookUrl;
  const appsScriptUrl = params.appsScriptUrl || current.appsScriptUrl;

  if (sendMode === "apps_script") {
    const targetUrl = appsScriptUrl.trim();
    if (!targetUrl || targetUrl === "여기에_구글_웹_앱_URL을_붙여넣으세요") {
      return { success: false, error: "구글 Apps Script 웹 앱 URL이 입력되지 않았습니다." };
    }

    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          rookieName: params.rookieName,
          messageContent: params.message
        })
      });

      if (response.ok) {
        return { success: true, status: response.status };
      } else {
        return { success: false, error: `Apps Script 발송 실패 (상태 코드: ${response.status})`, status: response.status };
      }
    } catch (err: any) {
      return { success: false, error: `Apps Script 통신 오류: ${err.message || err}` };
    }
  } else {
    // Route through Server-side CORS proxy
    const targetUrl = webhookUrl.trim() || DEFAULT_WEBHOOK;
    try {
      const response = await fetch("/api/send-jandi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          webhookUrl: targetUrl,
          body: params.message
        })
      });

      if (response.ok) {
        return { success: true, status: response.status };
      } else {
        const errJson = await response.json().catch(() => ({}));
        return { success: false, error: errJson.error || `잔디 웹훅 전송 실패 (상태 코드: ${response.status})`, status: response.status };
      }
    } catch (err: any) {
      return { success: false, error: `잔디 웹훅 통신 오류: ${err.message || err}` };
    }
  }
}
