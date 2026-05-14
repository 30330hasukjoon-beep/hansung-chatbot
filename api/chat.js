// ═══════════════════════════════════════════════════════════════
// 한성대학교 입시 상담 AI — Vercel 서버 코드
// 데이터 출처: admission_knowledge.json + raw_stats.json
// 원칙: 이 두 파일에 있는 내용만 근거로 답변. 추측·창작 금지.
// ═══════════════════════════════════════════════════════════════

const KNOWLEDGE = require('../data/admission_knowledge.json');
const RAW_STATS = require('../data/raw_stats.json');

// ───────────────────────────────────────────────────────────────
// 1. 키워드 사전
// ───────────────────────────────────────────────────────────────
const DEPT_KEYWORDS = {
  '크리에이티브인문학부': ['크리에이티브인문학부','크리에이티브인문','크리에이티브','인문학부'],
  '미래융합사회과학대학': ['미래융합사회과학대학','미래융합사회과학','미래융합','사회과학','사회과학부'],
  '글로벌패션산업학부': ['글로벌패션산업학부','글로벌패션산업','글로벌패션','패션'],
  '뷰티디자인매니지먼트학과': ['뷰티디자인매니지먼트학과','뷰티디자인매니지먼트','뷰티매니지먼트'],
  'ICT디자인학부': ['ICT디자인학부','ICT디자인','ict디자인'],
  'IT공과대학': ['IT공과대학','IT공과','IT공대','컴퓨터공학','기계전자','산업시스템'],
  '상상력인재학부': ['상상력인재학부','상상력인재','상상력'],
  '문학문화콘텐츠학과': ['문학문화콘텐츠학과','문학문화콘텐츠','문학문화','콘텐츠'],
  'AI응용학과': ['AI응용학과','AI응용','ai응용'],
  '융합보안학과': ['융합보안학과','융합보안'],
  '미래모빌리티학과': ['미래모빌리티학과','미래모빌리티','모빌리티'],
  '동양화': ['동양화전공','동양화'],
  '서양화': ['서양화전공','서양화'],
  '한국무용': ['한국무용전공','한국무용'],
  '현대무용': ['현대무용전공','현대무용'],
  '발레': ['발레전공','발레'],
  '예술학부': ['예술학부'],
  '융합행정학과': ['융합행정학과','융합행정'],
  '호텔외식경영학과': ['호텔외식경영학과','호텔외식경영','호텔'],
  '뷰티디자인학과': ['뷰티디자인학과(야간)','뷰티디자인학과'],
  '비즈니스컨설팅학과': ['비즈니스컨설팅학과','비즈니스컨설팅'],
  'ICT융합디자인학과': ['ICT융합디자인학과','ICT융합디자인'],
  'AI소프트웨어학과': ['AI소프트웨어학과','AI소프트웨어','ai소프트웨어','AI·소프트웨어']
};

const ADMISSION_KEYWORDS = {
  '교과우수': ['교과우수','교과우수전형','교과Ⅰ','교과1','교과1전형'],
  '지역균형': ['지역균형','지역균형전형','교과Ⅱ','교과2','학교장추천','추천전형'],
  '한성인재': ['한성인재','한성인재전형','학생부종합','종합전형','서류평가'],
  '실기우수자': ['실기우수자','실기우수자전형','실기전형','실기'],
  '고른기회': ['고른기회','고른기회전형','기회균형','국가보훈','기초생활','차상위','한부모'],
  '성인학습자': ['성인학습자','평생학습자','성인학습자전형','평생학습'],
  '특성화고졸재직자': ['재직자','특성화고졸재직자','재직자전형','재직'],
  '농어촌학생': ['농어촌','농어촌학생','농어촌전형'],
  '특성화고교졸업자': ['특성화고졸업자','특성화고교졸업자','특성화고졸'],
  '일반학생': ['정시','일반학생','수능위주','수능전형']
};

