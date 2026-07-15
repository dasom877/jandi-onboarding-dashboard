import React, { useState, useEffect } from "react";
import {
  getJandiSettings,
  saveJandiSettings,
  JandiSettings,
  JandiWebhookChannel,
  getJandiWebhooks,
  saveJandiWebhooks,
  getSelectedWebhookId,
  setSelectedWebhookId
} from "../utils/jandiSender";
import { Settings, Check, Copy, HelpCircle, FileText, ChevronDown, ChevronUp, Plus, Trash2, Edit2, Info, CheckCircle } from "lucide-react";

export default function JandiConfigForm() {
  const [settings, setSettings] = useState<JandiSettings>({
    sendMode: "webhook",
    webhookUrl: "",
    appsScriptUrl: ""
  });
  
  const [channels, setChannels] = useState<JandiWebhookChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>("channel-1");
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelUrl, setNewChannelUrl] = useState("");
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingUrl, setEditingUrl] = useState("");
  
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    // Load current settings and channels on mount
    setSettings(getJandiSettings());
    setChannels(getJandiWebhooks());
    setActiveChannelId(getSelectedWebhookId());

    // Listen to changes from other components
    const handleStorageChange = () => {
      setSettings(getJandiSettings());
      setChannels(getJandiWebhooks());
      setActiveChannelId(getSelectedWebhookId());
    };
    window.addEventListener("storage_jandi_settings", handleStorageChange);
    return () => {
      window.removeEventListener("storage_jandi_settings", handleStorageChange);
    };
  }, []);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleModeChange = (mode: "webhook" | "apps_script") => {
    const updated = { ...settings, sendMode: mode };
    setSettings(updated);
    saveJandiSettings(updated);
    triggerNotification(`💡 발송 방식이 [${mode === "webhook" ? "직접 웹훅" : "Apps Script"}]으로 변경되었습니다.`);
  };

  const handleActiveChannelChange = (id: string) => {
    setActiveChannelId(id);
    setSelectedWebhookId(id);
    
    // Update the single-webhook settings for backward compatibility
    const targetChan = channels.find(c => c.id === id);
    if (targetChan) {
      const updatedSettings = { ...settings, webhookUrl: targetChan.url };
      setSettings(updatedSettings);
      saveJandiSettings(updatedSettings);
    }
    triggerNotification("🎯 수신 알림 채널이 변경되었습니다.");
  };

  const handleUrlChange = (field: "webhookUrl" | "appsScriptUrl", value: string) => {
    const updated = { ...settings, [field]: value.trim() };
    setSettings(updated);
    saveJandiSettings(updated);
  };

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || !newChannelUrl.trim()) return;

    const newChan: JandiWebhookChannel = {
      id: `channel-${Date.now()}`,
      name: newChannelName.trim(),
      url: newChannelUrl.trim()
    };

    const updated = [...channels, newChan];
    setChannels(updated);
    saveJandiWebhooks(updated);
    
    // Automatically switch to the newly created channel
    handleActiveChannelChange(newChan.id);
    
    setNewChannelName("");
    setNewChannelUrl("");
    setIsAddingChannel(false);
    triggerNotification("✨ 새 수신 채널이 생성 및 적용되었습니다!");
  };

  const handleDeleteChannel = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (channels.length <= 1) {
      alert("최소 1개 이상의 알림 채널이 존재해야 합니다.");
      return;
    }

    if (!confirm("정말 이 잔디 채널 연동을 제거하시겠습니까?")) return;

    const updated = channels.filter(c => c.id !== id);
    setChannels(updated);
    saveJandiWebhooks(updated);

    // If the deleted channel was the active one, fallback to the first available channel
    if (activeChannelId === id) {
      handleActiveChannelChange(updated[0].id);
    }
    triggerNotification("🗑️ 채널 연동이 삭제되었습니다.");
  };

  const startEditingChannel = (chan: JandiWebhookChannel) => {
    setEditingChannelId(chan.id);
    setEditingName(chan.name);
    setEditingUrl(chan.url);
  };

  const saveEditedChannel = (id: string) => {
    if (!editingName.trim() || !editingUrl.trim()) return;

    const updated = channels.map(c => 
      c.id === id ? { ...c, name: editingName.trim(), url: editingUrl.trim() } : c
    );
    setChannels(updated);
    saveJandiWebhooks(updated);

    // If active, keep setting in sync
    if (activeChannelId === id) {
      const updatedSettings = { ...settings, webhookUrl: editingUrl.trim() };
      setSettings(updatedSettings);
      saveJandiSettings(updatedSettings);
    }

    setEditingChannelId(null);
    triggerNotification("💾 채널 정보가 성공적으로 수정되었습니다.");
  };

  const appsScriptCode = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var rookieName = data.rookieName;
    var messageContent = data.messageContent;
    
    // 잔디 웹훅 URL 설정 (본인의 실제 잔디 Incoming Webhook 주소를 따옴표 안에 넣어주세요)
    var jandiWebhookUrl = "${settings.webhookUrl || "https://wh.jandi.com/connect-api/webhook/27388464/6e67c46677fd21750badc363ae2393d9"}";
    
    var payload = {
      "body": messageContent
    };
    
    var options = {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };
    
    UrlFetchApp.fetch(jandiWebhookUrl, options);
    
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch(err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-500" />
          <h4 className="text-xs font-extrabold text-slate-800">잔디(JANDI) 알림 연동 방식 제어 센터</h4>
        </div>
        <span className="text-[9px] bg-slate-200/60 text-slate-600 font-extrabold px-2 py-0.5 rounded font-mono uppercase">
          Config System
        </span>
      </div>

      {notification && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg p-2.5 text-[11px] font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Mode Selection Toggle Buttons */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
          알림 발송 방식 선택
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleModeChange("webhook")}
            className={`cursor-pointer px-3 py-2.5 rounded-xl border text-[11px] font-bold text-center transition-all ${
              settings.sendMode === "webhook"
                ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            🟢 직접 Webhook 발송 (다중 채널)
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("apps_script")}
            className={`cursor-pointer px-3 py-2.5 rounded-xl border text-[11px] font-bold text-center transition-all ${
              settings.sendMode === "apps_script"
                ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            📑 구글 Apps Script 연동 발송
          </button>
        </div>
      </div>

      {/* Conditional Inputs */}
      {settings.sendMode === "webhook" ? (
        <div className="space-y-4 animate-fadeIn">
          {/* Active Channel Selector Dropdown */}
          <div className="space-y-1.5 bg-white p-3.5 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                📢 현재 활성화된 발송 수신 채널
              </label>
              <button
                type="button"
                onClick={() => setIsAddingChannel(!isAddingChannel)}
                className="cursor-pointer text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100"
              >
                <Plus className="w-3 h-3" />
                새 채널 연동 추가
              </button>
            </div>
            
            <select
              value={activeChannelId}
              onChange={(e) => handleActiveChannelChange(e.target.value)}
              className="w-full text-[11px] font-bold bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-800 rounded-xl px-3.5 py-3 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              {channels.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.url.substring(0, 45)}...)
                </option>
              ))}
            </select>
          </div>

          {/* Inline Add Channel Form */}
          {isAddingChannel && (
            <form onSubmit={handleAddChannel} className="bg-indigo-50/50 p-4 border border-indigo-100 rounded-xl space-y-3 animate-slideDown">
              <h5 className="text-[11px] font-extrabold text-indigo-950">➕ 새 잔디(JANDI) Incoming Webhook 연동</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider block">채널 별칭 명칭</span>
                  <input
                    type="text"
                    required
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="예: 📢 13기 동행 소통방"
                    className="w-full text-xs bg-white border border-slate-250 focus:border-indigo-500 rounded-lg px-2.5 py-2 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider block">웹훅 주소 (Incoming Webhook URL)</span>
                  <input
                    type="url"
                    required
                    value={newChannelUrl}
                    onChange={(e) => setNewChannelUrl(e.target.value)}
                    placeholder="https://wh.jandi.com/connect-api/webhook/..."
                    className="w-full text-xs bg-white border border-slate-250 focus:border-indigo-500 rounded-lg px-2.5 py-2 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingChannel(false)}
                  className="cursor-pointer text-slate-500 hover:bg-slate-100 font-bold text-[10px] px-3 py-1.5 rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] px-4 py-1.5 rounded-lg shadow-sm"
                >
                  채널 연동 등록
                </button>
              </div>
            </form>
          )}

          {/* Webhook Channel List Configuration Details */}
          <div className="space-y-2 bg-white p-3.5 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              🛠️ 잔디 연동 채널 리스트 세부 설정
            </span>
            <div className="divide-y divide-slate-100 max-h-[180px] overflow-y-auto pr-1">
              {channels.map(c => (
                <div key={c.id} className="py-2.5 flex items-start justify-between gap-3 text-[11px]">
                  {editingChannelId === c.id ? (
                    <div className="flex-1 space-y-2 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-slate-400">채널명 수정</span>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-slate-400">웹훅 URL 수정</span>
                        <input
                          type="text"
                          value={editingUrl}
                          onChange={(e) => setEditingUrl(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none font-mono"
                        />
                      </div>
                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingChannelId(null)}
                          className="px-2 py-0.5 text-slate-500 text-[9px] font-bold"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEditedChannel(c.id)}
                          className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[9px] font-bold"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                          {c.name}
                          {activeChannelId === c.id && (
                            <span className="bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wide border border-emerald-200">
                              Active
                            </span>
                          )}
                        </p>
                        <p className="text-slate-400 font-mono text-[9px] truncate mt-0.5">{c.url}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={() => startEditingChannel(c)}
                          className="cursor-pointer p-1 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded border border-slate-150 transition-all"
                          title="이 채널 세부 사항 수정"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteChannel(c.id, e)}
                          disabled={channels.length <= 1}
                          className="cursor-pointer p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 bg-slate-50 rounded border border-slate-150 transition-all disabled:opacity-30 disabled:pointer-events-none"
                          title="이 채널 제거"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal flex items-start gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              * 발송 대기열이나 알림 템플릿 발송기에서 메시지를 발송할 때, 위에서 활성화 상태로 지정된 채널로 즉시 안전하게 발송됩니다.
            </span>
          </p>
        </div>
      ) : (
        <div className="space-y-3 animate-fadeIn">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              구글 시트 Apps Script 배포 웹 앱 URL (scriptUrl)
            </label>
            <input
              type="text"
              value={settings.appsScriptUrl}
              onChange={(e) => handleUrlChange("appsScriptUrl", e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full text-[11px] bg-white border border-slate-250 focus:border-emerald-500 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-700 placeholder-slate-350 transition-all focus:outline-none"
            />
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            * 구글 스프레드시트에 연동된 Google Apps Script의 [웹 앱 URL]입니다. CORS 제약 없이 안전한 브라우저 단독 발송을 보장합니다.
          </p>

          {/* Collapsible Apps Script Integration Guide */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="w-full px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between hover:bg-slate-100/50 transition-all text-left text-[11px] font-extrabold text-slate-700 cursor-pointer"
            >
              <span className="flex items-center gap-1.5 text-emerald-700">
                <HelpCircle className="w-3.5 h-3.5" />
                💡 구글 스프레드시트 Apps Script 연동 가이드
              </span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showGuide && (
              <div className="p-4 space-y-3.5 text-[10px] leading-relaxed text-slate-600 max-h-[350px] overflow-y-auto animate-slideDown">
                <div className="space-y-1.5">
                  <p className="font-extrabold text-slate-800">⚙️ 구글 스프레드시트 웹 앱(Web App) 배포 절차:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-1 font-medium">
                    <li>스프레드시트에서 <b>[확장 프로그램] → [Apps Script]</b> 메뉴를 클릭합니다.</li>
                    <li>기존 코드를 모두 지우고 아래의 <b>Apps Script 코드</b>를 복사하여 붙여넣습니다.</li>
                    <li>우측 상단 <b>[배포] → [새 배포]</b> 버튼을 누릅니다.</li>
                    <li>유형 선택(톱니바퀴)에서 <b>[웹 앱]</b>을 선택합니다.</li>
                    <li><b>웹 앱 구성 설정:</b>
                      <ul className="list-disc list-inside pl-4 mt-0.5 space-y-0.5 text-slate-500">
                        <li>설명: <code className="bg-slate-100 px-1 py-0.2 rounded text-indigo-600 font-bold font-mono">Jandi Onboarding Relay</code></li>
                        <li>다음 사용자 권한으로 실행: <b>나 (본인 구글 이메일)</b></li>
                        <li>액세스 권한이 있는 사용자: <b className="text-rose-600">모든 사용자 (Anyone)</b> (※ 외부 브라우저 호출 허용을 위해 필수)</li>
                      </ul>
                    </li>
                    <li><b>[배포]</b> 클릭 후, 화면에 생성된 <b>'웹 앱 URL'</b>을 복사하여 위의 입력 칸에 입력하십시오!</li>
                  </ol>
                </div>

                {/* Code Copy Area */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-700 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-500" />
                      구글 웹 앱용 Apps Script 코드
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="cursor-pointer font-bold text-[9px] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-2 py-1 rounded flex items-center gap-1 transition-all"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "복사 성공!" : "코드 복사"}
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[9px] overflow-x-auto border border-slate-950 shadow-inner select-text">
                    {appsScriptCode}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
