// ═══════════════════════════════════════════════════════════════
// 한성대학교 입시 상담 AI — Vercel 서버 코드 v6
// v5 기반 + 10가지 수정사항 적용
// ═══════════════════════════════════════════════════════════════

const KNOWLEDGE = require('../data/admission_knowledge.json');
const RAW_STATS = require('../data/raw_stats.json');

// ── 전형명 표준화 ──
const ADMISSION_NORMALIZE = {
  '교과우수':'교과우수','교과우수전형':'교과우수','교과1':'교과우수','교과Ⅰ':'교과우수','내신전형':'교과우수','학생부교과':'교과우수',
  '지역균형':'지역균형','지역균형전형':'지역균형','학교장추천':'지역균형','추천전형':'지역균형','교과2':'지역균형','교과Ⅱ':'지역균형',
  '한성인재':'한성인재','한성인재전형':'한성인재','학생부종합':'한성인재','종합전형':'한성인재','서류전형':'한성인재','비교과':'한성인재',
  '실기우수자':'실기우수자','실기우수자전형':'실기우수자','실기전형':'실기우수자','실기':'실기우수자',
  '고른기회':'고른기회','기회균형':'고른기회','국가보훈':'고른기회','기초생활':'고른기회','차상위':'고른기회',
  '성인학습자':'성인학습자','평생학습자':'성인학습자',
  '재직자':'특성화고졸재직자','특성화고졸재직자':'특성화고졸재직자','특성화재직자':'특성화고졸재직자',
  '농어촌':'농어촌학생','농어촌학생':'농어촌학생','농어촌전형':'농어촌학생',
  '특성화고졸업자':'특성화고교졸업자','특성화고교졸업자':'특성화고교졸업자','동일계열':'특성화고교졸업자',
  '정시':'일반학생','일반학생':'일반학생','수능위주':'일반학생','수능전형':'일반학생','일반전형':'일반학생','수능':'일반학생'
};

const RAW_ADMISSION_NAMES = ['교과우수','지역균형','한성인재','실기우수자',
  '고른기회','성인학습자','특성화고졸재직자','농어촌학생','특성화고교졸업자','일반학생','특기자(뷰티)'];

function normalizeAdmission(name) {
  if (!name) return null;
  const n = name.trim();
  return ADMISSION_NORMALIZE[n] || ADMISSION_NORMALIZE[n.replace('전형','')] || n;
}

// ── 계열 → 학과 매핑 ──
const FIELD_MAP = {
  '이과':['IT공과대학','AI응용학과','융합보안학과','미래모빌리티학과'],
  '문과':['크리에이티브인문학부','미래융합사회과학대학','문학문화콘텐츠학과'],
  '예체능':['동양화','서양화','한국무용','현대무용','발레','ICT디자인학부'],
  '디자인':['ICT디자인학부','글로벌패션산업학부','뷰티디자인매니지먼트학과'],
  '자연계':['IT공과대학','AI응용학과','미래모빌리티학과'],
  '인문계':['크리에이티브인문학부','미래융합사회과학대학','문학문화콘텐츠학과'],
  '공학계':['IT공과대학','AI응용학과','융합보안학과','미래모빌리티학과'],
  '사회계':['미래융합사회과학대학','융합행정학과','비즈니스컨설팅학과','호텔외식경영학과']
};

const ADMISSION_KEY_MAP = {
  '교과우수':'교과우수','지역균형':'지역균형','한성인재':'한성인재',
  '실기우수자':'실기우수자','고른기회':'기회균형_고른기회',
  '성인학습자':'성인학습자','특성화고졸재직자':'특성화고졸재직자',
  '농어촌학생':'농어촌학생','특성화고교졸업자':'특성화고교졸업자'
};

