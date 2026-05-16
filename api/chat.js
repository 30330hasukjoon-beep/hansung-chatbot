// ═══════════════════════════════════════════════════════════════
// 한성대학교 입시 상담 AI — Vercel 서버 코드 v4
// (할루시네이션 방지 + 데이터 검색 강화 버전)
// ═══════════════════════════════════════════════════════════════

const KNOWLEDGE = require('../data/admission_knowledge.json');
const RAW_STATS = require('../data/raw_stats.json');

// ───────────────────────────────────────────────────────────────
// 1. 키워드 사전 (확장판)
// ───────────────────────────────────────────────────────────────
const DEPT_KEYWORDS = {
  '크리에이티브인문학부': ['크리에이티브인문학부','크리에이티브인문','크리에이티브','인문학부','인문계','인문'],
  '미래융합사회과학대학': ['미래융합사회과학대학','미래융합사회과학','미래융합','사회과학','사회과학부','사회계열','사회대'],
  '글로벌패션산업학부': ['글로벌패션산업학부','글로벌패션산업','글로벌패션','패션','패션산업'],
  '뷰티디자인매니지먼트학과': ['뷰티디자인매니지먼트학과','뷰티디자인매니지먼트','뷰티디자인매니','뷰티매니지먼트'],
  'ICT디자인학부': ['ICT디자인학부','ICT디자인','ict디자인','아이씨티디자인','기초디자인','창의적표현','게임상황표현'],
  'IT공과대학': ['IT공과대학','IT공과','IT공대','it공과','컴퓨터공학','기계전자','산업시스템','공과대학','공대','it계열','아이티공과'],
  '상상력인재학부': ['상상력인재학부','상상력인재','상상력','자율전공'],
  '문학문화콘텐츠학과': ['문학문화콘텐츠학과','문학문화콘텐츠','문학문화','콘텐츠','문콘'],
  'AI응용학과': ['AI응용학과','AI응용','ai응용','에이아이응용'],
  '융합보안학과': ['융합보안학과','융합보안','보안학과'],
  '미래모빌리티학과': ['미래모빌리티학과','미래모빌리티','모빌리티','자동차'],
  '동양화': ['동양화','동양화전공','수묵담채','수묵담채화'],
  '서양화': ['서양화','서양화전공','수채화'],
  '한국무용': ['한국무용','한무'],
  '현대무용': ['현대무용','현무'],
  '발레': ['발레'],
  '예술학부': ['예술학부','회화','무용'],
  '융합행정학과': ['융합행정학과','융합행정'],
  '호텔외식경영학과': ['호텔외식경영학과','호텔외식경영','호텔외식','호텔','외식'],
  '뷰티디자인학과': ['뷰티디자인학과'],
  '비즈니스컨설팅학과': ['비즈니스컨설팅학과','비즈니스컨설팅','비즈니스'],
  'ICT융합디자인학과': ['ICT융합디자인학과','ICT융합디자인','ict융합'],
  'AI소프트웨어학과': ['AI소프트웨어학과','AI소프트웨어','ai소프트웨어','AI·소프트웨어','에이아이소프트웨어','미래인재학부','미래인재']
};

const ADMISSION_KEYWORDS = {
  '교과우수': ['교과우수','교과우수전형','교과Ⅰ','교과1','교과전형'],
  '지역균형': ['지역균형','지역균형전형','교과Ⅱ','교과2','학교장추천','추천전형','학교장 추천'],
  '한성인재': ['한성인재','한성인재전형','학생부종합','종합전형','서류전형'],
  '실기우수자': ['실기우수자','실기우수자전형','실기전형'],
  '고른기회': ['고른기회','고른기회전형','기회균형','국가보훈','기초생활','차상위','한부모'],
  '성인학습자': ['성인학습자','평생학습자','성인학습자전형','만30세','30세이상','만 30세'],
  '특성화고졸재직자': ['특성화고졸재직자','특성화고교졸재직자','재직자전형','재직자','특성화 재직'],
  '농어촌학생': ['농어촌','농어촌학생','농어촌전형','읍면','읍·면','도서벽지'],
  '특성화고교졸업자': ['특성화고졸업자','특성화고교졸업자','특성화고교졸','동일계열','기준학과'],
  '특기자(뷰티)': ['특기자','뷰티특기자','미용사자격증','특기자뷰티'],
  '일반학생': ['정시','일반학생','수능위주','수능전형']
};

