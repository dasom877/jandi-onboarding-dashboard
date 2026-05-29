const statusText = document.querySelector("#webhookStatus");
const maskedWebhook = document.querySelector("#maskedWebhook");
const testButton = document.querySelector("#testButton");
const previewButton = document.querySelector("#previewButton");
const sendResult = document.querySelector("#sendResult");

const deploySectionOneButton = document.querySelector("#deploySectionOneButton");
const deploySectionTwoButton = document.querySelector("#deploySectionTwoButton");
const deployStepTwoOneButton = document.querySelector("#deployStepTwoOneButton");

async function loadConfig() {
try {
const response = await fetch("/api/config");
const config = await response.json();

if (config.configured) {
  statusText.textContent = "웹훅이 연결되어 있습니다";
  maskedWebhook.value = config.maskedUrl;
  return;
}

statusText.textContent = "웹훅 환경변수 미설정";
maskedWebhook.value = "JANDI_WEBHOOK_URL 미설정";

} catch (error) {
statusText.textContent = "연결 상태 확인 실패";
maskedWebhook.value = "상태 확인 실패";
}
}

async function postAction(
endpoint,
pendingMessage,
successMessage,
buttons
) {
buttons.forEach((button) => {
button.disabled = true;
});

sendResult.textContent = pendingMessage;

try {
const response = await fetch(endpoint, {
method: "POST",
});

const result = await response.json();

if (!response.ok) {
  throw new Error(result.message || "요청 실패");
}

sendResult.textContent =
  result.message || successMessage;

} catch (error) {
sendResult.textContent =
실패: ${error.message};
} finally {
buttons.forEach((button) => {
button.disabled = false;
});
}
}

function sendTestMessage() {
postAction(
"/api/test-jandi",
"테스트 메시지 전송 중...",
"테스트 메시지 전송 완료",
[testButton]
);
}

function deploySectionOne() {
postAction(
"/api/deploy-step1-section1",
"1단계 안내문 전송 중...",
"1단계 안내문 전송 완료",
[deploySectionOneButton]
);
}

function deploySectionTwo() {
postAction(
"/api/deploy-step1-section2",
"활동지 안내문 전송 중...",
"활동지 안내문 전송 완료",
[deploySectionTwoButton]
);
}

function deployStepTwoOne() {
postAction(
"/api/deploy-step2-1",
"2-1단계 안내문 전송 중...",
"2-1단계 안내문 전송 완료",
[deployStepTwoOneButton]
);
}

function showPreview() {
sendResult.textContent =
"안내문은 각 배포 버튼을 눌러 발송할 수 있습니다.";
}

testButton.addEventListener("click", sendTestMessage);
previewButton.addEventListener("click", showPreview);
deploySectionOneButton.addEventListener("click", deploySectionOne);
deploySectionTwoButton.addEventListener("click", deploySectionTwo);
deployStepTwoOneButton.addEventListener("click", deployStepTwoOne);

loadConfig();