const TOPIC_KEYWORDS = {
  '일정': ['일정','기간','언제','날짜','원서','접수','발표','등록','충원','추합'],
  '추합': ['추합','충원합격','예비번호','예비순위','충원'],
  '자격': ['자격','지원자격','지원가능','지원불가','검정고시','특성화고','재직자','농어촌'],
  '수능최저': ['수능최저','최저기준','최저학력','수능최저학력'],
  '장학금': ['장학금','장학','학비','등록금감면','장학혜택'],
  '전형방법': ['전형방법','평가방법','반영방법','어떻게평가','평가항목','배점'],
  '모집인원': ['모집인원','몇명','인원','정원','몇 명'],
  '반영교과': ['반영교과','반영과목','내신과목','어떤과목'],
  '실기': ['실기고사','실기종목','준비물','실기내용','실기시험'],
  '변천이력': ['바뀌었','변경됐','달라졌','예전에','이전에','언제부터','신설','폐지','없어졌','바뀐','변경된'],
  '경쟁률': ['경쟁률','경쟁'],
  '전형추천': ['추천해줘','유리한','어떤전형','뭐가좋','어떻게하면','어느전형'],
  '수능반영': ['수능반영','영역별반영','반영비율','백분위','수학35','국어35'],
  '전형료': ['전형료','접수비','수수료','원서비'],
  '면접': ['면접','면접고사','면접전형'],
  '동점자': ['동점자','동점'],
  '학교폭력': ['학교폭력','폭력조치','폭력처분'],
  '수시정시': ['수시','정시','어느게좋','어느쪽'],
  '트랙': ['트랙','전공선택','학과선택'],
  '환산점수': ['환산','환산점수','내신환산','몇점']
};

const ADMISSION_KEY_MAP = {
  '교과우수': '교과우수',
  '지역균형': '지역균형',
  '한성인재': '한성인재',
  '실기우수자': '실기우수자',
  '고른기회': '기회균형_고른기회',
  '성인학습자': '성인학습자',
  '특성화고졸재직자': '특성화고졸재직자',
  '농어촌학생': '농어촌학생',
  '특성화고교졸업자': '특성화고교졸업자'
};

// ───────────────────────────────────────────────────────────────
// 2. 질문 분석
// ───────────────────────────────────────────────────────────────
function analyzeQuestion(text) {
  const lower = text.toLowerCase().replace(/\s/g, '');

  let detectedDepts = [];
  for (const [dept, keywords] of Object.entries(DEPT_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw.toLowerCase().replace(/\s/g, '')))) {
      detectedDepts.push(dept);
    }
  }

  let detectedAdmissions = [];
  for (const [admission, keywords] of Object.entries(ADMISSION_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw.toLowerCase().replace(/\s/g, '')))) {
      detectedAdmissions.push(admission);
    }
  }

  let detectedTopics = [];
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw.replace(/\s/g, '')))) {
      if (!detectedTopics.includes(topic)) detectedTopics.push(topic);
    }
  }

  const dayNight = lower.includes('야간') ? '야간' : lower.includes('주간') ? '주간' : null;
  const gradeMatch = text.match(/(\d+\.?\d*)\s*등급/);
  const grade = gradeMatch ? parseFloat(gradeMatch[1]) : null;

  // 정시/수시 구분
  const isJeongsi = detectedAdmissions.includes('일반학생') || lower.includes('정시') || lower.includes('가군') || lower.includes('나군') || lower.includes('다군');
  const isSusi = !isJeongsi || lower.includes('수시');

  return { detectedDepts, detectedAdmissions, detectedTopics, dayNight, grade, isJeongsi };
}

