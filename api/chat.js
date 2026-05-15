// ═══════════════════════════════════════════════════════════════
// 한성대학교 입시 상담 AI — Vercel 서버 코드 v3
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
  '뷰티디자인매니지먼트학과': ['뷰티디자인매니지먼트학과','뷰티디자인매니지먼트','뷰티디자인','뷰티'],
  'ICT디자인학부': ['ICT디자인학부','ICT디자인','ict디자인','아이씨티디자인'],
  'IT공과대학': ['IT공과대학','IT공과','IT공대','it공과','컴퓨터공학','기계전자','산업시스템','공과대학','공대','it계열'],
  '상상력인재학부': ['상상력인재학부','상상력인재','상상력','자율전공'],
  '문학문화콘텐츠학과': ['문학문화콘텐츠학과','문학문화콘텐츠','문학문화','콘텐츠','문콘'],
  'AI응용학과': ['AI응용학과','AI응용','ai응용','에이아이응용'],
  '융합보안학과': ['융합보안학과','융합보안','보안'],
  '미래모빌리티학과': ['미래모빌리티학과','미래모빌리티','모빌리티','자동차'],
  '동양화': ['동양화','동양화전공'],
  '서양화': ['서양화','서양화전공'],
  '한국무용': ['한국무용','한무'],
  '현대무용': ['현대무용','현무'],
  '발레': ['발레'],
  '융합행정학과': ['융합행정학과','융합행정','행정'],
  '호텔외식경영학과': ['호텔외식경영학과','호텔외식경영','호텔','외식'],
  '비즈니스컨설팅학과': ['비즈니스컨설팅학과','비즈니스컨설팅','비즈니스'],
  'ICT융합디자인학과': ['ICT융합디자인학과','ICT융합디자인','ict융합'],
  'AI소프트웨어학과': ['AI소프트웨어학과','AI소프트웨어','ai소프트웨어','AI·소프트웨어','에이아이소프트웨어']
};

const ADMISSION_KEYWORDS = {
  '교과우수': ['교과우수','교과우수전형','교과Ⅰ','교과1','교과전형'],
  '지역균형': ['지역균형','지역균형전형','교과Ⅱ','교과2','학교장추천','추천전형','학교장 추천'],
  '한성인재': ['한성인재','한성인재전형','학생부종합','종합전형','서류전형','비교과'],
  '실기우수자': ['실기우수자','실기우수자전형','실기전형','실기'],
  '고른기회': ['고른기회','고른기회전형','기회균형','국가보훈','기초생활','차상위'],
  '성인학습자': ['성인학습자','평생학습자','성인학습자전형','재직자전형','만30세','30세이상'],
  '특성화고졸재직자': ['재직자','특성화고졸재직자','재직자전형','특성화 재직'],
  '농어촌학생': ['농어촌','농어촌학생','농어촌전형','읍면'],
  '특성화고교졸업자': ['특성화고졸업자','특성화고교졸업자','특성화고교졸','동일계열','기준학과'],
  '일반학생': ['정시','일반학생','수능위주','수능전형']
};