// ── 1단계: Gemini 의도 분석 ──
async function analyzeIntent(message, API_KEY) {
  const intentPrompt = `한성대학교 입시 질문 분석기입니다. JSON만 반환하세요.

질문: "${message}"

반환 형식:
{
  "학과": [],
  "계열": null,
  "전형": [],
  "주야": null,
  "주제": [],
  "내신등급": null,
  "수능점수": null,
  "수능영역등급": {"국어":null,"수학":null,"영어":null,"탐구":null}
}

학과 (아래 목록에서만 선택, 임의 생성 금지):
IT공과대학, 크리에이티브인문학부, 미래융합사회과학대학, 글로벌패션산업학부, 상상력인재학부, AI응용학과, 융합보안학과, 미래모빌리티학과, 문학문화콘텐츠학과, ICT디자인학부, 뷰티디자인매니지먼트학과, 동양화, 서양화, 한국무용, 현대무용, 발레, 융합행정학과, 호텔외식경영학과, 비즈니스컨설팅학과, ICT융합디자인학과, AI소프트웨어학과
IT공과대학은 통합모집(세부학과 없음). "공대","컴공","이공계" → IT공과대학
"뷰티" → 뷰티디자인매니지먼트학과, "디자인" → ICT디자인학부, "패션" → 글로벌패션산업학부

전형 (아래 중 하나로만):
교과우수, 지역균형, 한성인재, 실기우수자, 고른기회, 성인학습자, 특성화고졸재직자, 농어촌학생, 특성화고교졸업자, 일반학생
"정시","수능위주","수능" → 일반학생
"학생부종합","비교과" → 한성인재
"실기" → 실기우수자

주제 (해당 모두 포함):
합격가능성, 경쟁률, 일정, 자격, 수능최저, 전형방법, 모집인원, 장학금, 추합, 전형비교, 전형추천, 변천이력, 수능반영, 실기, 검정고시, 기준학과, 면접, 정시이월, 이과문과계열안내

계열: 이과|문과|예체능|디자인|자연계|인문계|공학계|사회계|null
주야: 주간|야간|null`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          contents:[{role:'user',parts:[{text:intentPrompt}]}],
          generationConfig:{temperature:0.0,maxOutputTokens:512}
        })
      }
    );
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleaned = raw.replace(/```json|```/g,'').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.전형) {
      parsed.전형 = parsed.전형
        .map(a => normalizeAdmission(a))
        .filter(a => a && RAW_ADMISSION_NAMES.includes(a));
    }
    return parsed;
  } catch(e) {
    return {학과:[],계열:null,전형:[],주야:null,주제:[],내신등급:null,수능점수:null,수능영역등급:{}};
  }
}