const TOPIC_KEYWORDS = {
  '일정': ['일정','기간','언제','날짜','원서','접수','발표','등록','마감','충원일정','서류제출'],
  '추합': ['추합','충원합격','예비번호','예비순위','충원','추가합격','몇번','몇차'],
  '자격': ['자격','지원자격','지원가능','지원불가','지원 조건','조건','해당되','지원할수','지원 자격'],
  '수능최저': ['수능최저','최저','수능최저기준','최저등급','최저 조건','최저학력'],
  '장학금': ['장학금','장학','학비','등록금감면','장학 혜택','학비 지원','진리장학','지선장학','우촌장학'],
  '전형방법': ['전형방법','평가방법','반영방법','어떻게평가','어떻게 뽑','선발방법','어떻게선발','평가요소'],
  '모집인원': ['모집인원','몇명','인원','정원','몇 명','선발인원','뽑나','뽑는'],
  '반영교과': ['반영교과','반영과목','내신과목','어떤 과목','과목 반영','내신 반영','반영되는'],
  '실기': ['실기고사','실기종목','준비물','실기내용','실기 준비','실기 일정','실기시험'],
  '변천이력': ['바뀌었','변경','달라졌','예전','이전','언제부터','신설','폐지','없어졌','작년과','올해 바뀐','개편','생겼','사라졌'],
  '경쟁률': ['경쟁률','경쟁','몇대일','지원자수','지원인원','지원율'],
  '전형추천': ['추천해','유리한','어떤전형','뭐가좋','어디가좋','어떤 전형','뭐가 유리','어디 지원','어디로 지원','어느 전형'],
  '전형비교': ['비교해','vs','versus','차이','다른점','어떻게달라','둘다','두전형','두 전형','어느게'],
  '수능최저계산': ['수능최저되나','최저충족','등급합','합이','최저기준충족','최저될까','최저넘나','최저통과'],
  '검정고시': ['검정고시','검정고시출신','고졸검정','학력인정'],
  '기준학과': ['기준학과','동일계열','계열확인서','동일계열확인','같은계열','관련학과'],
  '특성화고지원': ['특성화고생','특성화고출신','특성화고학생','특성화고재학','특성화고다니','특성화고인데'],
  '수능반영': ['수능반영','영역별반영','반영비율','백분위','수능 반영','영역 반영','어떤 영역','영어등급','한국사','가산점'],
  '전형료': ['전형료','접수비','수수료','원서 비용','원서비','지원비용'],
  '합격가능성': ['합격','합격선','합격자평균','70%컷','붙을','붙나','떨어질','합격할','합격가능','합격 가능','커트라인'],
  '정시이월': ['정시에서도','미충원','이월','조건부','♣','수시 미충원'],
  '면접': ['면접','면접고사','면접 있','면접 없'],
  '고교유형': ['고교유형','일반고','자사고','특목고','자율고','어떤 고등학교','고등학교 유형','고교 분포'],
  '지원횟수': ['지원횟수','6회','여섯번','몇번지원','몇 번 지원','중복지원','복수지원','여러전형','여러 전형','지원 횟수'],
  '수시정시': ['수시합격','수시붙','수시 붙','정시지원가능','정시 지원','수시합격후','수시 합격 후','정시도','수시되면'],
  '휴학': ['휴학','복학','입대','군대'],
  '학과목록': ['학과목록','어떤학과','무슨학과','학과 종류','전공 종류','어떤 전공','학부 종류','개설학과','어떤과','학과가 뭐'],
  '트랙': ['트랙','전공트랙','트랙제','전공선택','전공변경'],
  '동점자': ['동점자','동점','같은점수','동점일','동점 처리','동점자처리'],
  '연락처': ['연락처','전화번호','전화 번호','입학처','입학관리팀','문의처','어디로문의','문의전화'],
  '찾아오는길': ['찾아오는길','오시는길','교통','지하철','버스','어떻게가','위치','학교 위치','한성대입구'],
  '학교폭력': ['학교폭력','학폭','학교 폭력','학폭처분']
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

// 모집인원 학과별 데이터 키 매핑
const QUOTA_KEY_MAP = {
  '교과우수': '교과우수_학과별',
  '지역균형': '지역균형_학과별',
  '한성인재': '한성인재_학과별',
  '실기우수자': '실기우수자_학과별',
  '성인학습자': '성인학습자_학과별',
  '특성화고졸재직자': '특성화졸재직자_학과별'
};

const CONDITIONAL_DEPTS = [
  '뷰티디자인매니지먼트학과', '문학문화콘텐츠학과',
  'ICT디자인학부(야간)', '한국무용', '현대무용', '발레'
];

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

  const gradeMatch =
    text.match(/(\d+\.?\d*)\s*등급/) ||
    text.match(/내신\s*(\d+\.?\d*)/) ||
    text.match(/학생부\s*(\d+\.?\d*)/) ||
    text.match(/(\d+\.?\d*)\s*점대/);
  const grade = gradeMatch ? parseFloat(gradeMatch[1]) : null;

  const suneungMatch =
    text.match(/수능\s*(\d{3,4})\s*점/) ||
    text.match(/(\d{3,4})\s*점대/) ||
    text.match(/환산\s*(\d{3,4})/);
  const suneungScore = suneungMatch ? parseInt(suneungMatch[1]) : null;

  const gradeMap = {};
  const subjectPatterns = [
    { key: '국어', regex: /국어\s*(\d)등급|국어\s*(\d)\s*등/ },
    { key: '수학', regex: /수학\s*(\d)등급|수학\s*(\d)\s*등/ },
    { key: '영어', regex: /영어\s*(\d)등급|영어\s*(\d)\s*등/ },
    { key: '탐구', regex: /탐구\s*(\d)등급|탐구\s*(\d)\s*등|사탐\s*(\d)|과탐\s*(\d)/ },
  ];
  subjectPatterns.forEach(({ key, regex }) => {
    const m = text.match(regex);
    if (m) gradeMap[key] = parseInt(m[1] || m[2] || m[3] || m[4]);
  });

  return { detectedDepts, detectedAdmissions, detectedTopics, dayNight, grade, suneungScore, gradeMap };
}

// ───────────────────────────────────────────────────────────────
// 3. 개별 합격자 데이터 분석
// ───────────────────────────────────────────────────────────────
function analyzeIndividualApplicants(applicants, userGrade, userScore) {
  if (!applicants || applicants.length === 0) return null;

  const result = {
    총합격자수: applicants.length,
    최초합격수: applicants.filter(a => a.합격구분 === '최초합격').length,
    추가합격수: applicants.filter(a => a.합격구분 === '추가합격').length,
    고교유형분포: {},
    유사성적사례: []
  };

  applicants.forEach(a => {
    result.고교유형분포[a.고교유형] = (result.고교유형분포[a.고교유형] || 0) + 1;
  });

  if (userGrade) {
    const margin = 0.3;
    const similar = applicants.filter(a =>
      a.학생부등급 && Math.abs(a.학생부등급 - userGrade) <= margin
    );
    if (similar.length > 0) {
      result.유사성적사례 = similar.slice(0, 5).map(a => ({
        고교유형: a.고교유형,
        학생부등급: a.학생부등급,
        합격구분: a.합격구분,
        추가합격차수: a.추가합격차수 || null
      }));
      result.유사성적범위 = `${(userGrade - margin).toFixed(1)}~${(userGrade + margin).toFixed(1)}등급`;
    }
  }

  if (userScore) {
    const margin = 15;
    const similar = applicants.filter(a =>
      a.수능총점 && Math.abs(a.수능총점 - userScore) <= margin
    );
    if (similar.length > 0) {
      result.유사성적사례 = similar.slice(0, 5).map(a => ({
        고교유형: a.고교유형,
        수능총점: a.수능총점,
        합격구분: a.합격구분,
        추가합격차수: a.추가합격차수 || null
      }));
      result.유사성적범위 = `${userScore - margin}~${userScore + margin}점`;
    }
  }

  return result;
}

