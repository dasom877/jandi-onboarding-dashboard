import React, { useState, useEffect } from "react";
import { ListRestart, FileSpreadsheet, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, ServerCrash, Check, Layers } from "lucide-react";
import { OnboardingMain, ActivitySchedule, SatisfactionSurvey } from "../types";

interface GoogleSheetsSyncProps {
  onDataLoaded: (data: {
    main: OnboardingMain[];
    schedule: ActivitySchedule[];
    survey: SatisfactionSurvey[];
  }) => void;
  onReset: () => void;
  isUsingDefaultData: boolean;
  sheetsFetchedInfo: {
    sheetId: string;
    lastSynced: string | null;
    sheetNames: string[];
    counts: {
      main: number;
      schedule: number;
      survey: number;
    };
  } | null;
  setSheetsFetchedInfo: React.Dispatch<React.SetStateAction<any>>;
}

export const cleanName = (name: string): string => {
  if (!name) return "";
  // 직급 제거 (수석매니저, 책임매니저, 선임매니저, 매니저, 센터장, 팀장, 본부장, 대표이사, 대표, 루키, 버디)
  return name.replace(/\s*(수석매니저|책임매니저|선임매니저|매니저|센터장|팀장|본부장|대표이사|대표|루키|버디)\s*$/, "").trim();
};