// ── 2단계: RAG 데이터 검색 ──
function retrieveContext(intent) {
  const {학과, 계열, 전형, 주야, 주제, 내신등급, 수능점수, 수능영역등급} = intent;
  const parts = [];

  let targetDepts = [...(학과||[])];
  if (계열 && FIELD_MAP[계열]) {
    targetDepts = [...new Set([...targetDepts,...FIELD_MAP[계열]])];
  }

  // 이과/문과 계열 안내
  if (주제 && 주제.includes('이과문과계열안내')) {
    parts.push(`【계열별 추천 학과 안내】
⚠️ 한성대학교는 수시·정시 모두 문과/이과 교차지원이 가능합니다.

이과(자연계/공학계) 유리 학과:
  - IT공과대학(컴퓨터공학부·기계전자공학부·산업시스템공학부 통합모집) → 수능 수학35%, 교과우수 과학교과 반영
  - AI응용학과, 융합보안학과, 미래모빌리티학과 → 수능 수학35%

문과(인문계/사회계) 유리 학과:
  - 크리에이티브인문학부, 미래융합사회과학대학, 문학문화콘텐츠학과, 글로벌패션산업학부 → 수능 국어35%

자유선택(문이과 무관):
  - 상상력인재학부 → 우수영역 순 40-30-20-10% 자유반영

예체능/디자인:
  - ICT디자인학부, 예술학부(동양화·서양화·한국무용·현대무용·발레) → 실기 80%
  - 뷰티디자인매니지먼트학과, 글로벌패션산업학부 → 수능 국어35%

교차지원 유의사항:
  - 이과→문과: 교과우수에서 사회교과 성적 부족할 수 있음
  - 문과→이과: 교과우수에서 과학교과 성적 부족할 수 있음
  - 한성인재·지역균형은 계열 제한 없음`);
  }

  // 일정
  if (주제 && (주제.includes('일정') || 주제.includes('추합'))) {
    const isJeongsi = 전형 && 전형.includes('일반학생');
    parts.push(isJeongsi
      ? '【정시 일정】\n' + JSON.stringify(KNOWLEDGE.schedule_jeongsi, null, 2)
      : '【수시 일정】\n' + JSON.stringify(KNOWLEDGE.schedule_susi, null, 2));
  }

  // 면접
  if (주제 && 주제.includes('면접')) {
    parts.push(`【면접 안내】
수시 전 전형 면접 없음. 2026학년도 성인학습자·특성화고졸재직자 면접 완전 폐지.
예외: 정시 ICT디자인학부(야간) 수시 미충원 시에만 면접전형(수능60%+면접40%).`);
  }

  // 자격/수능최저
  if (주제 && (주제.includes('자격') || 주제.includes('수능최저'))) {
    if (전형 && 전형.length > 0) {
      전형.slice(0,2).forEach(adm => {
        const key = ADMISSION_KEY_MAP[adm];
        if (key && KNOWLEDGE.admission_eligibility && KNOWLEDGE.admission_eligibility[key]) {
          parts.push(`【${adm}전형 자격·방법】\n` + JSON.stringify(KNOWLEDGE.admission_eligibility[key], null, 2));
        }
      });
    } else {
      parts.push('【수능최저 요약】\n교과우수(주간): 2개 합 7 이내\n교과우수(야간): 2개 합 8 이내\n지역균형·한성인재·기회균형·실기우수자: 없음\n제2외국어/한문 탐구 대체 가능(교과우수만)');
    }
  }

  // 전형방법
  if (주제 && 주제.includes('전형방법') && 전형 && 전형.length > 0) {
    전형.slice(0,2).forEach(adm => {
      const key = ADMISSION_KEY_MAP[adm];
      if (key && KNOWLEDGE.admission_eligibility && KNOWLEDGE.admission_eligibility[key]) {
        parts.push(`【${adm}전형 방법 상세】\n` + JSON.stringify(KNOWLEDGE.admission_eligibility[key], null, 2));
      }
    });
  }

  // [수정2] 한성인재 평가항목 상세화
  if (전형 && 전형.includes('한성인재')) {
    parts.push(`【한성인재전형 서류평가 상세 안내】
전형방법: 학교생활기록부(교과+비교과) 서류평가 100% / 수능최저 없음

평가영역 및 배점 (총 100점):

▶ 학업역량 (30점)
  - 학업성취도 (15점): 고교 교육과정에서 교과 성취수준이나 성취도가 어느 정도인지
    · 이수 과목 수, 과목 성취도, 원점수, 석차등급 등 종합 평가
  - 지적탐구력 (15점): 지적 관심과 호기심을 가지고 깊이 있는 학습을 수행하는 경험이 있는지
    · 탐구활동, 자기주도학습, 독서 경험 등

▶ 진로역량 (40점) ← 가장 높은 비중
  - 계열 관련 교과 성취도 (20점): 지원 계열(모집단위)과 관련된 교과 이수 및 성취 수준
    · 지원 학부/학과와 관련 있는 교과 집중이수 여부
  - 계열적합성 (20점): 지원 계열(모집단위)과 관련된 다양한 활동과 경험 보유 여부
    · 동아리, 진로활동, 세특, 수상 내역 등 지원 계열 연관성

▶ 공동체역량 (30점)
  - 리더십·협업과 소통능력 (20점): 공동체 목표 달성을 위해 구성원들과 협력하고 소통하는 능력
    · 임원 경험, 팀 프로젝트, 멘토링, 봉사 활동 등
  - 나눔과 배려·성실성과 규칙준수 (10점): 타인을 위해 기꺼이 나누고 배려하며 규칙을 지키는 태도
    · 출결, 봉사시간, 공동체 기여 활동 등

평가 자료: 학교생활기록부 전체 (교과성적 + 출결 + 창체 + 세특 + 행동특성 등)
※ 자기소개서 제출 없음 (2024학년도부터 폐지)`);
  }

  // [수정3] 정시 수능 반영비율
  if (주제 && 주제.includes('수능반영')) {
    if (KNOWLEDGE.suneung_ratio) {
      parts.push(`【정시 수능 영역별 반영비율】
${JSON.stringify(KNOWLEDGE.suneung_ratio, null, 2)}

【영어 등급별 환산점수】
1등급:100점 / 2등급:97점 / 3등급:94점 / 4등급:80점 / 5등급:70점
6등급:55점 / 7등급:40점 / 8등급:25점 / 9등급:10점

【한국사 가산점】
1~4등급:10점 / 5등급:8점 / 6등급:6점 / 7등급:4점 / 8등급:2점 / 9등급:0점

※ 수능 백분위 점수를 반영비율로 환산하여 합산
※ 탐구영역은 1과목만 반영 (직업탐구 제외)`);
    }
  }

  // 장학금
  if (주제 && 주제.includes('장학금')) {
    parts.push('【장학금 안내】\n' + JSON.stringify(KNOWLEDGE.scholarships, null, 2));
  }

  // 변천이력
  if (주제 && 주제.includes('변천이력')) {
    parts.push('【전형 변천 이력】\n' + JSON.stringify(KNOWLEDGE.admission_history, null, 2));
  }

  // 실기
  if (주제 && 주제.includes('실기')) {
    parts.push('【실기고사 안내】\n' + JSON.stringify(KNOWLEDGE.practical_exam, null, 2));
  }

  // 전형료
  if (주제 && 주제.includes('전형료')) {
    parts.push('【전형료】\n' + JSON.stringify(KNOWLEDGE.application_fee, null, 2));
  }

  // 전형 비교
  if (주제 && 주제.includes('전형비교') && 전형 && 전형.length >= 1) {
    let compareText = '【전형 비교】\n';
    전형.slice(0,3).forEach(adm => {
      const key = ADMISSION_KEY_MAP[adm];
      const info = KNOWLEDGE.admission_eligibility && KNOWLEDGE.admission_eligibility[key];
      if (info) {
        compareText += `\n[${adm}전형]\n`;
        ['자격','검정고시','수능최저','수능최저_주간','수능최저_야간','전형방법','전형료'].forEach(f => {
          if (info[f]) compareText += `  ${f}: ${info[f]}\n`;
        });
      }
    });
    parts.push(compareText);
  }

  // 전형 추천
  if (주제 && 주제.includes('전형추천')) {
    if (KNOWLEDGE.admission_eligibility) {
      parts.push('【전형별 자격 요약】\n' + JSON.stringify(KNOWLEDGE.admission_eligibility, null, 2));
    }
    if (KNOWLEDGE.grade_conversion) {
      parts.push('【내신 환산 및 반영교과】\n' + JSON.stringify(KNOWLEDGE.grade_conversion, null, 2));
    }
    if (KNOWLEDGE['전형별_전체요약']) {
      const 전형목록 = 전형 && 전형.length > 0 ? 전형 : ['교과우수','지역균형','한성인재'];
      전형목록.slice(0,2).forEach(adm => {
        const key = adm + '_전체요약';
        if (KNOWLEDGE['전형별_전체요약'][key]) {
          parts.push(`【${adm}전형 최근 입시결과 요약】\n` + KNOWLEDGE['전형별_전체요약'][key]);
        }
      });
    }
  }

  // 검정고시
  if (주제 && 주제.includes('검정고시')) {
    if (KNOWLEDGE['검정고시_전형별_가능여부']) {
      parts.push('【검정고시 출신자 지원 가능 전형】\n' + JSON.stringify(KNOWLEDGE['검정고시_전형별_가능여부'], null, 2));
    }
  }

  // 기준학과
  if (주제 && 주제.includes('기준학과')) {
    const info = KNOWLEDGE.admission_eligibility && KNOWLEDGE.admission_eligibility['특성화고교졸업자'];
    if (info) parts.push('【특성화고교졸업자 전형 기준학과 안내】\n' + JSON.stringify(info, null, 2));
  }

  // 정시이월
  if (주제 && 주제.includes('정시이월')) {
    parts.push(`【정시 수시 미충원 시에만 선발 (♣조건부)】
뷰티디자인매니지먼트학과(주·야), 문학문화콘텐츠학과(주·야),
ICT디자인학부(야간) ← 면접전형 1월22일,
예술학부 무용 ← 가군 실기고사 1월7일`);
  }

  // ── 핵심: RAW 통계 검색 ──
  if (targetDepts.length > 0) {
    const statsResults = [];
    const validDepts = targetDepts.filter(dept =>
      Object.values(RAW_STATS).some(v => v.모집단위.includes(dept))
    );

    for (const dept of validDepts.slice(0,3)) {
      for (const [key, value] of Object.entries(RAW_STATS)) {
        if (!value.모집단위.includes(dept)) continue;
        if (주야) {
          const wantedChar = 주야 === '야간' ? '야' : '주';
          if (!value.모집단위.includes('(' + wantedChar + ')')) continue;
        }
        // 전형 필터: 정확 매칭
        if (전형 && 전형.length > 0) {
          if (!전형.includes(value.전형)) continue;
        }
        // 중복 병합
        const dupIdx = statsResults.findIndex(r =>
          r.모집단위 === value.모집단위 && r.전형 === value.전형
        );
        if (dupIdx >= 0) {
          Object.entries(value.연도별).forEach(([yr, yrData]) => {
            if (!statsResults[dupIdx].연도별[yr]) statsResults[dupIdx].연도별[yr] = yrData;
          });
        } else {
          statsResults.push(value);
        }
        if (statsResults.length >= 8) break;
      }
    }

    if (statsResults.length > 0) {
      parts.push('【합격자 통계 · 경쟁률 · 개별 사례 데이터】\n' +
        formatStats(statsResults, 내신등급, 수능점수));
    }
  }

  // 수능최저 자동 계산
  if (수능영역등급 && Object.values(수능영역등급).filter(v => v).length >= 2) {
    const grades = Object.values(수능영역등급).filter(v => v).sort((a,b) => a-b);
    const best2sum = grades[0] + grades[1];
    parts.push(`【수능최저 자동 계산】
입력: ${Object.entries(수능영역등급).filter(([,v])=>v).map(([k,v])=>k+' '+v+'등급').join(', ')}
상위 2개 합: ${best2sum}등급
교과우수(주간) 7이내: ${best2sum<=7?'✅ 충족':'❌ 미충족'}
교과우수(야간) 8이내: ${best2sum<=8?'✅ 충족':'❌ 미충족'}`);
  }

  // 학과 없이 전형만 → 전체 요약
  if (targetDepts.length === 0 && 전형 && 전형.length > 0 &&
      주제 && (주제.includes('경쟁률') || 주제.includes('합격가능성'))) {
    전형.slice(0,2).forEach(adm => {
      const summaryKey = adm + '_전체요약';
      if (KNOWLEDGE['전형별_전체요약'] && KNOWLEDGE['전형별_전체요약'][summaryKey]) {
        parts.push(`【${adm}전형 전체 학과 요약】\n` + KNOWLEDGE['전형별_전체요약'][summaryKey]);
      }
    });
  }

  // 학과·전형 모두 없이 경쟁률
  if (targetDepts.length === 0 && (!전형 || 전형.length === 0) &&
      주제 && 주제.includes('경쟁률')) {
    const susi = KNOWLEDGE['전형별_전체요약'];
    if (susi) {
      parts.push('【수시 주요 전형 경쟁률 요약 (2026학년도)】\n' +
        '▶ 교과우수\n' + (susi['교과우수_전체요약']||'') +
        '\n\n▶ 한성인재\n' + (susi['한성인재_전체요약']||''));
    }
  }

  if (parts.length === 0) {
    parts.push(`【한성대 입시 기본 정보】
수시원서: 2025.09.08~09.12 / 정시원서: 2025.12.29~12.31
수능최저: 교과우수주간(2개합7이내), 교과우수야간(2개합8이내), 나머지없음
면접: 수시 전 전형 면접 없음
문의: 입학관리팀 02-760-5800 / enter.hansung.ac.kr`);
  }

  return parts.join('\n\n---\n\n');
}