// ───────────────────────────────────────────────────────────────
// 4. RAG 컨텍스트 검색
// ───────────────────────────────────────────────────────────────
function retrieveContext(analysis, message = '') {
  const { detectedDepts, detectedAdmissions, detectedTopics, dayNight, grade, suneungScore } = analysis;
  let parts = [];

  // ── 일정 ──
  if (detectedTopics.includes('일정') || detectedTopics.includes('추합')) {
    const isJeongsi = detectedAdmissions.includes('일반학생') || message.includes('정시');
    const isSusi = detectedAdmissions.some(a => a !== '일반학생') ||
                   message.includes('수시');
    if (isJeongsi && !isSusi) {
      parts.push('【정시 일정】\n' + JSON.stringify(KNOWLEDGE.schedule_jeongsi, null, 2));
    } else if (isSusi && !isJeongsi) {
      parts.push('【수시 일정】\n' + JSON.stringify(KNOWLEDGE.schedule_susi, null, 2));
    } else {
      // 수시/정시 구분이 명확하지 않으면 둘 다 제공
      parts.push('【수시 일정】\n' + JSON.stringify(KNOWLEDGE.schedule_susi, null, 2));
      parts.push('【정시 일정】\n' + JSON.stringify(KNOWLEDGE.schedule_jeongsi, null, 2));
    }
  }

  // ── 면접 ──
  if (detectedTopics.includes('면접')) {
    parts.push(`【면접 관련 안내】
한성대학교 수시 전형(교과우수·지역균형·한성인재·고른기회·실기우수자·성인학습자·특성화고졸재직자·농어촌·특성화졸업자)에는 면접이 없습니다.
2026학년도에 성인학습자·특성화고졸재직자 전형의 면접도 완전 폐지되어 전 학과 서류평가 100%로 통일되었습니다.
정시에서 ICT디자인학부(야간)만 수시 미충원 시에 한해 면접전형(수능60%+면접40%)으로 선발합니다.`);
  }

  // ── 자격 / 수능최저 / 전형방법 — 전형별 상세 ──
  const needEligibility = detectedTopics.includes('자격') ||
                          detectedTopics.includes('수능최저') ||
                          detectedTopics.includes('전형방법') ||
                          detectedTopics.includes('반영교과');
  if (needEligibility) {
    if (detectedAdmissions.length > 0) {
      for (const adm of detectedAdmissions.slice(0, 3)) {
        const key = ADMISSION_KEY_MAP[adm];
        if (key && KNOWLEDGE.admission_eligibility[key]) {
          parts.push(`【${adm}전형 자격·전형방법 상세】\n` + JSON.stringify(KNOWLEDGE.admission_eligibility[key], null, 2));
        }
      }
    } else {
      // 전형 특정 안 됨 → 전체 전형 자격 요약 제공
      parts.push('【전체 전형 자격·전형방법 요약】\n' + JSON.stringify(KNOWLEDGE.admission_eligibility, null, 2));
    }
    // 수능최저 요약은 항상 추가
    if (detectedTopics.includes('수능최저')) {
      parts.push('【수능최저학력기준 요약】\n' +
        '교과우수(주간): 국·수·영·탐(사/과 1과목) 중 2개 영역 등급 합 7 이내\n' +
        '교과우수(야간): 국·수·영·탐 중 2개 영역 등급 합 8 이내\n' +
        '제2외국어/한문 영역은 탐구 과목으로 대체 가능\n' +
        '지역균형·한성인재·기회균형(고른기회)·실기우수자·성인학습자·특성화고졸재직자·농어촌·특성화고교졸업자: 수능최저 없음');
    }
    // 반영교과 정보
    if (detectedTopics.includes('반영교과') && KNOWLEDGE.grade_conversion) {
      parts.push('【내신 반영교과·반영방법】\n' + JSON.stringify({
        반영교과_교과우수: KNOWLEDGE.grade_conversion.반영교과_교과우수,
        반영방법_교과우수: KNOWLEDGE.grade_conversion.반영방법_교과우수,
        학년별가중치: KNOWLEDGE.grade_conversion.학년별가중치,
        교과우수_환산점수: KNOWLEDGE.grade_conversion.교과우수_환산점수,
        진로선택_환산: KNOWLEDGE.grade_conversion.진로선택_환산,
        지역균형_반영교과: '국어·영어·수학·사회·과학 계열 전과목 (3학년 1학기까지)'
      }, null, 2));
    }
  }

  // ── 장학금 ──
  if (detectedTopics.includes('장학금')) {
    parts.push('【장학금 안내】\n' + JSON.stringify(KNOWLEDGE.scholarships, null, 2));
  }

  // ── 모집인원 ──
  if (detectedTopics.includes('모집인원')) {
    if (detectedAdmissions.length > 0) {
      for (const adm of detectedAdmissions.slice(0, 3)) {
        const quotaKey = QUOTA_KEY_MAP[adm];
        if (quotaKey && KNOWLEDGE.admission_quota && KNOWLEDGE.admission_quota[quotaKey]) {
          parts.push(`【${adm}전형 학과별 모집인원】\n` + JSON.stringify(KNOWLEDGE.admission_quota[quotaKey], null, 2));
        }
        // 정원 요약
        if (KNOWLEDGE.admission_quota.수시_정원내 && KNOWLEDGE.admission_quota.수시_정원내[adm]) {
          parts.push(`【${adm}전형 총 모집인원】\n` + JSON.stringify(KNOWLEDGE.admission_quota.수시_정원내[adm], null, 2));
        }
      }
    }
    // 정시 모집인원
    if (detectedAdmissions.includes('일반학생') || message.includes('정시')) {
      parts.push('【정시 모집인원 (군별)】\n' + JSON.stringify({
        정시전체: KNOWLEDGE.admission_quota.정시전체,
        정시_가군: KNOWLEDGE.admission_quota.정시_가군,
        정시_나군: KNOWLEDGE.admission_quota.정시_나군,
        정시_다군_수능: KNOWLEDGE.admission_quota.정시_다군_수능,
        정시_다군_실기: KNOWLEDGE.admission_quota.정시_다군_실기
      }, null, 2));
    }
    if (KNOWLEDGE.admission_quota) {
      parts.push('【수시 전체 모집인원】\n' + JSON.stringify(KNOWLEDGE.admission_quota.수시전체, null, 2));
    }
  }

  // ── 변천 이력 ──
  if (detectedTopics.includes('변천이력')) {
    parts.push('【전형 변천 이력 (연도별 변경사항)】\n' + JSON.stringify(KNOWLEDGE.admission_history, null, 2));
  }

  // ── 정시 수능 반영비율 ──
  if (detectedTopics.includes('수능반영') ||
      (detectedAdmissions.includes('일반학생') && (detectedDepts.length > 0 || detectedTopics.includes('전형방법')))) {
    parts.push('【정시 수능 영역별 반영비율 + 영어/한국사 환산】\n' + JSON.stringify(KNOWLEDGE.suneung_ratio, null, 2));
  }

  // ── 실기고사 ──
  if (detectedTopics.includes('실기')) {
    parts.push('【실기고사 종목·준비물 안내】\n' + JSON.stringify(KNOWLEDGE.practical_exam, null, 2));
    parts.push('【실기고사 일정 (수시·정시)】\n' + JSON.stringify({
      수시_실기고사: KNOWLEDGE.schedule_susi.실기고사,
      수시_실기고사시간: KNOWLEDGE.schedule_susi.실기고사시간,
      정시_실기고사: KNOWLEDGE.schedule_jeongsi.실기고사
    }, null, 2));
  }

  // ── 전형료 ──
  if (detectedTopics.includes('전형료')) {
    parts.push('【전형료】\n' + JSON.stringify(KNOWLEDGE.application_fee, null, 2));
  }

  // ── 지원횟수 / 중복지원 ──
  if (detectedTopics.includes('지원횟수')) {
    parts.push('【수시·정시 지원 횟수 규정】\n' + JSON.stringify(KNOWLEDGE.susi_common_rules, null, 2));
  }

  // ── 수시합격 후 정시 지원 가능 여부 ──
  if (detectedTopics.includes('수시정시')) {
    parts.push('【수시 합격 시 정시 지원 가능 여부】\n' +
      '수시모집에서 합격(최초합격·충원합격 모두 포함)하면 등록 여부와 관계없이 ' +
      '이후 모든 대학의 정시모집 및 추가모집에 지원할 수 없습니다. 위반 시 입학이 취소됩니다.\n' +
      JSON.stringify(KNOWLEDGE.susi_common_rules, null, 2));
  }

  // ── 휴학 ──
  if (detectedTopics.includes('휴학')) {
    parts.push('【신입생 휴학 규정】\n' +
      '신입생은 학칙에 명시된 경우 이외에는 입학 후 1년간 휴학이 불가합니다.\n' +
      '신입생휴학: ' + (KNOWLEDGE.susi_common_rules.신입생휴학 || ''));
  }

  // ── 학교폭력 ──
  if (detectedTopics.includes('학교폭력')) {
    parts.push('【학교폭력 처분자 지원 제한】\n' +
      '2026학년도부터 학교폭력 조치사항을 받은 자는 수시·정시 전 전형에 지원할 수 없습니다(신설 규정).\n' +
      '학교폭력처분: ' + (KNOWLEDGE.susi_common_rules.학교폭력처분 || ''));
  }

  // ── 학과 목록 ──
  if (detectedTopics.includes('학과목록') || detectedTopics.includes('트랙')) {
    parts.push('【한성대학교 단과대학·학과(전공) 목록】\n' + JSON.stringify(KNOWLEDGE.departments, null, 2));
  }

  // ── 동점자 처리 ──
  if (detectedTopics.includes('동점자')) {
    parts.push('【동점자 처리 기준】\n' + JSON.stringify({
      학생부교과_전형: KNOWLEDGE.grade_conversion.동점자_교과,
      학생부종합_전형: KNOWLEDGE.grade_conversion.동점자_종합,
      실기위주_전형: KNOWLEDGE.grade_conversion.동점자_실기,
      정시_수능전형: KNOWLEDGE.grade_conversion.동점자_정시수능,
      정시_실기전형: KNOWLEDGE.grade_conversion.동점자_정시실기
    }, null, 2));
  }

  // ── 연락처 / 찾아오는 길 ──
  if (detectedTopics.includes('연락처') || detectedTopics.includes('찾아오는길')) {
    parts.push('【입학 문의처 및 찾아오는 길】\n' + JSON.stringify(KNOWLEDGE.contact, null, 2));
  }

  // ── 전형 추천 ──
  if (detectedTopics.includes('전형추천')) {
    if (KNOWLEDGE.admission_eligibility) {
      parts.push('【전형별 자격 요약】\n' + JSON.stringify(KNOWLEDGE.admission_eligibility, null, 2));
    }
    if (KNOWLEDGE.grade_conversion) {
      parts.push('【내신 환산 및 반영교과】\n' + JSON.stringify(KNOWLEDGE.grade_conversion, null, 2));
    }
    if (KNOWLEDGE['전형별_전체요약']) {
      const 전형목록 = detectedAdmissions.length > 0 ? detectedAdmissions : ['교과우수', '지역균형', '한성인재'];
      전형목록.slice(0, 3).forEach(adm => {
        const key = adm + '_전체요약';
        if (KNOWLEDGE['전형별_전체요약'][key]) {
          parts.push(`【${adm}전형 최근 입시결과 요약】\n` + KNOWLEDGE['전형별_전체요약'][key]);
        }
      });
    }
  }

  // ── 전형 비교 ──
  if (detectedTopics.includes('전형비교') && detectedAdmissions.length >= 1) {
    const compareAdms = detectedAdmissions.slice(0, 3);
    let compareText = '【전형 비교표】\n';
    const fields = ['자격','가능','가능고교','불가고교','검정고시','수능최저','수능최저_주간','수능최저_야간','전형방법','전형료'];
    compareAdms.forEach(adm => {
      const key = ADMISSION_KEY_MAP[adm] || adm;
      const info = KNOWLEDGE.admission_eligibility && KNOWLEDGE.admission_eligibility[key];
      if (info) {
        compareText += `\n[${adm}전형]\n`;
        fields.forEach(f => {
          if (info[f]) compareText += `  ${f}: ${typeof info[f] === 'object' ? JSON.stringify(info[f]) : info[f]}\n`;
        });
      }
    });
    compareText += '\n【최근(2025~2026) 70%컷 비교】\n';
    compareAdms.forEach(adm => {
      for (const dept of detectedDepts.slice(0,1)) {
        for (const [key, val] of Object.entries(RAW_STATS)) {
          if (val.모집단위.includes(dept) && val.전형 === adm) {
            const yrs = Object.keys(val.연도별).sort().slice(-2);
            yrs.forEach(yr => {
              const d = val.연도별[yr];
              const cut = d['학생부70%컷'] || d['수능70%컷'];
              const comp = d['경쟁률'];
              if (cut) compareText += `  ${adm} ${val.모집단위} ${yr}: 70%컷=${cut}, 경쟁률=${comp||'-'}:1\n`;
            });
            break;
          }
        }
      }
    });
    parts.push(compareText);
  }

  // ── 수능최저 계산 ──
  if (detectedTopics.includes('수능최저계산')) {
    parts.push('【수능최저 충족 계산 안내】\n' +
      '교과우수(주간): 국·수·영·탐(사/과 1과목) 중 2개 영역 등급 합 7 이내\n' +
      '교과우수(야간): 국·수·영·탐 중 2개 영역 등급 합 8 이내\n' +
      '제2외국어/한문을 탐구 대체 가능\n' +
      '지역균형·한성인재·기회균형·실기우수자: 수능최저 없음\n\n' +
      '[계산 방법] 본인 영역 등급 중 가장 좋은 2개를 더해서 비교\n' +
      '예) 국어 2등급 + 수학 3등급 = 합 5 → 주간 7이내 ✅ 충족\n' +
      '예) 국어 3등급 + 영어 4등급 = 합 7 → 주간 7이내 ✅ 충족\n' +
      '예) 국어 4등급 + 수학 4등급 = 합 8 → 주간 초과 ❌ / 야간 8이내 ✅'
    );
  }

  // ── 검정고시 ──
  if (detectedTopics.includes('검정고시')) {
    if (KNOWLEDGE['검정고시_전형별_가능여부']) {
      parts.push('【검정고시 출신자 지원 가능 전형】\n' +
        JSON.stringify(KNOWLEDGE['검정고시_전형별_가능여부'], null, 2));
    }
  }

  // ── 기준학과 ──
  if (detectedTopics.includes('기준학과')) {
    const info = KNOWLEDGE.admission_eligibility && KNOWLEDGE.admission_eligibility['특성화고교졸업자'];
    if (info) {
      parts.push('【특성화고교졸업자 전형 기준학과 안내】\n' +
        JSON.stringify(info, null, 2));
    }
  }

  // ── 특성화고 지원 ──
  if (detectedTopics.includes('특성화고지원')) {
    parts.push('【특성화고 출신 지원 가능 전형 안내】\n' +
      '특성화고 출신자가 지원 가능한 전형:\n' +
      '  ① 특성화고교졸업자전형(정원외) - 동일계열확인서 필수\n' +
      '  ② 한성인재전형(정원내) - 서류평가 100%\n' +
      '  ③ 성인학습자전형 - 특성화고 졸업 후 3년 이상 재직자\n' +
      '  ④ 특성화고졸재직자전형(정원외) - 3년 이상 재직자\n\n' +
      '특성화고 출신자가 지원 불가한 전형:\n' +
      '  ✗ 교과우수전형 - 일반고·자율고·특목고만 지원 가능\n' +
      '  ✗ 지역균형전형 - 특성화고 지원 불가'
    );
  }

  // ── 한성인재 서류평가 항목 ──
  if (detectedAdmissions.includes('한성인재') &&
      (detectedTopics.includes('전형방법') || detectedTopics.includes('합격가능성') ||
       detectedTopics.includes('자격') || message.includes('평가') || message.includes('서류'))) {
    const info = KNOWLEDGE.admission_eligibility && KNOWLEDGE.admission_eligibility['한성인재'];
    if (info && info.평가영역) {
      parts.push('【한성인재전형 서류평가 항목 상세】\n' +
        '전형방법: 학생부 서류평가 100% (교과+비교과 정성종합평가)\n\n' +
        '평가영역 및 배점:\n' +
        '  학업역량 (30점)\n' +
        '    - 학업성취도: 15점\n' +
        '    - 지적탐구력: 15점\n' +
        '  진로역량 (40점)\n' +
        '    - 계열 관련 교과 성취도: 20점\n' +
        '    - 계열적합성: 20점\n' +
        '  공동체역량 (30점)\n' +
        '    - 리더십·협업과 소통능력: 20점\n' +
        '    - 나눔과 배려·성실성과 규칙준수: 10점\n\n' +
        '평가자료: 학교생활기록부(교과+비교과) 정성·종합 평가\n' +
        '수능최저: 없음'
      );
    }
  }

  // ── 정시 이월(조건부 학과) ──
  if (detectedTopics.includes('정시이월')) {
    parts.push(`【정시 수시 미충원 시에만 선발하는 학과 (♣ 조건부)】
- 뷰티디자인매니지먼트학과(주·야): 수시 미충원 시에만 정시 선발
- 문학문화콘텐츠학과(주·야): 수시 미충원 시에만 정시 선발
- ICT디자인학부(주간): 수시 미충원 시에만 정시 선발
- ICT디자인학부(야간): 수시 미충원 시 면접전형(수능60%+면접40%), 1월 22일(목)
- 예술학부 무용(한국무용·현대무용·발레): 수시 미충원 시 가군 실기고사, 1월 7일(수)`);
  }

  // ── 학과 없이 전형만 + 경쟁률/합격가능성 → 전체 요약 ──
  if (detectedDepts.length === 0 && detectedAdmissions.length > 0 &&
      (detectedTopics.includes('경쟁률') || detectedTopics.includes('합격가능성'))) {
    detectedAdmissions.slice(0, 3).forEach(adm => {
      const summaryKey = adm + '_전체요약';
      if (KNOWLEDGE['전형별_전체요약'] && KNOWLEDGE['전형별_전체요약'][summaryKey]) {
        parts.push(`【${adm}전형 전체 학과 입시결과 요약 (2026학년도)】\n` + KNOWLEDGE['전형별_전체요약'][summaryKey]);
      }
    });
  }

  // ── 학과·전형 모두 없이 경쟁률 → 주요 요약 ──
  if (detectedDepts.length === 0 && detectedAdmissions.length === 0 &&
      detectedTopics.includes('경쟁률')) {
    const susi = KNOWLEDGE['전형별_전체요약'];
    if (susi) {
      parts.push('【수시 주요 전형 경쟁률 요약 (2026학년도)】\n' +
        '▶ 교과우수\n' + (susi['교과우수_전체요약'] || '') +
        '\n\n▶ 한성인재\n' + (susi['한성인재_전체요약'] || ''));
    }
  }

  // ── RAW 통계 + 개별 합격자 (학과가 특정된 경우) ──
  if (detectedDepts.length > 0) {
    const statsResults = [];

    for (const dept of detectedDepts.slice(0, 3)) {
      for (const [key, value] of Object.entries(RAW_STATS)) {
        if (!value.모집단위.includes(dept)) continue;
        if (dayNight) {
          const wantedChar = dayNight === '야간' ? '야' : '주';
          if (!value.모집단위.includes(`(${wantedChar})`)) continue;
        }
        if (detectedAdmissions.length > 0) {
          const admMatch = detectedAdmissions.some(adm =>
            value.전형 === adm || value.전형.includes(adm) || adm.includes(value.전형)
          );
          if (!admMatch) continue;
        }
        const dupIdx = statsResults.findIndex(r =>
          r.모집단위 === value.모집단위 && r.전형 === value.전형
        );
        if (dupIdx >= 0) {
          for (const [yr, yrData] of Object.entries(value.연도별)) {
            if (!statsResults[dupIdx].연도별[yr]) {
              statsResults[dupIdx].연도별[yr] = yrData;
            }
          }
        } else {
          statsResults.push(value);
        }
        if (statsResults.length >= 6) break;
      }
    }

    if (statsResults.length > 0) {
      parts.push('【합격자 통계 · 경쟁률 · 개별 사례 데이터】\n' + formatStats(statsResults, grade, suneungScore));
    } else if (detectedAdmissions.length > 0) {
      // 학과+전형은 잡혔는데 통계가 없는 경우 명시
      parts.push(`【통계 데이터 확인 결과】\n검색하신 "${detectedDepts.join(', ')}" 학과의 "${detectedAdmissions.join(', ')}" 전형에 대한 합격자 통계 데이터가 보유 데이터에 없습니다. 이 조합의 입시결과는 안내가 어려우므로 입학관리팀(02-760-5800)으로 문의하도록 안내하세요.`);
    }
  }

  // ── 아무것도 안 잡힌 경우 기본 정보 ──
  if (parts.length === 0) {
    parts.push('【한성대 입시 기본 정보】\n' +
      '※ 아래는 기본 정보입니다. 질문이 구체적이지 않아 정확한 데이터를 찾지 못했습니다. ' +
      '학과·전형·수시/정시를 구체적으로 다시 질문하도록 안내하세요.\n\n' +
      '- 수시 원서접수: 2025.09.08~09.12 / 정시 원서접수: 2025.12.29~12.31\n' +
      '- 수시 전형: 교과우수, 지역균형, 한성인재, 기회균형(고른기회·성인학습자), 실기우수자, 농어촌학생, 특성화고교졸업자, 특성화고졸재직자\n' +
      '- 정시 전형: 일반학생(가/나/다군), 농어촌·특성화 특별전형\n' +
      '- 수능최저: 교과우수 주간(2개합7이내), 교과우수 야간(2개합8이내), 그 외 전형 없음\n' +
      '- 면접: 수시 전 전형 면접 없음 (ICT디자인학부 야간 정시 미충원 시만 예외)\n' +
      '- 문의: 입학관리팀 02-760-5800 / enter.hansung.ac.kr');
  }

  return parts.join('\n\n---\n\n');
}