const TOPIC_KEYWORDS = {
  '일정': ['일정','기간','언제','날짜','원서','접수','발표','등록','마감','충원일정'],
  '추합': ['추합','충원합격','예비번호','예비순위','충원','추가합격','몇번','몇차'],
  '자격': ['자격','지원자격','지원가능','지원불가','검정고시','지원 조건','조건','해당되'],
  '수능최저': ['수능최저','최저','수능최저기준','최저등급','최저 조건'],
  '장학금': ['장학금','장학','학비','등록금감면','장학 혜택','학비 지원'],
  '전형방법': ['전형방법','평가방법','반영방법','어떻게평가','어떻게 뽑','선발방법'],
  '모집인원': ['모집인원','몇명','인원','정원','몇 명','선발인원'],
  '반영교과': ['반영교과','반영과목','내신과목','어떤 과목','과목 반영'],
  '실기': ['실기고사','실기종목','준비물','실기내용','실기 준비'],
  '변천이력': ['바뀌었','변경','달라졌','예전','이전','언제부터','신설','폐지','없어졌','작년과','올해 바뀐','개편'],
  '경쟁률': ['경쟁률','경쟁','몇대일','지원자수','지원인원'],
  '전형추천': ['추천해','유리한','어떤전형','뭐가좋','어디가좋','어떤 전형','뭐가 유리','어디 지원','어디로 지원','어느 전형'],
  '전형비교': ['비교해','vs','versus','차이','다른점','어떻게달라','교과우수vs','지역균형vs','한성인재vs','둘다','두전형'],
  '수능최저계산': ['수능최저되나','최저충족','등급합','합이','최저기준충족','최저될까','최저넘나','최저통과'],
  '검정고시': ['검정고시','검정고시출신','고졸검정','학력인정'],
  '기준학과': ['기준학과','동일계열','계열확인서','동일계열확인','같은계열','관련학과'],
  '특성화고지원': ['특성화고생','특성화고출신','특성화고학생','특성화고재학','특성화고다니'],
  '수능반영': ['수능반영','영역별반영','반영비율','백분위','수능 반영','영역 반영','어떤 영역'],
  '전형료': ['전형료','접수비','수수료','원서 비용'],
  '합격가능성': ['합격','가능성','될까','될것','될지','경쟁력','어떨까','어때','괜찮','합격선','컷','70%컷','붙을','떨어질','합격할','통과','가능한지'],
  '정시이월': ['정시에서도','미충원','이월','조건부','♣','수시 미충원'],
  '면접': ['면접','면접고사','면접 있','면접 없'],
  '고교유형': ['고교유형','일반고','자사고','특목고','검정고시 출신','어떤 고등학교','고등학교 유형']
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

// 정시 이월 조건부 학과 목록
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

  // 내신 등급 추출 (2.8등급, 내신 3, 3점대 등 다양한 표현)
  const gradeMatch =
    text.match(/(\d+\.?\d*)\s*등급/) ||
    text.match(/내신\s*(\d+\.?\d*)/) ||
    text.match(/학생부\s*(\d+\.?\d*)/) ||
    text.match(/(\d+\.?\d*)\s*점대/);
  const grade = gradeMatch ? parseFloat(gradeMatch[1]) : null;

  // 수능 점수 추출 (820점, 800점대 등)
  const suneungMatch =
    text.match(/수능\s*(\d{3,4})\s*점/) ||
    text.match(/(\d{3,4})\s*점대/) ||
    text.match(/환산\s*(\d{3,4})/);
  const suneungScore = suneungMatch ? parseInt(suneungMatch[1]) : null;

  // 수능 영역별 등급 추출 (국어 2등급, 수학 3 등)
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

  // 일정
  if (detectedTopics.includes('일정') || detectedTopics.includes('추합')) {
    const isJeongsi = detectedAdmissions.includes('일반학생');
    parts.push(isJeongsi
      ? '【정시 일정】\n' + JSON.stringify(KNOWLEDGE.schedule_jeongsi, null, 2)
      : '【수시 일정】\n' + JSON.stringify(KNOWLEDGE.schedule_susi, null, 2)
    );
  }

  // 면접 질문 → 명확하게 안내
  if (detectedTopics.includes('면접')) {
    parts.push(`【면접 관련 안내】
한성대학교 수시 전형(교과우수·지역균형·한성인재·고른기회·실기우수자·성인학습자·특성화고졸재직자·농어촌·특성화졸업자)에는 면접이 없습니다.
2026학년도에 성인학습자·특성화고졸재직자 전형의 면접도 완전 폐지되어 전 학과 서류평가 100%로 통일되었습니다.
정시에서 ICT디자인학부(야간)만 수시 미충원 시에 한해 면접전형(수능60%+면접40%)으로 선발합니다.`);
  }

  // 지원 자격 / 수능최저
  if (detectedTopics.includes('자격') || detectedTopics.includes('수능최저')) {
    if (detectedAdmissions.length > 0) {
      for (const adm of detectedAdmissions.slice(0, 2)) {
        const key = ADMISSION_KEY_MAP[adm];
        if (key && KNOWLEDGE.admission_eligibility[key]) {
          parts.push(`【${adm}전형 자격·방법】\n` + JSON.stringify(KNOWLEDGE.admission_eligibility[key], null, 2));
        }
      }
    } else {
      parts.push('【수능최저 요약】\n교과우수(주간): 2개 합 7 이내\n교과우수(야간): 2개 합 8 이내\n지역균형·한성인재·기회균형·실기우수자: 없음');
    }
  }

  // 전형방법
  if (detectedTopics.includes('전형방법') && detectedAdmissions.length > 0) {
    for (const adm of detectedAdmissions.slice(0, 2)) {
      const key = ADMISSION_KEY_MAP[adm];
      if (key && KNOWLEDGE.admission_eligibility[key]) {
        parts.push(`【${adm}전형 방법 상세】\n` + JSON.stringify(KNOWLEDGE.admission_eligibility[key], null, 2));
      }
    }
  }

  // 장학금
  if (detectedTopics.includes('장학금')) {
    parts.push('【장학금 안내】\n' + JSON.stringify(KNOWLEDGE.scholarships, null, 2));
  }

  // 모집인원
  if (detectedTopics.includes('모집인원')) {
    if (detectedAdmissions.length > 0) {
      for (const adm of detectedAdmissions.slice(0, 2)) {
        const quotaKey = adm + '_학과별';
        if (KNOWLEDGE.admission_quota && KNOWLEDGE.admission_quota[quotaKey]) {
          parts.push(`【${adm} 학과별 모집인원】\n` + JSON.stringify(KNOWLEDGE.admission_quota[quotaKey], null, 2));
        }
      }
    }
    if (KNOWLEDGE.admission_quota) {
      parts.push('【수시 전체 모집인원】\n' + JSON.stringify(KNOWLEDGE.admission_quota.수시전체, null, 2));
    }
  }

  // 변천이력
  if (detectedTopics.includes('변천이력')) {
    parts.push('【전형 변천 이력】\n' + JSON.stringify(KNOWLEDGE.admission_history, null, 2));
  }

  // 수능 반영비율
  if (detectedTopics.includes('수능반영') || (detectedAdmissions.includes('일반학생') && detectedDepts.length > 0)) {
    parts.push('【정시 수능 반영비율 및 영어·한국사 환산】\n' + JSON.stringify(KNOWLEDGE.suneung_ratio, null, 2));
  }

  // 실기
  if (detectedTopics.includes('실기')) {
    parts.push('【실기고사 안내】\n' + JSON.stringify(KNOWLEDGE.practical_exam, null, 2));
  }

  // 전형료
  if (detectedTopics.includes('전형료')) {
    parts.push('【전형료】\n' + JSON.stringify(KNOWLEDGE.application_fee, null, 2));
  }

  // 전형 추천
  if (detectedTopics.includes('전형추천')) {
    if (KNOWLEDGE.admission_eligibility) {
      parts.push('【전형별 자격 요약】\n' + JSON.stringify(KNOWLEDGE.admission_eligibility, null, 2));
    }
    if (KNOWLEDGE.grade_conversion) {
      parts.push('【내신 환산 및 반영교과】\n' + JSON.stringify(KNOWLEDGE.grade_conversion, null, 2));
    }
  }

  // 전형 비교
  if (detectedTopics.includes('전형비교') && detectedAdmissions.length >= 1) {
    const compareAdms = detectedAdmissions.slice(0, 3);
    let compareText = '【전형 비교표】\n';
    const fields = ['자격','검정고시','수능최저','수능최저_주간','수능최저_야간','전형방법','전형료'];
    compareAdms.forEach(adm => {
      const key = ADMISSION_KEY_MAP[adm] || adm;
      const info = KNOWLEDGE.admission_eligibility && KNOWLEDGE.admission_eligibility[key];
      if (info) {
        compareText += `\n[${adm}전형]\n`;
        fields.forEach(f => {
          if (info[f]) compareText += `  ${f}: ${info[f]}\n`;
        });
      }
    });
    // RAW 통계에서 최근 70%컷도 추가
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
              if (cut) compareText += `  ${adm} ${yr}: 70%컷=${cut}, 경쟁률=${comp||'-'}:1\n`;
            });
            break;
          }
        }
      }
    });
    parts.push(compareText);
  }

  // 수능최저 충족 계산
  if (detectedTopics.includes('수능최저계산')) {
    // 등급 추출 (국어 2등급, 수학 3등급 등)
    parts.push('【수능최저 충족 계산 안내】\n' +
      '교과우수(주간): 국·수·영·탐(사/과 1과목) 중 2개 등급 합 7 이내\n' +
      '교과우수(야간): 국·수·영·탐 중 2개 등급 합 8 이내\n' +
      '제2외국어/한문을 탐구 대체 가능\n' +
      '지역균형·한성인재·기회균형·실기우수자: 수능최저 없음\n\n' +
      '[계산 방법]\n' +
      '예) 국어 2등급 + 수학 3등급 = 합 5 → 주간 7이내 ✅ 충족\n' +
      '예) 국어 3등급 + 영어 4등급 = 합 7 → 주간 7이내 ✅ 충족\n' +
      '예) 국어 4등급 + 수학 4등급 = 합 8 → 주간 초과 ❌ / 야간 8이내 ✅'
    );
  }

  // 검정고시 관련
  if (detectedTopics.includes('검정고시')) {
    if (KNOWLEDGE['검정고시_전형별_가능여부']) {
      parts.push('【검정고시 출신자 지원 가능 전형】\n' +
        JSON.stringify(KNOWLEDGE['검정고시_전형별_가능여부'], null, 2));
    }
  }

  // 기준학과(동일계열) 질문
  if (detectedTopics.includes('기준학과')) {
    const info = KNOWLEDGE.admission_eligibility && KNOWLEDGE.admission_eligibility['특성화고교졸업자'];
    if (info) {
      parts.push('【특성화고교졸업자 전형 기준학과 안내】\n' +
        JSON.stringify(info, null, 2));
    }
  }

  // 특성화고 학생 지원 가능 전형 질문
  if (detectedTopics.includes('특성화고지원')) {
    parts.push('【특성화고 출신 지원 가능 전형 안내】\n' +
      '특성화고 출신자가 지원 가능한 전형:\n' +
      '  ① 특성화고교졸업자전형(정원외) - 동일계열확인서 필수\n' +
      '  ② 한성인재전형(정원내) - 서류평가 100%\n' +
      '  ③ 성인학습자전형 - 특성화고 졸업 후 3년 이상 재직자\n' +
      '  ④ 특성화고졸재직자전형(정원외) - 3년 이상 재직자\n\n' +
      '특성화고 출신자가 지원 불가한 전형:\n' +
      '  ✗ 교과우수전형 - 일반고·자율고·특목고만 지원 가능\n' +
      '  ✗ 지역균형전형 - 특성화고 지원 불가\n' +
      '  ✗ 농어촌학생전형(교과) - 특성화고 지원 가능하나 농어촌 거주 조건 필요'
    );
  }

  // 한성인재 전형방법/평가항목 질문 시 평가영역 명시적으로 포함
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

  // 정시 이월 (♣ 조건부 학과)
  if (detectedTopics.includes('정시이월')) {
    parts.push(`【정시 수시 미충원 시에만 선발하는 학과 (♣ 조건부)】
- 뷰티디자인매니지먼트학과(주·야): 수시 미충원 시에만 정시 선발
- 문학문화콘텐츠학과(주·야): 수시 미충원 시에만 정시 선발
- ICT디자인학부(야간): 수시 미충원 시 면접전형(수능60%+면접40%), 1월 22일(목)
- 예술학부 무용(한국무용·현대무용·발레): 수시 미충원 시 가군 실기고사, 1월 7일(수)
수시 충원이 완료되면 이 학과들은 정시에서 선발하지 않습니다.`);
  }

  // RAW 통계 + 개별 합격자 + 경쟁률
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
            value.전형 === adm || value.전형.includes(adm) || adm.includes(value.전형)
          );
          if (!admMatch) continue;
        }
        // 중복 모집단위 병합 (동양화 인물/정물 등 세분화된 키 통합)
        const dupIdx = statsResults.findIndex(r =>
          r.모집단위 === value.모집단위 && r.전형 === value.전형
        );
        if (dupIdx >= 0) {
          // 연도별 데이터 병합
          for (const [yr, yrData] of Object.entries(value.연도별)) {
            if (!statsResults[dupIdx].연도별[yr]) {
              statsResults[dupIdx].연도별[yr] = yrData;
            }
          }
        } else {
          statsResults.push(value);
        }
        if (statsResults.length >= 4) break;
      }
    }

    if (statsResults.length > 0) {
      parts.push('【합격자 통계 · 경쟁률 · 개별 사례 데이터】\n' + formatStats(statsResults, grade, suneungScore));
    }
  }

  // 아무것도 감지 안 된 경우
  if (parts.length === 0) {
    parts.push('【한성대 입시 기본 정보】\n' +
      '수시원서: 2025.09.08~09.12 / 정시원서: 2025.12.29~12.31\n' +
      '수능최저: 교과우수주간(2개합7이내), 교과우수야간(2개합8이내), 나머지없음\n' +
      '면접: 수시 전 전형 면접 없음 (ICT디자인학부 야간 정시 미충원 시만 예외)\n' +
      '문의: 입학관리팀 02-760-5800 / enter.hansung.ac.kr');
  }

  return parts.join('\n\n---\n\n');
}