// ── [수정1] 통계 표 형식 (마크다운 테이블) ──
function formatStats(results, userGrade, userScore) {
  let text = '';
  for (const item of results) {
    text += `\n▶ ${item.모집단위} / ${item.전형}전형\n`;
    const years = Object.keys(item.연도별).sort();
    const hasScore = years.some(y => item.연도별[y]['학생부평균']);
    const hasSuneung = years.some(y => item.연도별[y]['수능평균'] || item.연도별[y]['수능70%컷']);
    const hasComp = years.some(y => item.연도별[y]['경쟁률']);

    if (hasScore) {
      text += `| 학년도 | 모집 | 지원 | 경쟁률 | 추가합격 | 평균 | 70%컷 |\n`;
      text += `|--------|------|------|--------|----------|------|-------|\n`;
      years.forEach(year => {
        const d = item.연도별[year];
        const comp = d['경쟁률'] ? d['경쟁률']+':1' : '-';
        text += `| ${year} | ${d.모집인원||'-'}명 | ${d['지원']||'-'}명 | ${comp} | ${d.추가합격||'-'}명 | ${d['학생부평균']||'-'} | ${d['학생부70%컷']||'-'} |\n`;
      });
    } else if (hasSuneung) {
      text += `| 학년도 | 모집 | 지원 | 경쟁률 | 추가합격 | 수능평균 | 수능70%컷 |\n`;
      text += `|--------|------|------|--------|----------|----------|----------|\n`;
      years.forEach(year => {
        const d = item.연도별[year];
        const comp = d['경쟁률'] ? d['경쟁률']+':1' : '-';
        text += `| ${year} | ${d.모집인원||'-'}명 | ${d['지원']||'-'}명 | ${comp} | ${d.추가합격||'-'}명 | ${d['수능평균']||'-'} | ${d['수능70%컷']||'-'} |\n`;
      });
    } else if (hasComp) {
      text += `| 학년도 | 모집 | 지원 | 경쟁률 |\n`;
      text += `|--------|------|------|--------|\n`;
      years.forEach(year => {
        const d = item.연도별[year];
        if (d['경쟁률']) text += `| ${year} | ${d.모집인원||'-'}명 | ${d['지원']||'-'}명 | ${d['경쟁률']}:1 |\n`;
      });
    }

    // 고교유형 분포
    years.slice(-2).forEach(year => {
      const d = item.연도별[year];
      if (d.고교유형분포) {
        const total = Object.values(d.고교유형분포).reduce((a,b)=>a+b,0);
        text += `\n${year}학년도 고교유형: ` +
          Object.entries(d.고교유형분포).sort((a,b)=>b[1]-a[1])
            .map(([k,v])=>`${k} ${v}명(${Math.round(v/total*100)}%)`).join(', ') + '\n';
      }
    });

    // 유사 성적 사례
    if (userGrade || userScore) {
      [...years.slice(-2)].reverse().forEach(year => {
        const d = item.연도별[year];
        if (!d.합격자개별) return;
        const similar = userGrade
          ? d.합격자개별.filter(a => a.학생부등급 && Math.abs(a.학생부등급-userGrade) <= 0.3)
          : d.합격자개별.filter(a => a.수능총점 && Math.abs(a.수능총점-userScore) <= 15);
        if (similar.length > 0) {
          const range = userGrade
            ? `${(userGrade-0.3).toFixed(1)}~${(userGrade+0.3).toFixed(1)}등급`
            : `${userScore-15}~${userScore+15}점`;
          text += `\n[${year}학년도 유사 성적 합격 사례 — ${range}]\n`;
          similar.slice(0,5).forEach(s => {
            text += `  • ${s.고교유형} / `;
            text += s.학생부등급 ? `내신 ${s.학생부등급}등급` : `수능 ${s.수능총점}점`;
            text += ` / ${s.합격구분}`;
            if (s.추가합격차수) text += ` (${s.추가합격차수})`;
            text += '\n';
          });
        } else {
          text += `\n[${year}학년도] 해당 성적 범위 합격 사례 없음\n`;
        }
      });
    }
  }
  return text;
}

