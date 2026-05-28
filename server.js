const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 5173);
const HOST = "127.0.0.1";
const ROOT = process.cwd();
const WEBHOOK_URL = process.env.JANDI_WEBHOOK_URL || "";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const sectionOneBody = `안녕하세요, 루키/버디 여러분 🙆‍♀️
내일부터 온보딩(버디-루키) 프로그램이 본격적으로 시작됩니다! 🎉
먼저, 이번 프로그램의 버디와 루키로 선정되신 것을 진심으로 축하드립니다.
----------------------------------------------------------
📌 1단계 | 자기이해 + 조직문화 이해하기 활동 안내
1단계는 온보딩 프로그램의 첫 시작으로 버디,루키 모두 각자 기질 진단검사를 진행하고 그 검사를 토대로 자기이해 -> 서로에 대한 이해 -> 더 나아가, 조직문화를 이해하기 위한 활동입니다.

기질 진단검사란, 선천적인 기질과 후천적 성격 분석을 통해 나에 대한 이해 대인관계, 성장 방향에 대해 탐색하고 더 나아가 아직은 어색한 버디, 루키와의 친밀감 형성 및 상호 이해를 돕기 위해 도입된 검사입니다.
그 중, 소개해드릴 골든성격유형검사는 MBTI의 심화 버전으로 약 168문항의 예상 소요시간은 30분정도 소요될 예정입니다.


👇 검사절차
1. 버디 / 루키 노랑푸드 메일로 개별적으로 온라인 검사 코드 메일 발송드릴 예정입니다.
     => 메일 접속 후 "검사 실시하기"를 누른 뒤 순차 진행
2. 검사 완료 후 "종료(결과보기)" 를 통해 결과지를 확인
3. 마지막으로  잔디 토픽방에 "완료되었습니다" 라고 작성해주시면 그 다음 활동 진행에 대해 안내드리겠습니다!
   => 검사 진행기간: 2026.05.28(목) ~ 2026.06.01(월)

대상자: 버디,루키 인원 모두

이후 이어서 활동 안내드리겠습니다!

검사 진행 중 궁금한 사항이나 어려움이 있으신 경우, 언제든지 잔디 토픽방을 통해 편하게 문의 부탁드립니다!
검사 완료 후 이어질 다음 활동도 기대해 주세요😊`;

const sectionTwoBody = `🌱[공지] 1단계 활동 안내
안녕하세요, 11기 버디/루키 여러분😊
1단계 #1 기질 진단검사에 참여해주셔서 감사합니다.

이제 본격적으로 검사 결과를 바탕으로 본인의 기질 특성과 업무 관계에서의 강점을 돌아볼 수 있는 1단계 활동지 작성과 관련하여 안내드립니다!

부담 없이 편안하게 작성해 주시면 되고,
온보딩의 취지가 신규입사자의 조직문화 적응인만큼 활동지 작성보다는 버디/루키간의 교류에 집중하며 활동 임해주시면 감사하겠습니다.

👇 활동지 작성안내

1. 1단계 활동지 링크 확인
버디 활동지 : https://forms.gle/da2jWhaLsgFeDyAGA
루키 활동지 : https://forms.gle/MMQpbhihE8NSfzru6

2. [개인활동] 본인의 검사 결과지를 바탕으로 1단계 Step 1. 작성

3. [협동활동] 버디/루키와 대면만남 후 활동지 Step 2. / Step 3. 작성
-> 준비물: 활동지, 기질 진단검사 결과지

4. 1단계 활동기간: 2026.06.01(월) ~ 2026.06.05(금) / 활동지 제출 마감일: 2026.06.05(금) 14시까지

※ 위 1~4번 단계별 진행은 버디/루키와 조율 후, 활동기간 내 유동적으로 진행하시되 다음 활동의 원활한 진행을 위해 제출마감일은 반드시 확인 부탁드립니다!

활동 중 문의사항이 생기면 언제든 안내방 또는 잔디로 편하게 연락 부탁드립니다.
감사합니다.`;