// ───────────────────────────────────────────────────────────────
// 3. RAG 컨텍스트 검색
// ───────────────────────────────────────────────────────────────
function retrieveContext(analysis) {
  const { detectedDepts, detectedAdmissions, detectedTopics, dayNight, isJeongsi } = analysis;
  let parts = [];

  // ── 면접 관련 질문 → 명확한 안내
  if (detectedTopics.includes('면접')) {
    parts.push(`【면접 관련 안내】
한성대학교 수시 전형(교과우수·지역균형·한성인재·고른기회·실기우수자·성인학습자·특성화고졸재직자·농어촌·특성화졸업자)에는 면접이 없습니다.
2026학년도에 성인학습자·특성화고졸재직자 전형의 일부 학과에 있었던 면접이 완전 폐지되어 전 학과 서류평가 100%로 단일화되었습니다.
정시에서는 ICT디자인학부(야간)가 수시 미충원 시에만 면접전형(수능 60%+면접 40%)으로 선발합니다. 그 외 정시는 수능 100% 또는 수능+실기입니다.
면접 이력: ${JSON.stringify(KNOWLEDGE.admission_history.면접이력, null, 2)}`);
  }

  // ── 일정 질문
  if (detectedTopics.includes('일정') || detectedTopics.includes('추합')) {
    if (isJeongsi) {
      parts.push('【정시 일정 상세】\n' + JSON.stringify(KNOWLEDGE.schedule_jeongsi, null, 2));
    } else {
      parts.push('【수시 일정 상세】\n' + JSON.stringify(KNOWLEDGE.schedule_susi, null, 2));
    }
    if (detectedTopics.includes('추합')) {
      parts.push(`【충원합격(추합) 일정 요약】
수시: 1차 12/18 → 2차 12/19 → 3차 12/20 → 4차 12/21 → 개별통보 12/22~23
정시: 1차 2/6 → 2차 2/9 → 3차 2/10 → 4차이후 개별통보 → 최종마감 2/12(목) 18:00`);
    }
  }

  // ── 지원자격·수능최저
  if (detectedTopics.includes('자격') || detectedTopics.includes('수능최저')) {
    if (detectedAdmissions.length > 0) {
      for (const adm of detectedAdmissions.slice(0, 3)) {
        const key = ADMISSION_KEY_MAP[adm];
        if (key && KNOWLEDGE.admission_eligibility[key]) {
          parts.push(`【${adm}전형 지원자격·전형방법 상세】\n` + JSON.stringify(KNOWLEDGE.admission_eligibility[key], null, 2));
        }
      }
    } else {
      parts.push(`【수능최저학력기준 전체 요약】
교과우수(주간): 국·수·영·탐(사/과 1과목) 중 2개 등급 합 7 이내
교과우수(야간): 국·수·영·탐 중 2개 등급 합 8 이내
※ 제2외국어/한문 탐구 대체 가능 (교과우수 한정)
지역균형·한성인재·기회균형·실기우수자·성인학습자·특성화고졸재직자·농어촌·특성화졸업자: 수능최저 없음
정시 일반학생: 수능최저 없음 (수능성적 자체가 전형요소)`);
      parts.push('【전형별 자격 전체】\n' + JSON.stringify(KNOWLEDGE.admission_eligibility, null, 2));
    }
  }

  // ── 전형방법 질문
  if (detectedTopics.includes('전형방법')) {
    if (detectedAdmissions.length > 0) {
      for (const adm of detectedAdmissions.slice(0, 2)) {
        const key = ADMISSION_KEY_MAP[adm];
        if (key && KNOWLEDGE.admission_eligibility[key]) {
          parts.push(`【${adm}전형 방법 상세】\n` + JSON.stringify(KNOWLEDGE.admission_eligibility[key], null, 2));
        }
      }
    }
  }

  // ── 장학금
  if (detectedTopics.includes('장학금')) {
    parts.push('【장학금 안내 전체】\n' + JSON.stringify(KNOWLEDGE.scholarships, null, 2));
  }

  // ── 모집인원
  if (detectedTopics.includes('모집인원')) {
    if (detectedAdmissions.length > 0) {
      for (const adm of detectedAdmissions.slice(0, 2)) {
        const key = ADMISSION_KEY_MAP[adm];
        if (key && KNOWLEDGE.admission_eligibility[key] && KNOWLEDGE.admission_eligibility[key].모집인원) {
          parts.push(`【${adm}전형 학과별 모집인원】\n` + JSON.stringify(KNOWLEDGE.admission_eligibility[key].모집인원, null, 2));
        }
      }
    }
    if (detectedAdmissions.includes('일반학생') || isJeongsi) {
      parts.push('【정시 전체 모집구조】\n' + JSON.stringify(KNOWLEDGE.jeongsi_structure, null, 2));
    } else {
      parts.push('【수시 전형별 총 모집인원】\n' + JSON.stringify(KNOWLEDGE.susi_common_rules, null, 2));
    }
  }

  // ── 변천이력
  if (detectedTopics.includes('변천이력')) {
    parts.push('【전형 변천 이력 전체】\n' + JSON.stringify(KNOWLEDGE.admission_history, null, 2));
  }

  // ── 학교폭력
  if (detectedTopics.includes('학교폭력')) {
    parts.push(`【학교폭력 조치사항 관련】
2026학년도부터 신설된 규정입니다.
학교폭력 조치사항을 받은 자는 수시·정시 전 전형 지원 불가합니다.
2025학년도까지는 해당 규정이 없었습니다.`);
  }

  // ── 수능반영비율 (정시)
  if (detectedTopics.includes('수능반영') || (isJeongsi && detectedDepts.length > 0)) {
    parts.push('【정시 수능 영역별 반영비율 및 영어·한국사 환산】\n' + JSON.stringify(KNOWLEDGE.suneung_ratio, null, 2));
  }

  // ── 실기고사
  if (detectedTopics.includes('실기')) {
    parts.push('【실기고사 안내 (수시+정시 공통)】\n' + JSON.stringify(KNOWLEDGE.practical_exam, null, 2));
    parts.push(`【실기고사 일정】
수시: 예술학부(동양화·서양화·무용) 2025.10.18 / ICT디자인 기초디자인 10.19 / ICT디자인 창의적표현+게임상황표현 10.26
정시: 예술학부 무용(수시미충원시 가군) 2026.01.07 / 예술학부 회화(다군) 2026.01.24`);
  }

  // ── 전형료
  if (detectedTopics.includes('전형료')) {
    parts.push('【전형료 안내】\n' + JSON.stringify(KNOWLEDGE.application_fee, null, 2));
  }

  // ── 내신 환산점수
  if (detectedTopics.includes('환산점수') || detectedTopics.includes('반영교과')) {
    parts.push('【교과우수전형 내신 환산점수 및 반영방법】\n' + JSON.stringify(KNOWLEDGE.grade_conversion, null, 2));
    if (detectedAdmissions.includes('교과우수') || detectedAdmissions.length === 0) {
      parts.push('【교과우수전형 반영교과 상세】\n' + JSON.stringify(KNOWLEDGE.admission_eligibility['교과우수'].반영교과, null, 2));
    }
  }

  // ── 동점자 처리
  if (detectedTopics.includes('동점자')) {
    parts.push('【동점자 처리 기준 전체】\n' + JSON.stringify(KNOWLEDGE.grade_conversion, null, 2));
    parts.push('【정시 동점자 처리】\n' + JSON.stringify(KNOWLEDGE.suneung_ratio.동점자처리_수능100, null, 2));
  }

  // ── 전형 추천
  if (detectedTopics.includes('전형추천') || detectedTopics.includes('수시정시')) {
    parts.push('【전형별 지원자격·전형방법 요약】\n' + JSON.stringify(KNOWLEDGE.admission_eligibility, null, 2));
    parts.push('【수시 공통 규칙】\n' + JSON.stringify(KNOWLEDGE.susi_common_rules, null, 2));
  }

  // ── 트랙/학과 안내
  if (detectedTopics.includes('트랙')) {
    parts.push('【모집단위 및 트랙 안내】\n' + JSON.stringify(KNOWLEDGE.departments, null, 2));
  }

  // ── 정시 구조 일반 질문
  if (isJeongsi && parts.length === 0) {
    parts.push('【정시 전체 모집구조】\n' + JSON.stringify(KNOWLEDGE.jeongsi_structure, null, 2));
    parts.push('【정시 수능 반영비율】\n' + JSON.stringify(KNOWLEDGE.suneung_ratio, null, 2));
  }

  // ── RAW 통계 (학과+전형 매칭)
  if (detectedDepts.length > 0) {
    const statsResults = [];
    for (const dept of detectedDepts.slice(0, 2)) {
      for (const [key, value] of Object.entries(RAW_STATS)) {
        if (!value.모집단위.includes(dept)) continue;
        if (dayNight) {
          const wantedChar = dayNight === '야간' ? '야' : '주';
          if (!value.모집단위.includes(`(${wantedChar})`)) continue;
        }
        if (detectedAdmissions.length > 0) {
          const admMatch = detectedAdmissions.some(adm =>
            value.전형 === adm ||
            value.전형.includes(adm) ||
            adm.includes(value.전형)
          );
          if (!admMatch) continue;
        }
        statsResults.push(value);
        if (statsResults.length >= 4) break;
      }
    }
    if (statsResults.length > 0) {
      parts.push('【합격자 통계 데이터 (2022~2025학년도 실제 결과)】\n' + formatStats(statsResults));
    }
  }

  // ── 아무것도 감지 안 된 경우 → 기본 안내
  if (parts.length === 0) {
    parts.push(`【한성대 입시 기본 안내】
수시 원서접수: 2025.09.08~09.12
정시 원서접수: 2025.12.29~12.31
수능최저: 교과우수주간(2개합7이내), 교과우수야간(2개합8이내), 나머지 전형 없음
면접: 수시 전 전형 없음 (2026학년도 기준)
문의: 입학관리팀 02-760-5800 / enter.hansung.ac.kr

【AI 운영 원칙】
이 챗봇은 admission_knowledge.json과 raw_stats.json 데이터에 있는 내용만 근거로 답변합니다.
데이터에 없는 내용은 추측하지 않고 입학관리팀 문의를 안내합니다.`);
  }

  return parts.join('\n\n---\n\n');
}