// ───────────────────────────────────────────────────────────────
// 5. 통계 포맷
// ───────────────────────────────────────────────────────────────
function formatStats(results, userGrade, userScore) {
  let text = '';

  for (const item of results) {
    text += `\n▶ ${item.모집단위} / ${item.전형}전형\n`;

    const years = Object.keys(item.연도별).sort();
    const hasScore = years.some(y => item.연도별[y]['학생부평균']);
    const hasSuneung = years.some(y => item.연도별[y]['수능평균']);
    const hasComp = years.some(y => item.연도별[y]['경쟁률']);

    if (hasScore) {
      text += `학년도 | 모집 | 지원 | 경쟁률 | 추가합격 | 학생부평균 | 70%컷\n`;
      for (const year of years) {
        const d = item.연도별[year];
        const comp = d['경쟁률'] ? `${d['경쟁률']}:1` : '-';
        text += `${year} | ${d.모집인원||'-'}명 | ${d['지원']||'-'}명 | ${comp} | ${d.추가합격||'-'}명 | ${d['학생부평균']||'-'} | ${d['학생부70%컷']||'-'}\n`;
      }
    } else if (hasSuneung) {
      text += `학년도 | 모집 | 지원 | 경쟁률 | 추가합격 | 수능평균 | 수능70%컷\n`;
      for (const year of years) {
        const d = item.연도별[year];
        const comp = d['경쟁률'] ? `${d['경쟁률']}:1` : '-';
        text += `${year} | ${d.모집인원||'-'}명 | ${d['지원']||'-'}명 | ${comp} | ${d.추가합격||'-'}명 | ${d['수능평균']||'-'} | ${d['수능70%컷']||'-'}\n`;
      }
    } else if (hasComp) {
      text += `학년도 | 경쟁률\n`;
      for (const year of years) {
        const d = item.연도별[year];
        if (d['경쟁률']) text += `${year} | ${d['경쟁률']}:1\n`;
      }
    }

    const recentYears = years.slice(-2);
    for (const year of recentYears) {
      const d = item.연도별[year];
      if (d.고교유형분포) {
        const total = Object.values(d.고교유형분포).reduce((a, b) => a + b, 0);
        text += `${year} 고교유형: `;
        text += Object.entries(d.고교유형분포)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `${k} ${v}명(${Math.round(v/total*100)}%)`)
          .join(', ') + '\n';
      }
    }

    if (userGrade || userScore) {
      for (const year of [...recentYears].reverse()) {
        const d = item.연도별[year];
        if (!d.합격자개별) continue;

        const analysis = analyzeIndividualApplicants(d.합격자개별, userGrade, userScore);
        if (!analysis) continue;

        if (analysis.유사성적사례.length > 0) {
          text += `\n[${year}년도 유사 성적 합격 사례 — ${analysis.유사성적범위}]\n`;
          for (const s of analysis.유사성적사례) {
            if (s.학생부등급) {
              text += `  • ${s.고교유형} / 내신 ${s.학생부등급}등급 / ${s.합격구분}`;
            } else if (s.수능총점) {
              text += `  • ${s.고교유형} / 수능 ${s.수능총점}점 / ${s.합격구분}`;
            }
            if (s.추가합격차수) text += ` (${s.추가합격차수})`;
            text += '\n';
          }
        } else {
          text += `\n[${year}년도] 입력하신 성적(${userGrade ? userGrade+'등급' : userScore+'점'}±범위) 내 합격 사례 없음\n`;
        }
      }
    }
  }

  return text;
}