// ───────────────────────────────────────────────────────────────
// 5. 통계 + 경쟁률 + 개별 합격자 포맷
// ───────────────────────────────────────────────────────────────
function formatStats(results, userGrade, userScore) {
  let text = '';

  for (const item of results) {
    text += `\n▶ ${item.모집단위} / ${item.전형}전형\n`;

    const years = Object.keys(item.연도별).sort();
    const hasScore = years.some(y => item.연도별[y]['학생부평균']);
    const hasSuneung = years.some(y => item.연도별[y]['수능평균']);
    const hasComp = years.some(y => item.연도별[y]['경쟁률']);

    // 집계 통계 테이블
    if (hasScore) {
      text += `학년도 | 모집 | 지원 | 경쟁률 | 추가합격 | 학생부평균 | 70%컷\n`;
      for (const year of years) {
        const d = item.연도별[year];
        const comp = d['경쟁률'] ? `${d['경쟁률']}:1` : '-';
        const 지원 = d['지원'] || '-';
        text += `${year} | ${d.모집인원 || '-'}명 | ${지원}명 | ${comp} | ${d.추가합격 || '-'}명 | ${d['학생부평균'] || '-'} | ${d['학생부70%컷'] || '-'}\n`;
      }
    } else if (hasSuneung) {
      text += `학년도 | 모집 | 지원 | 경쟁률 | 추가합격 | 수능평균 | 수능70%컷\n`;
      for (const year of years) {
        const d = item.연도별[year];
        const comp = d['경쟁률'] ? `${d['경쟁률']}:1` : '-';
        const 지원 = d['지원'] || '-';
        text += `${year} | ${d.모집인원 || '-'}명 | ${지원}명 | ${comp} | ${d.추가합격 || '-'}명 | ${d['수능평균'] || '-'} | ${d['수능70%컷'] || '-'}\n`;
      }
    } else if (hasComp) {
      // 경쟁률만 있는 경우 (무용 등)
      text += `학년도 | 경쟁률\n`;
      for (const year of years) {
        const d = item.연도별[year];
        if (d['경쟁률']) text += `${year} | ${d['경쟁률']}:1\n`;
      }
    }

    // 최근 2개년 고교유형 분포
    const recentYears = years.slice(-2);
    for (const year of recentYears) {
      const d = item.연도별[year];
      if (d.고교유형분포) {
        const total = Object.values(d.고교유형분포).reduce((a, b) => a + b, 0);
        text += `${year} 고교유형: `;
        text += Object.entries(d.고교유형분포)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `${k} ${v}명(${Math.round(v / total * 100)}%)`)
          .join(', ') + '\n';
      }
    }

    // 개별 합격자 유사 사례 (최근 2개년)
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
          text += `\n[${year}년도] 입력하신 성적(${userGrade ? userGrade + '등급' : userScore + '점'}±범위) 내 합격 사례 없음\n`;
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
【절대 원칙】
════════════════════════════════════════════

① 오직 [검색된 관련 데이터]만 근거로 답변합니다. 데이터에 없는 내용은 절대 추측하거나 지어내지 않습니다.
   데이터에 없는 학과·전형: "해당 데이터가 없어 정확한 안내가 어렵습니다. 입학관리팀(02-760-5800)으로 문의해 주세요."

⑨ 연도 표기 필수 규칙 (매우 중요):
   데이터의 연도 숫자 = 학년도입니다. 반드시 "학년도"를 붙여서 말하세요.
   - 2026 데이터 → "2026학년도" (가장 최근 데이터)
   - 2025 데이터 → "2025학년도"
   - 2024 데이터 → "2024학년도"
   - 절대로 "작년 자료" "최근 자료"처럼 모호하게 표현하지 말고 반드시 "○○학년도" 형태로 명시하세요.
   - "2025년도 자료" "25학년도"처럼 틀린 연도를 말하면 절대 안 됩니다.
   - 가장 최근 데이터는 2026학년도입니다. 2026학년도를 "2025학년도"라고 절대 말하지 마세요.

② 수치 제공 시 항상 포함:
   "⚠️ 이 수치보다 점수가 높다고 반드시 합격하는 것이 아니고, 낮다고 반드시 불합격하는 것도 아닙니다. 입시 결과 수치는 참고용이며, 최종 판단은 반드시 본인이 하셔야 합니다."

③ 확정 표현 금지: "합격 가능합니다" "불합격입니다" "안전권입니다" "위험합니다"
   권장 표현: "~수준으로 보입니다" "~사례가 있었습니다" "~범위에 해당합니다"

④ 면접 안내 (매우 중요):
   한성대 수시 전형에는 면접이 없습니다.

⑩ 검정고시 출신자 지원 가능 전형 (자주 틀리는 항목):
   가능: 한성인재전형, 실기우수자전형, 기회균형-고른기회전형, 성인학습자전형, 특성화고졸재직자전형
   불가: 교과우수전형(국내 정규고 졸업자만), 지역균형전형(학교장 추천 필요), 농어촌학생전형
   검정고시 출신자에게 교과우수·지역균형을 절대 안내하지 마세요.

⑪ 특성화고 출신자 지원 (자주 틀리는 항목):
   특성화고 출신자는 교과우수전형에 지원할 수 없습니다. 절대 교과우수를 안내하지 마세요.
   특성화고 출신자 지원 가능 전형: 특성화고교졸업자전형(정원외), 한성인재전형, 성인학습자, 특성화졸재직자
   특성화고 출신자 지원 불가: 교과우수전형, 지역균형전형

⑫ 특성화고교졸업자전형 기준학과(동일계열) 질문 대응:
   기준학과 해당 여부는 입학처 서류 심사로만 판단됩니다.
   AI가 직접 "해당됩니다/해당되지 않습니다"라고 판단하지 마세요.
   반드시 이렇게 안내하세요:
   "동일계열(기준학과) 해당 여부는 입학처 심사를 통해서만 확인 가능합니다. 사전에 정확한 확인이 필요하시면 입학관리팀(02-760-5800)으로 직접 문의해 주세요."

⑬ 한성인재전형 서류평가 항목은 공개된 정보입니다. 반드시 안내하세요:
   학업역량(30점): 학업성취도 15점, 지적탐구력 15점
   진로역량(40점): 계열관련교과성취도 20점, 계열적합성 20점
   공동체역량(30점): 리더십·협업과소통 20점, 나눔·배려·성실성 10점
   "공개되지 않는다"는 말은 절대 하지 마세요. 위 항목이 공식 공개된 평가 기준입니다. 교과우수·지역균형·한성인재·고른기회·실기우수자·성인학습자·특성화고졸재직자·농어촌·특성화졸업자 모두 면접 없음.
   2026학년도에 성인학습자·특성화고졸재직자 전형 면접도 완전 폐지되었습니다.
   정시에서 ICT디자인학부(야간)만 수시 미충원 시에만 면접전형으로 선발합니다.

⑤ 한성대 입시 외 질문: "저는 한성대학교 입시 전문 상담 AI입니다."

⑥ 모든 답변 마지막: "더 정확한 상담: 입학관리팀 ☎ 02-760-5800 / enter.hansung.ac.kr"

⑦ 2027학년도 미공개 → "요강 공개(수시 6월/정시 8월) 후 반드시 재확인하세요." 포함

⑧ 질문이 모호하면 학과·전형·수시/정시 여부를 먼저 질문

════════════════════════════════════════════
【개별 합격자 데이터 활용 지침】
════════════════════════════════════════════

수험생이 성적을 알려주며 합격 가능성이나 전형 추천을 물을 때:

1. 연도별 통계(평균, 70%컷, 경쟁률)를 표로 먼저 제시

2. 유사 성적 사례가 있으면 구체적으로 안내:
   예: "2025년도에 비슷한 성적대(2.8~3.4등급)에서 합격한 사례가 있었어요.
       일반고 2.9등급 최초합격, 3.1등급 2차 추가합격 사례가 있었습니다.
       단, 과거 사례이며 동일한 결과를 보장하지 않습니다."

3. 사례 없을 경우: "입력하신 성적 범위 내 합격 사례가 데이터에 없습니다."

4. 고교유형 분포 안내: "2025년 합격자 중 일반고 출신이 85%였습니다."

5. 경쟁률 추이도 함께 안내: "최근 경쟁률은 X:1로 ~추세입니다."

6. 수시 합격 시 정시 지원 불가 반드시 안내

════════════════════════════════════════════
【상담 상황별 대응 지침】
════════════════════════════════════════════

[합격 가능성 질문]
→ 통계표 + 경쟁률 + 유사 사례 + 수능최저(교과우수) + ⚠️ 경고 + 문의처

[전형 추천]
→ 목표학과/내신/학교장추천/비교과/특수자격 확인 후 2~3개 전형 비교

[경쟁률 질문]
→ 최근 5개년 경쟁률 추이 + 추합 규모 제시. 경쟁률 높다고 불합격 아님 안내

[추합 질문]
→ 추합 규모 + 수시(1차 12/18→4차 12/21→개별통보 12/22~23) + 정시(1차 2/6→최종 2/12)

[면접 질문]
→ 수시 전 전형 면접 없음 명확히 안내. ICT디자인학부 야간 정시 미충원 시만 예외.

[정시 이월/조건부 질문]
→ ♣ 학과 목록 안내. 수시 충원 완료 시 정시 선발 없음 안내.

[수시 vs 정시]
→ 내신 강→교과우수·지역균형, 비교과 강→한성인재, 수능 강→정시. 수시 합격 시 정시 불가.

[불안해하는 경우]
→ 공감("입시 준비가 쉽지 않으셨겠어요.") → 데이터 기반 차분한 안내

[오류/데이터 없음]
→ "해당 정보가 데이터에 없습니다. 입학관리팀 ☎ 02-760-5800으로 문의해 주세요."

아래 [검색된 관련 데이터]를 바탕으로 친절하게 답변하세요.`;

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

    // 수능최저 직접 계산 (등급 있을 때)
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
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || '알 수 없는 오류가 발생했습니다.';
      // 한국어 오류 메시지 변환
      const koreanErr = translateError(errMsg);
      return res.status(response.status).json({ error: koreanErr });
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
    return res.status(500).json({
      error: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    });
  }
}

// 영어 오류 메시지 → 한국어 변환
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
  if (msg.includes('no longer available') || msg.includes('deprecated')) {
    return 'AI 모델 설정에 문제가 있습니다. 관리자에게 문의해 주세요.';
  }
  return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}