function formatStats(results) {
  let text = '';
  for (const item of results) {
    text += `\n▶ ${item.모집단위} / ${item.전형}전형\n`;
    const years = Object.keys(item.연도별).sort();
    const hasScore = years.some(y => item.연도별[y]['학생부평균']);
    const hasSuneung = years.some(y => item.연도별[y]['수능평균']);

    if (hasScore) {
      text += `학년도 | 모집 | 최초 | 추가 | 평균   | 70%컷\n`;
      for (const year of years) {
        const d = item.연도별[year];
        text += `${year}   | ${d.모집인원}명 | ${d.최초합격}명 | ${d.추가합격}명 | ${d['학생부평균'] || '-'} | ${d['학생부70%컷'] || '-'}\n`;
      }
    } else if (hasSuneung) {
      text += `학년도 | 모집 | 최초 | 추가 | 수능평균  | 70%컷\n`;
      for (const year of years) {
        const d = item.연도별[year];
        text += `${year}   | ${d.모집인원}명 | ${d.최초합격}명 | ${d.추가합격}명 | ${d['수능평균'] || '-'} | ${d['수능70%컷'] || '-'}\n`;
      }
    }

    const latestYear = years[years.length - 1];
    if (item.연도별[latestYear] && item.연도별[latestYear].고교유형분포) {
      const dist = item.연도별[latestYear].고교유형분포;
      const total = Object.values(dist).reduce((a, b) => a + b, 0);
      text += `${latestYear}년 고교유형: `;
      text += Object.entries(dist)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([k, v]) => `${k} ${Math.round(v / total * 100)}%`)
        .join(', ') + '\n';
    }
  }
  return text;
}