// ───────────────────────────────────────────────────────────────
// 6. 시스템 프롬프트
// ───────────────────────────────────────────────────────────────
const BASE_SYSTEM = `당신은 한성대학교 공식 입시 상담 AI입니다.
수험생, 학부모, 교사 등 입시 관련 모든 질문에 친절하고 정확하게 답변합니다.

════════════════════════════════════════════
【가장 중요한 규칙 — 절대 위반 금지】
════════════════════════════════════════════

★ 당신은 아래 [검색된 관련 데이터]에 적힌 내용만 사용해 답변할 수 있습니다.
★ [검색된 관련 데이터]에 없는 숫자, 날짜, 비율, 인원, 전형명, 학과명, 자격조건은
  절대로 만들어내거나 추측하거나 일반 상식으로 보충하지 마세요.
★ 데이터에 없는 내용을 질문받으면, 아는 척하지 말고 반드시 이렇게 답하세요:
  "죄송하지만 해당 내용은 제가 가진 자료에서 확인되지 않습니다.
   정확한 정보는 입학관리팀(☎ 02-760-5800) 또는 입학 홈페이지(enter.hansung.ac.kr)로 문의해 주세요."
★ 데이터에 일부만 있으면, 있는 부분만 답하고 없는 부분은 "이 부분은 자료에 없습니다"라고 명확히 구분하세요.
★ 헷갈리거나 확신이 없으면 차라리 "자료에서 확인되지 않습니다"라고 답하세요.
  틀린 답을 그럴듯하게 말하는 것이 가장 나쁩니다.
★ [검색된 관련 데이터] 안에 "데이터가 없습니다"라는 안내가 있으면, 그 안내를 그대로 따르세요.

════════════════════════════════════════════
【답변 작성 규칙】
════════════════════════════════════════════

① 수치(70%컷, 경쟁률, 합격자평균 등)를 안내할 때는 항상 마지막에 포함:
   "⚠️ 이 수치보다 점수가 높다고 반드시 합격하는 것이 아니고, 낮다고 반드시 불합격하는 것도 아닙니다. 입시 결과 수치는 참고용이며, 최종 판단은 반드시 본인이 하셔야 합니다."

② 확정 표현 절대 금지: "합격 가능합니다" "불합격입니다" "안전권입니다" "위험합니다" "붙습니다" "떨어집니다"
   권장 표현: "~수준으로 보입니다" "~사례가 있었습니다" "~범위에 해당합니다" "도전해볼 여지가 있습니다"

③ 면접 안내: 한성대 수시 전형에는 면접이 없습니다. (정시 ICT디자인학부 야간만 미충원 시 예외)

④ 한성대 입시와 무관한 질문에는: "저는 한성대학교 입시 전문 상담 AI입니다. 한성대 입시와 관련된 질문을 해주세요."

⑤ 모든 답변 마지막 줄에 포함: "더 정확한 상담: 입학관리팀 ☎ 02-760-5800 / enter.hansung.ac.kr"

⑥ 2027학년도 등 미공개 연도를 물으면: "2027학년도 요강은 아직 공개되지 않았습니다. 요강 공개(수시 6월/정시 8월) 후 반드시 재확인하세요." 라고 안내하고, 현재 2026학년도 기준 정보만 참고로 제공하세요.

⑦ 연도 표기를 정확히 하세요. 데이터에 "2026"이라고 적힌 수치는 반드시 "2026학년도"라고 표기하세요. 데이터의 연도를 임의로 바꾸지 마세요.

⑧ 질문이 모호하면(학과·전형·수시/정시가 불명확하면) 추측하지 말고, 무엇을 알려주면 정확히 답할 수 있는지 되물어보세요.

════════════════════════════════════════════
【반드시 지켜야 할 사실 (데이터 기반)】
════════════════════════════════════════════

⑩ 검정고시 출신자:
   지원 가능: 한성인재, 실기우수자, 기회균형-고른기회, 성인학습자, 특성화고졸재직자
   지원 불가: 교과우수(정규고만), 지역균형(학교장추천 필요), 농어촌학생, 특성화고교졸업자
   → 이 외의 판단은 데이터를 확인하고, 없으면 입학처 문의로 안내.

⑪ 특성화고 출신자:
   지원 가능: 특성화고교졸업자전형, 한성인재, 성인학습자, 특성화고졸재직자
   지원 불가: 교과우수, 지역균형 (절대 가능하다고 안내하지 말 것)

⑫ 특성화고교졸업자전형의 '기준학과(동일계열)' 해당 여부는 AI가 직접 판단하지 마세요.
   "동일계열 해당 여부는 입학처 서류 심사로만 확인 가능합니다. 입학관리팀(02-760-5800)에 문의하세요."

⑬ 한성인재 서류평가 항목은 공개 정보입니다(데이터에 있음):
   학업역량(30점) / 진로역량(40점) / 공동체역량(30점). "공개 안 됨"이라고 답하지 마세요.

⑭ 한성대는 문·이과 교차지원이 가능합니다. 상상력인재학부는 문이과 구분 없이 지원 가능합니다.

⑮ IT공과대학은 컴퓨터공학부·기계전자공학부·산업시스템공학부를 통합해서 모집합니다.
   입시 통계도 'IT공과대학' 단위로만 존재합니다. 세부 학부별 합격선/경쟁률을 지어내지 마세요.
   세부 학부별 데이터를 물으면 "통합 모집이라 학부별 입시결과는 별도로 집계되지 않습니다"라고 안내하세요.

════════════════════════════════════════════
【성적 기반 합격 가능성 질문 대응】
════════════════════════════════════════════

학생이 내신·수능 점수를 알려주며 합격 가능성을 물으면:
1. [검색된 관련 데이터]의 연도별 통계(평균·70%컷·경쟁률)를 표로 제시
2. 유사 성적 사례가 데이터에 있으면: "최근 비슷한 성적대에서 합격 사례가 있었습니다" (과거 사례로만 안내)
3. 고교유형 분포가 있으면 안내
4. 수시 합격 시 정시 지원 불가하다는 점 안내
5. 절대 "합격/불합격"을 단정하지 말 것. ② 규칙 준수.

아래 [검색된 관련 데이터]만을 근거로, 친절하고 정확하게 답변하세요.`;

