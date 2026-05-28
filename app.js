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
      document.body.dataset.connected = "true";
      return;
    }

    statusText.textContent = "웹훅 환경값이 필요합니다";
    maskedWebhook.value = "JANDI_WEBHOOK_URL 미설정";
  } catch {
    statusText.textContent = "서버 연결을 확인해 주세요";
    maskedWebhook.value = "상태 확인 실패";
  }
}

async function postAction(endpoint, pendingMessage, successFallback, buttons) {
  buttons.forEach((button) => {
    button.disabled = true;
  });
  sendResult.textContent = pendingMessage;

  try {
    const response = await fetch(endpoint, { method: "POST" });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "배포에 실패했습니다.");
    }

    sendResult.textContent = result.message || successFallback;
  } catch (error) {
    sendResult.textContent = `실패: ${error.message}`;
  } finally {
    buttons.forEach((button) => {
      button.disabled = false;
    });
  }
}

function sendTestMessage() {
  postAction(
    "/api/test-jandi",
    "잔디로 테스트 알림을 보내는 중입니다.",
    "테스트 알림을 보냈습니다.",
    [testButton]
  );
}

function deploySectionOne() {
  postAction(
    "/api/deploy-step1-section1",
    "1) 기질 진단검사 안내문을 잔디 토픽방으로 배포하는 중입니다.",
    "1) 안내문을 배포했습니다.",
    [deploySectionOneButton]
  );
}

function deploySectionTwo() {
  postAction(
    "/api/deploy-step1-section2",
    "2) 활동지 작성 안내문을 잔디 토픽방으로 배포하는 중입니다.",
    "2) 안내문을 배포했습니다.",
    [deploySectionTwoButton]
  );
}

function deployStepTwoOne() {
  postAction(
    "/api/deploy-step2-1",
    "2-1단계 활동 안내문을 잔디 토픽방으로 배포하는 중입니다.",
    "2-1단계 안내문을 배포했습니다.",
    [deployStepTwoOneButton]
  );
}

function showPreview() {
  sendResult.textContent =
    "[미리보기] 1단계와 2-1단계 안내문은 각 카드의 배포 버튼을 눌러 따로 발송합니다.";
}

testButton.addEventListener("click", sendTestMessage);
previewButton.addEventListener("click", showPreview);
deploySectionOneButton.addEventListener("click", deploySectionOne);
deploySectionTwoButton.addEventListener("click", deploySectionTwo);
deployStepTwoOneButton.addEventListener("click", deployStepTwoOne);
loadConfig();
fetch("여기에_잔디웹훅_URL", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    body: "📢 테스트 메시지입니다.",
  }),
});