// ── 시스템 프롬프트 ──
const BASE_SYSTEM = `당신은 한성대학교 공식 입시 상담 AI입니다.

【절대 원칙】
① [검색된 관련 데이터]만 근거로 답변. 없는 내용 추측·창작 금지.
   데이터 없으면: "입학관리팀(02-760-5800)으로 문의해 주세요."

② 수치 제공 시 반드시 포함:
   "⚠️ 이 수치는 참고용입니다. 높다고 합격, 낮다고 불합격이 보장되지 않으며, 최종 판단은 반드시 본인이 하셔야 합니다."

③ 확정 표현 금지: "합격 가능합니다" "안전권" "위험"
   권장: "~수준입니다" "~사례가 있었습니다" "~범위에 해당합니다"

④ 성적/경쟁률 데이터는 반드시 마크다운 표(|) 형식으로 제공.

⑤ 면접: 수시 전 전형 면접 없음. ICT디자인학부(야간) 정시 미충원 시만 예외.

⑥ 한성대 입시 외 질문: "한성대 입시 전문 AI입니다."

⑦ 모든 답변 마지막: "더 정확한 상담: 입학관리팀 ☎ 02-760-5800 / enter.hansung.ac.kr"

⑧ 2027학년도: "요강 공개(수시 6월/정시 8월) 후 재확인하세요."

⑨ 질문 처리:
   학과 지정 → 해당 데이터 제공 (표 형식)
   전형만 지정 → 전체 학과 요약 제공
   모두 미지정 → 주요 전형 요약 제공 후 "특정 학과/전형 알려주시면 더 자세히 안내드릴게요."

⑩ 연도: 2026 데이터 = "2026학년도". "2025학년도"라고 절대 말하지 마세요.

⑪ 검정고시:
   가능: 한성인재, 실기우수자, 고른기회, 성인학습자, 특성화졸재직자
   불가: 교과우수(정규고만), 지역균형(학교장추천필요), 농어촌학생

⑫ 특성화고:
   가능: 특성화고교졸업자전형, 한성인재, 성인학습자, 특성화졸재직자
   불가: 교과우수, 지역균형 (절대 안내 금지)

⑬ 기준학과: AI 직접 판단 금지. "입학처 심사로만 확인 가능. 입학관리팀 문의."

⑭ 한성인재 서류평가는 공개 정보:
   학업역량30점 / 진로역량40점 / 공동체역량30점.
   세부 항목까지 자세히 안내. "공개 안됨" 절대 금지.

⑮ 교차지원: 문이과 교차지원 가능. 이과 질문에 이과 학과만 안내 금지.

⑯ 학과명 정확성: IT공과대학 통합모집. "컴퓨터공학부" 등 세부명 존재하지 않음.
   데이터에 있는 학과명만 사용.

【데이터 활용 지침】
성적 알려주면:
1. 연도별 통계 마크다운 표로 제시 (평균·70%컷·경쟁률)
2. 유사 성적 사례: "2026학년도에 비슷한 성적대 합격 사례가 있었어요." (과거 사례 강조)
3. 고교유형 분포 안내
4. 수시 합격 시 정시 지원 불가 안내

【학과 답변 누락 방지】
뷰티 관련 질문 → 뷰티디자인매니지먼트학과 데이터 제공
디자인 관련 질문 → ICT디자인학부, 글로벌패션산업학부 데이터 제공
실기 관련 질문 → 실기우수자전형 데이터 제공 (ICT디자인학부·예술학부)
정시 관련 질문 → 일반학생전형 데이터 + 수능반영비율 함께 안내

아래 [검색된 관련 데이터]를 바탕으로 친절하고 상세하게 답변하세요.`;