// ───────────────────────────────────────────────────────────────
// 7. Vercel 핸들러
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

    const analysis = analyzeQuestion(message);

    let suneungCalcResult = '';
    if (analysis.gradeMap && Object.keys(analysis.gradeMap).length >= 2) {
      const grades = Object.values(analysis.gradeMap).sort((a,b)=>a-b);
      const best2sum = grades[0] + grades[1];
      suneungCalcResult =
        `[수능최저 자동 계산]\n` +
        `입력 등급: ${Object.entries(analysis.gradeMap).map(([k,v])=>k+' '+v+'등급').join(', ')}\n` +
        `상위 2개 합: ${best2sum}등급\n` +
        `교과우수(주간) 기준 7이내: ${best2sum <= 7 ? '✅ 충족' : '❌ 미충족'}\n` +
        `교과우수(야간) 기준 8이내: ${best2sum <= 8 ? '✅ 충족' : '❌ 미충족'}`;
    }

    const retrievedContext = retrieveContext(analysis, message) +
      (suneungCalcResult ? '\n\n---\n\n' + suneungCalcResult : '');
    const systemPrompt = BASE_SYSTEM + '\n\n[검색된 관련 데이터]\n' + retrievedContext;

    const contents = [
      ...history.slice(-10),
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: translateError(errData?.error?.message || '') });
    }

    const data = await response.json();
    const botText = data?.candidates?.[0]?.content?.parts?.[0]?.text
      || '답변을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.';

    return res.status(200).json({
      reply: botText,
      debug: {
        depts: analysis.detectedDepts,
        admissions: analysis.detectedAdmissions,
        topics: analysis.detectedTopics,
        grade: analysis.grade,
        suneungScore: analysis.suneungScore,
        contextSize: retrievedContext.length
      }
    });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
  }
}

function translateError(msg) {
  if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('RATE_LIMIT')) {
    return 'AI 서비스 사용량이 일시적으로 초과되었습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (msg.includes('high demand') || msg.includes('overloaded')) {
    return 'AI 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해 주세요.';
  }
  if (msg.includes('API key') || msg.includes('API_KEY')) {
    return 'API 키 설정에 문제가 있습니다. 관리자에게 문의해 주세요.';
  }
  return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}