const stepTwoOneBody = `🌿[공지] 2-1단계 활동 안내
안녕하세요, 12기 버디/루키 여러분😊
버디/루키와의 지난 첫 만남은 어떠셨나요? 1단계를 통해 나 자신과 서로에 대해 알아보는 즐거운 시간이었기를 바랍니다.

이어 2단계 온보딩 활동을 안내드립니다.
이번 2-1단계 활동은 「보고서 작성법 교육」을 통한 기초 직무 역량 단계입니다.
본 활동을 통해 팀원급 필수 역량을 향상시키고 실제 업무에 효과적으로 활용할 수 있기를 기대합니다.

기존의 업무가 익숙한 버디에게는 한 단계 스킬 업 할 수 있는 시간을,
이제 막 입사한 루키에게는 본격적인 업무에 앞서 필수 역량의 기반을 다잡는 시간이 되기를 바랍니다.

이번 활동은 교육 강의를 중심으로 활동지 작성까지 연계되어 진행되므로 활동의 원활한 진행을 위해 교육 강의는 반드시 충분히 수강해 주시기 바랍니다.

👇활동지 작성안내

1. 2-1단계 활동지 링크 확인
-> 버디 활동지( @윤정준 ) : https://forms.gle/5AB1BnAvVEEyokkCA
-> 루키 활동지( @곽채연 ) : https://forms.gle/haFw4EKH5WXkhLG59

2. [개인활동] 활동지 안내에 따라 교육 강의 수료 후 미션 문항 풀기

3. [개인활동] 교육 이수 수료증 첨부

4. [협동활동] 버디/루키와 대면만남 후 교육을 통해 느낀 점 공유 후 활동지 작성

5. 2-1단계 활동기간: 2026.06.08(월) ~ 2026.06.11(목) / 활동지 제출 마감일: 2026.06.11(목)
※ 위 1~5번 단계별 진행은 버디/루키와 조율 후, 활동기간 내 유동적으로 진행하시되 다음 활동의 원활한 진행을 위해 제출마감일은 반드시 확인 부탁드립니다!

활동 중 문의사항이 생기면 언제든 안내방 또는 잔디로 편하게 연락 부탁드립니다.
감사합니다.`;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function maskWebhook(url) {
  if (!url) return "";
  const parts = url.split("/");
  const last = parts.at(-1) || "";
  return `${parts.slice(0, 5).join("/")}/.../${last.slice(0, 6)}...${last.slice(-4)}`;
}

function buildPayload(body, title, description) {
  return {
    body,
    connectColor: "#0F766E",
  };
}

async function postJandi(payload) {
  if (!WEBHOOK_URL) {
    throw new Error("JANDI_WEBHOOK_URL 환경값이 없습니다.");
  }

  const webhookResponse = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      Accept: "application/vnd.tosslab.jandi-v2+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!webhookResponse.ok) {
    throw new Error(`잔디 응답 오류: ${webhookResponse.status}`);
  }
}

async function sendJandiPayload(response, payload, successMessage) {
  try {
    await postJandi(payload);
    sendJson(response, 200, { message: successMessage });
  } catch (error) {
    sendJson(response, 502, { message: error.message || "잔디 서버로 연결하지 못했습니다." });
  }
}

function serveFile(request, response) {
  const urlPath = decodeURIComponent(request.url.split("?")[0]);
  const filePath = path.join(ROOT, urlPath === "/" ? "index.html" : urlPath);

  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(data);
  });
}

const server = http.createServer((request, response) => {
  if (request.method === "GET" && request.url.startsWith("/api/config")) {
    sendJson(response, 200, {
      configured: Boolean(WEBHOOK_URL),
      maskedUrl: maskWebhook(WEBHOOK_URL),
    });
    return;
  }

  if (request.method === "POST" && request.url.startsWith("/api/test-jandi")) {
    sendJandiPayload(
      response,
      buildPayload("[온보딩 테스트] 잔디 연동이 정상적으로 연결되었습니다.", "연동 테스트", "Incoming Webhook"),
      "테스트 알림을 전송했습니다."
    );
    return;
  }

  if (request.method === "POST" && request.url.startsWith("/api/deploy-step1-section1")) {
    sendJandiPayload(
      response,
      buildPayload(sectionOneBody, "1단계 1) 기질 진단검사 안내", "2026.05.28 ~ 2026.06.01"),
      "1단계 1) 안내문을 배포했습니다."
    );
    return;
  }

  if (request.method === "POST" && request.url.startsWith("/api/deploy-step1-section2")) {
    sendJandiPayload(
      response,
      buildPayload(sectionTwoBody, "1단계 2) 활동지 작성 안내", "2026.06.01 ~ 2026.06.05"),
      "1단계 2) 안내문을 배포했습니다."
    );
    return;
  }

  if (request.method === "POST" && request.url.startsWith("/api/deploy-step2-1")) {
    sendJandiPayload(
      response,
      buildPayload(stepTwoOneBody, "2-1단계 활동 안내", "2026.06.08 ~ 2026.06.11"),
      "2-1단계 안내문을 배포했습니다."
    );
    return;
  }

  serveFile(request, response);
});

server.listen(PORT, HOST, () => {
  console.log(`http://localhost:${PORT}/`);
});
