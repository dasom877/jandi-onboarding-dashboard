const APPS_SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbwio9ZumOI2KmIdbODDraBF0c1migdeOYMxzaBoPCm2BMetdXFMy9tkm0TQDvnMyldGfA/exec";

const statusText = document.querySelector("#webhookStatus");
const maskedWebhook = document.querySelector("#maskedWebhook");
const testButton = document.querySelector("#testButton");
const previewButton = document.querySelector("#previewButton");
const sendResult = document.querySelector("#sendResult");

const deploySectionOneButton = document.querySelector("#deploySectionOneButton");
const deploySectionTwoButton = document.querySelector("#deploySectionTwoButton");
const deployStepTwoOneButton = document.querySelector("#deployStepTwoOneButton");

statusText.textContent = "Google Apps Script 연결";
maskedWebhook.value = "웹앱 연결 완료";

async function sendMessage(message) {
const response = await fetch(APPS_SCRIPT_URL, {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
message,
}),
});

return response.json();
}

async function postAction(message, pendingMessage, successMessage, buttons) {
buttons.forEach((button) => {
button.disabled = true;
});

sendResult.textContent = pendingMessage;

try {
await sendMessage(message);
sendResult.textContent = successMessage;
} catch (error) {
sendResult.textContent = 실패: ${error.message};
} finally {
buttons.forEach((button) => {
button.disabled = false;
});
}
}

function sendTestMessage() {
postAction(
"📢 온보딩 테스트 메시지입니다.",
"테스트 메시지 전송 중...",
"테스트 메시지 전송 완료",
[testButton]
);
}

function deploySectionOne() {
postAction(
"🌱 1단계 기질 진단검사 안내문 발송",
"1단계 안내문 전송 중...",
"1단계 안내문 전송 완료",
[deploySectionOneButton]
);
}

function deploySectionTwo() {
postAction(
"🌱 활동지 작성 안내문 발송",
"2단계 안내문 전송 중...",
"2단계 안내문 전송 완료",
[deploySectionTwoButton]
);
}

function deployStepTwoOne() {
postAction(
"🌿 2-1단계 활동 안내문 발송",
"2-1단계 안내문 전송 중...",
"2-1단계 안내문 전송 완료",
[deployStepTwoOneButton]
);
}

function showPreview() {
sendResult.textContent =
"현재는 Apps Script → 잔디 연동 구조로 연결되어 있습니다.";
}

testButton.addEventListener("click", sendTestMessage);
previewButton.addEventListener("click", showPreview);
deploySectionOneButton.addEventListener("click", deploySectionOne);
deploySectionTwoButton.addEventListener("click", deploySectionTwo);
deployStepTwoOneButton.addEventListener("click", deployStepTwoOne);