// ───────────────────────────────────────────────────────────────
// 4. 시스템 프롬프트 (전달받은 텍스트 전체 지침 반영)
// ───────────────────────────────────────────────────────────────
const BASE_SYSTEM = `당신은 한성대학교 공식 입시 상담 AI입니다.
수험생, 학부모, 교사 등 입시와 관련된 모든 질문에 친절하고 정확하게 답변합니다.

══════════════════════════════════════════
【핵심 운영 원칙 - 절대 위반 금지】
══════════════════════════════════════════

【원칙 1】 데이터 기반 상담 (할루시네이션 절대 금지)
- 오직 [검색된 관련 데이터]에 있는 내용만 근거로 답변합니다.
- [검색된 관련 데이터]에 없는 학과·전형·수치는 절대 추측하거나 지어내지 마세요.
- 데이터에 없는 내용은 반드시: "해당 데이터가 없어 정확한 안내가 어렵습니다. 입학관리팀(02-760-5800)으로 문의해 주세요."라고 안내하세요.
- 2026학년도 입시결과(합격자 통계)는 아직 공개되지 않아 데이터에 없습니다. 2022~2025학년도 데이터만 제공하세요.

【원칙 2】 ⚠️ 핵심 경고 문구 (입시결과 수치 제공 시 매번 필수 포함)
입시결과 수치를 제공할 때마다 반드시 아래 두 문장을 포함하세요. 절대 생략하지 마세요.
"⚠️ 이 수치보다 점수가 높다고 해서 반드시 합격하는 것이 아니고, 점수가 낮다고 해서 반드시 불합격하는 것도 아닙니다."
"입시 결과 수치는 참고용이며, 최종 판단은 반드시 본인이 하셔야 합니다."

【원칙 3】 확정적 표현 절대 금지
금지: "합격 가능합니다" / "불합격입니다" / "이 점수면 됩니다" / "안전권입니다" / "위험합니다"
권장: "최근 결과 기준으로는 ~에 해당합니다" / "참고 수치상 ~수준으로 보입니다" / "~보다 다소 낮은 수준입니다"

【원칙 4】 연도 변경 가능성 안내 (매 답변 포함)
입시 결과나 전형 안내 시 항상 포함:
"2027학년도 모집 방식은 변경될 수 있으므로, 요강 공개 후 반드시 재확인하세요. 수시 요강은 6월 중, 정시 요강은 8월 중 업데이트됩니다."

【원칙 5】 문의처 안내 (모든 답변 마지막에 필수)
"더 정확한 상담: 입학관리팀 ☎ 02-760-5800 / 입학 홈페이지 enter.hansung.ac.kr"

【원칙 6】 답변 범위 제한
- 한성대 입시와 무관한 질문(타 대학 비교, 수능 공부법, 일반 상식 등):
  "저는 한성대학교 입시 전문 상담 AI입니다. 한성대 입시와 관련된 질문을 해주세요."
- 개인정보(주민번호, 연락처 등) 수집 금지

【원칙 7】 답변 태도
- 친절하고 이해하기 쉬운 말로 답변. 전문 용어는 풀어서 설명.
- 수험생이 불안해하면 공감하되("입시 준비가 쉽지 않으셨겠어요.") 근거 없는 안심 금지.
- 질문이 모호하면 먼저 학과·전형·수시/정시 여부를 확인.

══════════════════════════════════════════
【면접 관련 절대 원칙】
══════════════════════════════════════════
한성대학교 2026학년도 수시 전형에는 면접이 없습니다.
- 교과우수·지역균형·한성인재·고른기회·실기우수자·성인학습자·특성화고졸재직자·농어촌·특성화졸업자 → 면접 없음
- 성인학습자·특성화고졸재직자 전형: 2025학년도까지 일부 학과 면접 있었으나 2026학년도 완전 폐지
- 정시에서 면접이 있는 경우: ICT디자인학부(야간) 수시 미충원 시에만 면접전형 (수능 60%+면접 40%)
- 절대로 수시 전형에 면접이 있다고 답변하지 마세요.

══════════════════════════════════════════
【상담 상황별 대응 지침】
══════════════════════════════════════════

[내신 등급으로 합격 가능성 질문 시]
1. 해당 학과의 최근 5개년 70%컷 수치를 표로 제시
2. 수험생 등급이 어느 위치에 해당하는지 설명
3. 교과우수전형이면 수능최저 조건 안내
4. ⚠️ 경고 문구 필수 포함
5. 문의처 안내

[전형 추천 요청 시]
목표학과/계열, 수시/정시, 내신등급, 수능등급, 학교장추천가능여부, 비교과여부, 특수자격여부를 확인 후 전형 2~3개를 데이터 기반으로 비교

[경쟁률 질문 시]
최근 5개년 경쟁률 추이 + 충원합격 규모 함께 제공. "경쟁률 높다고 불합격, 낮다고 합격 아님" 안내.

[충원합격(추합) 질문 시]
추합 규모 데이터 제시 + 수시충원(1차12/18→4차12/21→개별통보12/22~23) + 정시충원(1차2/6→최종마감2/12) 안내

[수능최저 질문 시]
교과우수주간: 2개합7이내 / 교과우수야간: 2개합8이내 / 나머지: 없음 명확히 안내

[지원자격 질문 시]
전형별 자격 안내. 학교폭력 처분자는 2026학년도부터 전 전형 지원 불가.

[정시 수능 반영방법 질문 시]
모집단위별 영역별 반영비율 + 영어 등급별 점수 + 한국사 가산점 함께 안내

[전형 변경 이력 질문 시]
특기자(뷰티)폐지 / 농어촌·특성화졸업자 학생부교과 변경 / 성인학습자 면접폐지 / 지역균형 반영교과 확대 / 학교폭력처분자 제한 신설 강조

[수험생이 불안/좌절할 때]
공감 표현 먼저 → 데이터 기반 현실적 안내 → 입학관리팀 전문 상담 권유

[2027학년도 질문 시]
"2027학년도 요강은 아직 공개되지 않았습니다. 수시 요강은 6월 중, 정시 요강은 8월 중 업데이트됩니다. enter.hansung.ac.kr에서 확인하세요."

══════════════════════════════════════════
아래 [검색된 관련 데이터]를 바탕으로 위 원칙에 따라 친절하게 답변하세요.
데이터에 없는 내용은 절대 추측하지 말고, 데이터 범위 내에서만 답변하세요.`;

// ───────────────────────────────────────────────────────────────
// 5. Vercel 핸들러
// ───────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });

  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: '메시지가 없습니다.' });

    // RAG 실행
    const analysis = analyzeQuestion(message);
    const retrievedContext = retrieveContext(analysis);
    const systemPrompt = BASE_SYSTEM + '\n\n[검색된 관련 데이터]\n' + retrievedContext;

    const contents = [
      ...history.slice(-10),
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048
          }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json({ error: errData?.error?.message || '오류 발생' });
    }

    const data = await response.json();
    const botText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '답변을 가져오지 못했습니다.';

    return res.status(200).json({
      reply: botText,
      debug: {
        depts: analysis.detectedDepts,
        admissions: analysis.detectedAdmissions,
        topics: analysis.detectedTopics,
        isJeongsi: analysis.isJeongsi,
        contextSize: retrievedContext.length
      }
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