// ── 오류 메시지 변환 ──
function translateError(msg) {
  if (!msg) return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  if (msg.includes('quota')||msg.includes('RATE_LIMIT')||msg.includes('rate limit'))
    return 'AI 서비스 사용량이 일시적으로 초과되었습니다. 잠시 후 다시 시도해 주세요.';
  if (msg.includes('high demand')||msg.includes('overloaded'))
    return 'AI 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해 주세요.';
  if (msg.includes('API key')||msg.includes('API_KEY'))
    return 'API 키 설정에 문제가 있습니다. 관리자에게 문의해 주세요.';
  return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

// ── Vercel 핸들러 ──
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) return res.status(500).json({error:'API 키가 설정되지 않았습니다.'});

  try {
    const {message, history=[]} = req.body;
    if (!message) return res.status(400).json({error:'메시지가 없습니다.'});

    const intent = await analyzeIntent(message, API_KEY);
    const retrievedContext = retrieveContext(intent);
    const systemPrompt = BASE_SYSTEM + '\n\n[검색된 관련 데이터]\n' + retrievedContext;
    const contents = [...history.slice(-10), {role:'user',parts:[{text:message}]}];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          system_instruction:{parts:[{text:systemPrompt}]},
          contents,
          generationConfig:{temperature:0.1,maxOutputTokens:4096}
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(()=>({}));
      return res.status(response.status).json({error:translateError(errData?.error?.message)});
    }

    const data = await response.json();
    const botText = data?.candidates?.[0]?.content?.parts?.[0]?.text
      || '답변을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.';

    return res.status(200).json({
      reply:botText,
      debug:{intent, contextSize:retrievedContext.length}
    });

  } catch(err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({error:'일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'});
  }
}