export default function GoogleSheetsSync({
  onDataLoaded,
  onReset,
  isUsingDefaultData,
  sheetsFetchedInfo,
  setSheetsFetchedInfo
}: GoogleSheetsSyncProps) {
  const defaultSheetId = "1IV0nE90c1Bye-jDXs4SO9CnjxiUaAilQhsc-B_7mXeY";
  const [sheetId, setSheetId] = useState(defaultSheetId);
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);

  const extractSheetId = (input: string): string => {
    const trimmed = input.trim();
    if (trimmed.startsWith("file:///")) {
      throw new Error("로컬 파일 경로(file:///)는 사용자님의 PC에만 존재하는 파일입니다. 외부에서 접근 가능한 구글 스프레드시트 공유 링크(또는 시트 ID)를 입력해 주세요.");
    }
    
    // Regular expression to match Google Sheet ID from URL
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed;
  };

  const fetchSpreadsheetData = async (targetId: string) => {
    setIsLoading(true);
    setErrorStatus(null);
    setSuccessStatus(null);

    try {
      const cleanId = extractSheetId(targetId);
      const response = await fetch(`/api/fetch-google-sheet?sheetId=${cleanId}`);
      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "구글 스프레드시트 배포 데이터를 불러오지 못했습니다.");
      }

      const data = await response.json();
      if (!data.success || !data.sheets) {
        throw new Error(data.error || "구글 스프레드시트 파싱 결과가 성공적이지 않습니다.");
      }

      // We have raw sheets dictionary. Apply heuristic clean and map logic on the worksheets!
      let mainSheet: any[] = [];
      let scheduleSheet: any[] = [];
      let surveySheet: any[] = [];
      let mainSheetNameDetected = "";

      Object.keys(data.sheets).forEach((sheetName) => {
        const json = data.sheets[sheetName];
        if (!Array.isArray(json) || json.length === 0) return;

        const cleanedName = sheetName.replace(/\s+/g, "").toLowerCase();

        // Column detection heuristics
        const sampleRow = json[0] || {};
        const keys = Object.keys(sampleRow).map((k) => k.toLowerCase().replace(/\s+/g, ""));

        const hasMainColumns = keys.some(
          (k) =>
            k.includes("버디") ||
            k.includes("루키") ||
            k.includes("누키") ||
            k.includes("골든") ||
            k.includes("노랑") ||
            k.includes("입사") ||
            k.includes("buddy") ||
            k.includes("rookie") ||
            k.includes("joindate")
        );
        const hasScheduleColumns = keys.some(
          (k) =>
            k.includes("단계") ||
            k.includes("공정") ||
            k.includes("현황") ||
            k.includes("step") ||
            k.includes("status")
        );
        const hasSurveyColumns = keys.some(
          (k) =>
            k.includes("만족") ||
            k.includes("설문") ||
            k.includes("조사") ||
            k.includes("응답자") ||
            k.includes("respondent") ||
            k.startsWith("q") ||
            k.includes("qno") ||
            k.includes("문항")
        );

        if (
          cleanedName.includes("운영") ||
          cleanedName.includes("메인") ||
          cleanedName.includes("main") ||
          cleanedName.includes("onboarding") ||
          hasMainColumns
        ) {
          mainSheet = json;
          mainSheetNameDetected = sheetName;
        } else if (
          cleanedName.includes("단계별") ||
          cleanedName.includes("진행현황") ||
          cleanedName.includes("일정") ||
          cleanedName.includes("schedule") ||
          cleanedName.includes("activity") ||
          hasScheduleColumns
        ) {
          scheduleSheet = json;
        } else if (
          cleanedName.includes("만족도") ||
          cleanedName.includes("설문") ||
          cleanedName.includes("조사") ||
          cleanedName.includes("survey") ||
          cleanedName.includes("satisfaction") ||
          cleanedName.includes("feedback") ||
          hasSurveyColumns
        ) {
          surveySheet = json;
        }
      });

      // Simple array index-based fallbacks if naming checks completely missed
      const sheetNames = data.sheetNames || [];
      if (mainSheet.length === 0 && sheetNames.length > 0) {
        mainSheet = data.sheets[sheetNames[0]] || [];
        mainSheetNameDetected = sheetNames[0];
      }
      if (scheduleSheet.length === 0 && sheetNames.length > 1) {
        scheduleSheet = data.sheets[sheetNames[1]] || [];
      }
      if (surveySheet.length === 0 && sheetNames.length > 2) {
        surveySheet = data.sheets[sheetNames[2]] || [];
      }

      // Map To Strict TypeScript Models
      const parsedDate = (val: any) => {
        if (!val) return null;
        if (val instanceof Date) return val.toISOString().split("T")[0];
        const str = val.toString().trim();
        if (str === "" || str.includes("예정") || str.includes("대기")) return null;
        
        // Handle common excel serialization format mismatch
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
          return str.slice(0, 10);
        }
        return str;
      };

      const mainSheetNameRaw = mainSheetNameDetected || (sheetNames.length > 0 ? sheetNames[0] : "");
      const mainSheetRaw = (data.sheetsRawCols && mainSheetNameRaw) ? (data.sheetsRawCols[mainSheetNameRaw] || []) : [];

      let mappedMain: OnboardingMain[] = [];

      if (mainSheetRaw.length > 0) {
        const firstRow = mainSheetRaw[0] || {};
        const headerToColLetter: Record<string, string> = {};
        Object.keys(firstRow).forEach((colLetter) => {
          const val = String(firstRow[colLetter]).trim().toLowerCase().replace(/\s+/g, "");
          if (val) {
            headerToColLetter[val] = colLetter;
          }
        });

        // Skip headers when collecting records
        const dataRows = mainSheetRaw.filter((row, idx) => {
          if (idx === 0) return false;
          const aVal = String(row.A || "").trim();
          if (aVal.includes("기수") || aVal === "기수") return false;
          return !!(row.A || row.C || row.E);
        });

        const getColByHeaders = (keywords: string[], defaultCol: string) => {
          for (const headerText of Object.keys(headerToColLetter)) {
            if (keywords.some(kw => headerText.includes(kw))) {
              return headerToColLetter[headerText];
            }
          }
          return defaultCol;
        };

        mappedMain = dataRows.map((row) => {
          // G열: 퇴사일/퇴직일/현재 정착 상태
          const rawQuitVal = row["G"] ? String(row["G"]).trim() : "";
          let quitDate: string | null = null;
          if (rawQuitVal && rawQuitVal !== "" && rawQuitVal !== "-") {
            const lowerQuit = rawQuitVal.toLowerCase();
            
            // Matches explicit year pattern (e.g. 2026-06-11) or words for quit
            const datePattern = /^\d{4}[-./]\d{1,2}[-./]\d{1,2}/;
            const isQuitDate = datePattern.test(lowerQuit) || lowerQuit.includes("퇴사") || lowerQuit.includes("퇴직");

            // Exclude explicit positive terms signifying employment
            const isNotQuitText = 
              lowerQuit.includes("재직") || 
              lowerQuit.includes("유지") || 
              lowerQuit.includes("안착") || 
              lowerQuit.includes("정착") || 
              lowerQuit.includes("진행") ||
              lowerQuit.includes("근속") ||
              lowerQuit === "정상" ||
              lowerQuit === "근속중";

            if (isQuitDate && !isNotQuitText) {
              quitDate = parsedDate(rawQuitVal) || rawQuitVal;
            }
          }

          // C열: 골든버디 성명 (buddy)
          const buddy = String(row["C"] || "").trim() || "미지정";
          
          // E열: 노랑루키 성명 (rookie)
          const rookie = String(row["E"] || "").trim() || "미지정";
          
          // A열: 기수
          const cohort = String(row["A"] || "").trim() || "선택기수";
          
          // F열: 입사일
          const joinDate = parsedDate(row["F"]) || "2026-06-01";

           const startCol = getColByHeaders(["시작일", "startdate", "시작"], "F");
          const endCol = getColByHeaders(["종료일", "enddate", "종료"], "H");
          const r1Col = getColByHeaders(["1차", "reward1", "일차포상"], "I");
          const r2Col = getColByHeaders(["2차", "reward2", "이차포상"], "J");
          const deptCol = getColByHeaders(["부서", "dept", "소속", "team", "노랑루키 부서", "노랑루키부서"], "B");
          const rankCol = getColByHeaders(["비고", "직급", "rank", "position", "구분"], "K");

          const startDate = parsedDate(row[startCol]) || joinDate;
          const endDate = parsedDate(row[endCol]) || "2026-09-01";
          const reward1Date = parsedDate(row[r1Col]);
          const reward2Date = parsedDate(row[r2Col]);
          const department = row[deptCol] ? String(row[deptCol]).trim() : undefined;
          const rank = row[rankCol] ? String(row[rankCol]).trim() : undefined;

          return {
            cohort,
            buddy,
            rookie,
            joinDate,
            quitDate,
            startDate,
            endDate,
            reward1Date,
            reward2Date,
            department,
            rank
          };
        });
      } else {
        mappedMain = mainSheet.map((row) => {
          const keys = Object.keys(row);
          const getVal = (possibleKeys: string[]) => {
            const foundKey = keys.find((k) =>
              possibleKeys.some((pk) => k.toLowerCase().replace(/\s+/g, "").includes(pk))
            );
            return foundKey ? row[foundKey] : "";
          };

          const rawQuit = getVal(["퇴사일", "quitdate", "퇴직일"]);
          const rawQuitStr = rawQuit ? String(rawQuit).trim() : "";
          let quitDate: string | null = null;
          if (rawQuitStr && rawQuitStr !== "") {
            const lowerQuit = rawQuitStr.toLowerCase();
            const isNotQuit = 
              lowerQuit.includes("재직") || 
              lowerQuit.includes("유지") || 
              lowerQuit.includes("안착") || 
              lowerQuit.includes("정착") || 
              lowerQuit.includes("진행") ||
              lowerQuit === "정상" ||
              lowerQuit === "근속중" ||
              lowerQuit === "근속";

            const isQuit = 
              lowerQuit.includes("퇴사") || 
              lowerQuit.includes("퇴직") || 
              lowerQuit.includes("중도") || 
              /^\d{4}/.test(lowerQuit);

            if (!isNotQuit || isQuit) {
              quitDate = parsedDate(rawQuitStr) || rawQuitStr;
            }
          }

          const department = getVal(["부서", "dept", "소속", "team", "노랑루키 부서", "노랑루키부서"]);
          const rank = getVal(["비고", "직급", "rank", "position", "구분"]);

          return {
            cohort: String(getVal(["기수", "cohort"]) || "선택기수"),
            buddy: String(getVal(["버디", "buddy", "골든버디", "골든버디성명"]) || "미지정"),
            rookie: String(getVal(["루키", "rookie", "노랑루키", "노랑루키성명", "노랑누키", "노랑누키성명"]) || "미지정"),
            joinDate: parsedDate(getVal(["입사일", "joindate", "입사"])) || "2026-06-01",
            quitDate,
            startDate: parsedDate(getVal(["시작일", "startdate", "시작"])) || "2026-06-01",
            endDate: parsedDate(getVal(["종료일", "enddate", "종료"])) || "2026-09-01",
            reward1Date: parsedDate(getVal(["1차", "reward1", "일차포상"])),
            reward2Date: parsedDate(getVal(["2차", "reward2", "이차포상"])),
            department: department ? String(department).trim() : undefined,
            rank: rank ? String(rank).trim() : undefined,
          };
        });
      }

      const mappedSchedule: ActivitySchedule[] = scheduleSheet.map((row) => {
        const keys = Object.keys(row);
        const getVal = (possibleKeys: string[]) => {
          const foundKey = keys.find((k) =>
            possibleKeys.some((pk) => k.toLowerCase().replace(/\s+/g, "").includes(pk))
          );
          return foundKey ? row[foundKey] : "";
        };

        const rawStep = getVal(["단계", "step"]);
        const stepInt = parseInt(rawStep, 10) || 1;

        const rawStatus = getVal(["공정", "현황", "진행현황", "status", "진행"]) || "예정";
        let status: any = "예정";
        if (rawStatus.includes("완료") || rawStatus.includes("성공")) {
          status = "완료";
        } else if (rawStatus.includes("진행중") || rawStatus.includes("중")) {
          status = "진행중";
        }

        return {
          cohort: String(getVal(["기수", "cohort"]) || "선택기수"),
          step: stepInt,
          title: String(getVal(["핵심", "내용", "title", "활동명"]) || "활동 주제"),
          status,
        };
      });

      const mappedSurvey: SatisfactionSurvey[] = [];
      surveySheet.forEach((row) => {
        const keys = Object.keys(row);
        const getVal = (possibleKeys: string[]) => {
          const exactKey = keys.find((k) => {
            const cleanK = k.toLowerCase().replace(/\s+/g, "");
            return possibleKeys.some((pk) => cleanK === pk.toLowerCase().replace(/\s+/g, ""));
          });
          if (exactKey) return row[exactKey];

          const foundKey = keys.find((k) => {
            const cleanK = k.toLowerCase().replace(/\s+/g, "");
            return possibleKeys.some((pk) => {
              const cleanPk = pk.toLowerCase().replace(/\s+/g, "");
              if (cleanPk === "응답" && cleanK.includes("응답자")) return false;
              if (cleanPk === "문항" && cleanK.includes("번호")) return false;
              return cleanK.includes(cleanPk);
            });
          });
          return foundKey ? row[foundKey] : "";
        };

        const cohort = String(getVal(["기수", "cohort"]) || "전체");
        const respondent = cleanName(String(getVal(["응답자", "respondent", "이름"]) || "익명"));
        const department = String(getVal(["부서", "dept", "소속", "team"]) || "기타");

        const qNoVal = getVal(["문항번호", "qno", "번호"]);
        const questionVal = getVal(["문항내용", "문항 내용", "question", "문항"]);
        const responseVal = getVal(["응답", "점수", "답변", "response"]);

        if (qNoVal && responseVal !== undefined && responseVal !== null && String(responseVal).trim() !== "") {
          mappedSurvey.push({
            cohort,
            respondent,
            department,
            qNo: String(qNoVal),
            question: String(questionVal || qNoVal),
            response: String(responseVal),
          });
        } else {
          keys.forEach((key) => {
            const keyClean = key.toUpperCase().trim();
            if ((keyClean.startsWith("Q") || keyClean.includes("문항")) &&
                !keyClean.includes("번호") && !keyClean.includes("내용") && !keyClean.includes("이름")) {
              const qNoMatch = keyClean.match(/Q\d+/);
              const qNo = qNoMatch ? qNoMatch[0] : keyClean;
              mappedSurvey.push({
                cohort,
                respondent,
                department,
                qNo,
                question: key,
                response: String(row[key] || ""),
              });
            }
          });
        }
      });

      // Submit back to parenting App state
      onDataLoaded({
        main: mappedMain,
        schedule: mappedSchedule,
        survey: mappedSurvey,
      });

      setSheetsFetchedInfo({
        sheetId: targetId,
        lastSynced: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        sheetNames: data.sheetNames,
        counts: {
          main: mappedMain.length,
          schedule: mappedSchedule.length,
          survey: mappedSurvey.length,
        },
      });

      setSuccessStatus(
        `동기화 완료: '${targetId.substring(0, 8)}...' 구글 스프레드시트 3개 데이터 범주 파싱 성공!`
      );
    } catch (err: any) {
      console.error(err);
      setErrorStatus(`구글 연동 실패: ${err.message || "스프레드시트에서 데이터를 가져오지 못했습니다."}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto sync on mount
  useEffect(() => {
    fetchSpreadsheetData(sheetId);
  }, []);

  return (
    <div id="google-sheets-sync-root" className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 transition-all hover:shadow-md hover:border-emerald-300">
      <div className="space-y-3">
        {/* Upper badge & meta */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider font-mono">
              Live Cloud Sync
            </span>
          </div>
          <span className="bg-emerald-50 text-emerald-800 text-[8px] font-black px-1.5 py-0.5 rounded border border-emerald-100">
            {isUsingDefaultData ? "데모 모드" : "구글 연동 중"}
          </span>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-xs font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            구글 스프레드시트 실시간 동기화
          </h2>
          <p className="text-slate-400 text-[10px] sm:text-[11px] mt-0.5 leading-tight">
            지정 시트의 온보딩 대장 데이터를 실시간 파싱합니다.
          </p>
        </div>

        {/* Dynamic Status Badges inside the widget */}
        {sheetsFetchedInfo ? (
          <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between text-slate-400">
              <span>최근 동기화 시각:</span>
              <span className="font-extrabold text-slate-700 font-mono">{sheetsFetchedInfo.lastSynced || "방금"}</span>
            </div>
            <div className="w-full h-[1px] bg-slate-200/50"></div>
            <div className="flex flex-wrap gap-1.5">
              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-black px-1.5 py-0.5 rounded text-[9px]">
                메인: {sheetsFetchedInfo.counts.main}건
              </span>
              <span className="bg-emerald-50 border border-emerald-105 text-emerald-700 font-black px-1.5 py-0.5 rounded text-[9px]">
                일정: {sheetsFetchedInfo.counts.schedule}건
              </span>
              <span className="bg-sky-50 border border-sky-100 text-sky-700 font-black px-1.5 py-0.5 rounded text-[9px]">
                설문: {sheetsFetchedInfo.counts.survey}건
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 text-amber-700 p-2 rounded-xl text-[10px] font-medium leading-normal">
            데이터 동기화를 대기하고 있습니다...
          </div>
        )}

        {/* Action Panel Buttons - Stacked compactly */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          {/* Master Sync Button */}
          <button
            onClick={() => fetchSpreadsheetData(sheetId)}
            disabled={isLoading}
            className={`cursor-pointer font-extrabold text-[10px] py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs ${
              isLoading
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed col-span-2"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/5 col-span-2"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "구글 연동 가동 중..." : "실시간 동기화 실행"}
          </button>

          {/* External Link */}
          <a
            href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing`}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-750 font-extrabold text-[10px] py-2 rounded-lg flex items-center justify-center gap-1 transition-all"
          >
            <ExternalLink className="w-3 h-3 text-slate-400" />
            원본시트 열기
          </a>

          {/* Reset Demo Button */}
          <button
            onClick={() => {
              if (isUsingDefaultData) {
                alert("이미 기본 데모 상태입니다.");
                return;
              }
              onReset();
              setSheetsFetchedInfo(null);
              setSuccessStatus("기본 온보딩 데모데이터가 원복되었습니다.");
            }}
            className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-650 font-bold text-[10px] py-2 rounded-lg flex items-center justify-center gap-1 transition-all"
          >
            <ListRestart className="w-3 h-3 text-slate-400" />
            데모 원복
          </button>
        </div>

        {/* Spreadsheet ID Configuration Input Box (Collapsible/Input area) */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex flex-col gap-1">
            <span className="text-slate-400 font-extrabold text-[9px] tracking-tight">연동 스프레드시트 ID:</span>
            <input
              type="text"
              value={sheetId}
              onChange={(e) => setSheetId(e.target.value.trim())}
              placeholder="스프레드시트 Key 입력"
              className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-md px-2 py-1 outline-none font-mono text-[9px] text-slate-600 transition-all font-semibold"
            />
          </div>
        </div>

        {/* Notification Toast Status Messages - smaller sizes */}
        {errorStatus && (
          <div className="p-2 bg-rose-50 border border-rose-150 text-rose-800 rounded-lg text-[10px] flex items-start gap-1.5 animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">스프레드시트 동기화 권한 에러</span>
              <p className="text-[9px] text-rose-600/95 leading-tight">
                {errorStatus} <br />
                <b>해결:</b> 시트를 {"[공유 -> 링크가 있는 모든 사용자]"}로 공개해 주세요.
              </p>
            </div>
          </div>
        )}

        {successStatus && (
          <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-[10px] flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-emerald-700 text-[10px]">성공적으로 동기화됨!</span>
            </div>
            <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-black">ONLINE</span>
          </div>
        )}
      </div>
    </div>
  );
}
