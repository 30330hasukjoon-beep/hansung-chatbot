// ═══════════════════════════════════════════════════════════════
// 한성대학교 입시 상담 AI — Vercel 서버 코드 v4
// 2단계 RAG: Gemini 의도 분석 → 정확한 데이터 검색 → 답변
// ═══════════════════════════════════════════════════════════════

const KNOWLEDGE = require('../data/admission_knowledge.json');
const RAW_STATS = require('../data/raw_stats.json');

// ───────────────────────────────────────────────────────────────
// 1. 학과 매핑 테이블 (자연어 → 표준 학과명)
// ───────────────────────────────────────────────────────────────
const DEPT_MAP = {
  // IT / 공과
  'IT공과대학': ['it공과','it공대','공과대학','공대','컴퓨터공학','컴공','기계전자','산업시스템','it계열','이공계','공학계열'],
  '크리에이티브인문학부': ['크리에이티브인문','인문학부','인문계열','문과계열','인문','문과'],
  '미래융합사회과학대학': ['미래융합사회과학','사회과학','사회과학부','미래융합','사회계열','사회대'],
  '글로벌패션산업학부': ['글로벌패션','패션산업','패션학부','패션'],
  '뷰티디자인매니지먼트학과': ['뷰티디자인매니지먼트','뷰티디자인','뷰티'],
  'ICT디자인학부': ['ict디자인','아이씨티디자인','디자인학부'],
  '상상력인재학부': ['상상력인재','상상력','자율전공','자유전공'],
  '문학문화콘텐츠학과': ['문학문화콘텐츠','문학문화','문콘','콘텐츠학과'],
  'AI응용학과': ['ai응용','에이아이응용','인공지능응용'],
  '융합보안학과': ['융합보안','보안학과','사이버보안'],
  '미래모빌리티학과': ['미래모빌리티','모빌리티','자동차'],
  '동양화': ['동양화'],
  '서양화': ['서양화'],
  '한국무용': ['한국무용','한무'],
  '현대무용': ['현대무용','현무'],
  '발레': ['발레'],
  '융합행정학과': ['융합행정','행정학과'],
  '호텔외식경영학과': ['호텔외식경영','호텔경영','외식경영','호텔'],
  '비즈니스컨설팅학과': ['비즈니스컨설팅','경영컨설팅'],
  'ICT융합디자인학과': ['ict융합디자인','융합디자인'],
  'AI소프트웨어학과': ['ai소프트웨어','에이아이소프트웨어','인공지능소프트웨어']
};

// 계열 → 학과 매핑
const FIELD_MAP = {
  '이과': ['IT공과대학','AI응용학과','융합보안학과','미래모빌리티학과'],
  '문과': ['크리에이티브인문학부','미래융합사회과학대학','문학문화콘텐츠학과'],
  '예체능': ['동양화','서양화','한국무용','현대무용','발레','ICT디자인학부'],
  '디자인': ['ICT디자인학부','글로벌패션산업학부','뷰티디자인매니지먼트학과'],
  '자연계': ['IT공과대학','AI응용학과','미래모빌리티학과'],
  '인문계': ['크리에이티브인문학부','미래융합사회과학대학','문학문화콘텐츠학과'],
  '공학계': ['IT공과대학','AI응용학과','융합보안학과','미래모빌리티학과'],
  '사회계': ['미래융합사회과학대학','융합행정학과','비즈니스컨설팅학과','호텔외식경영학과']
};

// 전형 매핑
const ADMISSION_MAP = {
  '교과우수': ['교과우수','교과우수전형','교과1','교과Ⅰ','내신전형','학생부교과'],
  '지역균형': ['지역균형','지역균형전형','학교장추천','추천전형','교과2','교과Ⅱ'],
  '한성인재': ['한성인재','한성인재전형','학생부종합','종합전형','서류전형','비교과'],
  '실기우수자': ['실기우수자','실기우수자전형','실기전형','실기'],
  '고른기회': ['고른기회','기회균형','국가보훈','기초생활','차상위'],
  '성인학습자': ['성인학습자','평생학습자','만30세','30세이상'],
  '특성화고졸재직자': ['재직자','특성화고졸재직자','재직자전형'],
  '농어촌학생': ['농어촌','농어촌학생','읍면지역'],
  '특성화고교졸업자': ['특성화고졸업자','특성화고교졸업자','동일계열'],
  '일반학생': ['정시','일반학생','수능위주','수능전형']
};

const ADMISSION_KEY_MAP = {
  '교과우수': '교과우수', '지역균형': '지역균형', '한성인재': '한성인재',
  '실기우수자': '실기우수자', '고른기회': '기회균형_고른기회',
  '성인학습자': '성인학습자', '특성화고졸재직자': '특성화고졸재직자',
  '농어촌학생': '농어촌학생', '특성화고교졸업자': '특성화고교졸업자'
};

// ───────────────────────────────────────────────────────────────
// 2. 1단계: Gemini로 질문 의도 분석 (JSON 추출)
// ───────────────────────────────────────────────────────────────
async function analyzeIntent(message, API_KEY) {
  const intentPrompt = `당신은 한성대학교 입시 질문 분석기입니다.
아래 질문을 분석해서 반드시 JSON만 반환하세요. 설명이나 마크다운 없이 순수 JSON만.

분석할 질문: "${message}"

반환 형식:
{
  "학과": ["학과명1", "학과명2"],
  "계열": "이과|문과|예체능|디자인|자연계|인문계|공학계|사회계|null",
  "전형": ["전형명1", "전형명2"],
  "주야": "주간|야간|null",
  "주제": ["합격가능성|경쟁률|일정|자격|수능최저|전형방법|모집인원|장학금|추합|전형비교|전형추천|변천이력|수능반영|실기|검정고시|기준학과|면접|정시이월|이과문과계열안내"],
  "내신등급": null또는숫자,
  "수능점수": null또는숫자,
  "수능영역등급": {"국어":null또는숫자,"수학":null또는숫자,"영어":null또는숫자,"탐구":null또는숫자}
}

학과 예시: IT공과대학, 크리에이티브인문학부, 미래융합사회과학대학, 글로벌패션산업학부, 상상력인재학부, AI응용학과, 융합보안학과, 미래모빌리티학과, 문학문화콘텐츠학과, ICT디자인학부, 뷰티디자인매니지먼트학과, 동양화, 서양화, 한국무용, 현대무용, 발레
전형 예시: 교과우수, 지역균형, 한성인재, 실기우수자, 고른기회, 성인학습자, 특성화고졸재직자, 농어촌학생, 특성화고교졸업자, 일반학생

"이과쪽", "공대", "문과 계열" 같은 표현은 계열로 파악하세요.
모르면 null, 배열이 비면 []`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: intentPrompt }] }],
          generationConfig: { temperature: 0.0, maxOutputTokens: 512 }
        })
      }
    );
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return { 학과: [], 계열: null, 전형: [], 주야: null, 주제: [], 내신등급: null, 수능점수: null, 수능영역등급: {} };
  }
}

// ───────────────────────────────────────────────────────────────
// 3. 2단계: 의도 기반 RAG 데이터 검색
// ───────────────────────────────────────────────────────────────
function retrieveContext(intent) {
  const { 학과, 계열, 전형, 주야, 주제, 내신등급, 수능점수, 수능영역등급 } = intent;
  const parts = [];

  // 계열 → 학과 확장
  let targetDepts = [...(학과 || [])];
  if (계열 && FIELD_MAP[계열]) {
    targetDepts = [...new Set([...targetDepts, ...FIELD_MAP[계열]])];
  }

  // 이과/문과 계열 안내 주제
  if (주제 && 주제.includes('이과문과계열안내')) {
    parts.push(`【계열별 추천 학과 안내】
이과(자연계/공학계) 관련 학과:
  - IT공과대학(컴퓨터공학부·기계전자공학부·산업시스템공학부) - 수능 수학 35% 반영
  - AI응용학과 - 수능 수학 35% 반영
  - 융합보안학과 - 수능 수학 35% 반영
  - 미래모빌리티학과 - 수능 수학 35% 반영

문과(인문계/사회계) 관련 학과:
  - 크리에이티브인문학부 - 수능 국어 35% 반영
  - 미래융합사회과학대학 - 수능 국어 35% 반영
  - 문학문화콘텐츠학과 - 수능 국어 35% 반영
  - 글로벌패션산업학부 - 수능 국어 35% 반영

자유 선택(문이과 무관):
  - 상상력인재학부 - 자율전공, 문이과 구분 없이 지원 가능. 우수영역 순 40-30-20-10% 반영

예체능/디자인:
  - ICT디자인학부 - 실기 80% 또는 수능 위주
  - 예술학부(동양화·서양화·한국무용·현대무용·발레) - 실기 80%
  - 글로벌패션산업학부·뷰티디자인매니지먼트학과 - 수능 국어 35% 반영

교과우수전형 반영교과 계열 구분:
  - 이과계열(IT공과대학·AI응용학과·융합보안학과·미래모빌리티학과): 국어·영어·수학·과학 반영
  - 문과계열(크리에이티브인문학부·미래융합사회과학대학·글로벌패션산업학부·문학문화콘텐츠학과): 국어·영어·수학·사회 반영`);
  }

  // 일정
  if (주제 && (주제.includes('일정') || 주제.includes('추합'))) {
    const isJeongsi = 전형 && 전형.includes('일반학생');
    parts.push(isJeongsi
      ? '【정시 일정】\n' + JSON.stringify(KNOWLEDGE.schedule_jeongsi, null, 2)
      : '【수시 일정】\n' + JSON.stringify(KNOWLEDGE.schedule_susi, null, 2)
    );
  }

  // 면접
  if (주제 && 주제.includes('면접')) {
    parts.push(`【면접 안내】
한성대 수시 전 전형(교과우수·지역균형·한성인재·고른기회·실기우수자·성인학습자·특성화고졸재직자·농어촌·특성화졸업자) 면접 없음.
2026학년도에 성인학습자·특성화고졸재직자 면접 완전 폐지 → 전 학과 서류평가 100%.
정시 ICT디자인학부(야간)만 수시 미충원 시에 한해 면접전형(수능60%+면접40%) 실시.`);
  }

  // 지원 자격 / 수능최저
  if (주제 && (주제.includes('자격') || 주제.includes('수능최저'))) {
    if (전형 && 전형.length > 0) {
      전형.slice(0, 2).forEach(adm => {
        const key = ADMISSION_KEY_MAP[adm];
        if (key && KNOWLEDGE.admission_eligibility[key]) {
          parts.push(`【${adm}전형 자격·방법】\n` + JSON.stringify(KNOWLEDGE.admission_eligibility[key], null, 2));
        }
      });
    } else {
      parts.push('【수능최저 요약】\n교과우수(주간): 2개 합 7 이내\n교과우수(야간): 2개 합 8 이내\n지역균형·한성인재·기회균형·실기우수자: 없음\n제2외국어/한문 탐구 대체 가능(교과우수만)');
    }
  }

  // 전형방법
  if (주제 && 주제.includes('전형방법') && 전형 && 전형.length > 0) {
    전형.slice(0, 2).forEach(adm => {
      const key = ADMISSION_KEY_MAP[adm];
      if (key && KNOWLEDGE.admission_eligibility[key]) {
        parts.push(`【${adm}전형 방법 상세】\n` + JSON.stringify(KNOWLEDGE.admission_eligibility[key], null, 2));
      }
    });
  }

  // 한성인재 평가항목
  if (전형 && 전형.includes('한성인재') &&
      주제 && (주제.includes('전형방법') || 주제.includes('합격가능성'))) {
    parts.push(`【한성인재전형 서류평가 항목 상세】
전형방법: 학생부 서류평가 100% (교과+비교과 정성종합평가)
평가영역 및 배점:
  학업역량 (30점)
    - 학업성취도: 15점
    - 지적탐구력: 15점
  진로역량 (40점)
    - 계열 관련 교과 성취도: 20점
    - 계열적합성: 20점
  공동체역량 (30점)
    - 리더십·협업과 소통능력: 20점
    - 나눔과 배려·성실성과 규칙준수: 10점
수능최저: 없음`);
  }

  // 장학금
  if (주제 && 주제.includes('장학금')) {
    parts.push('【장학금 안내】\n' + JSON.stringify(KNOWLEDGE.scholarships, null, 2));
  }

  // 변천이력
  if (주제 && 주제.includes('변천이력')) {
    parts.push('【전형 변천 이력】\n' + JSON.stringify(KNOWLEDGE.admission_history, null, 2));
  }

  // 수능 반영비율
  if (주제 && 주제.includes('수능반영')) {
    parts.push('【정시 수능 반영비율 및 영어·한국사 환산】\n' + JSON.stringify(KNOWLEDGE.suneung_ratio, null, 2));
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
    전형.slice(0, 3).forEach(adm => {
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
    parts.push('【전형별 자격 요약】\n' + JSON.stringify(KNOWLEDGE.admission_eligibility, null, 2));
    if (KNOWLEDGE.grade_conversion) {
      parts.push('【내신 환산 및 반영교과】\n' + JSON.stringify(KNOWLEDGE.grade_conversion, null, 2));
    }
  }

  // 검정고시
  if (주제 && 주제.includes('검정고시')) {
    parts.push('【검정고시 출신자 지원 가능 전형】\n' + JSON.stringify(KNOWLEDGE['검정고시_전형별_가능여부'], null, 2));
  }

  // 기준학과
  if (주제 && 주제.includes('기준학과')) {
    const info = KNOWLEDGE.admission_eligibility && KNOWLEDGE.admission_eligibility['특성화고교졸업자'];
    if (info) parts.push('【특성화고교졸업자 전형 기준학과 안내】\n' + JSON.stringify(info, null, 2));
  }

  // 정시이월
  if (주제 && 주제.includes('정시이월')) {
    parts.push(`【정시 수시 미충원 시에만 선발하는 학과 (♣ 조건부)】
- 뷰티디자인매니지먼트학과(주·야)
- 문학문화콘텐츠학과(주·야)
- ICT디자인학부(야간) ← 면접전형(수능60%+면접40%), 1월 22일(목)
- 예술학부 무용(한국무용·현대무용·발레) ← 가군 실기고사, 1월 7일(수)`);
  }

  // RAW 통계 + 개별 합격자
  if (targetDepts.length > 0) {
    const statsResults = [];
    for (const dept of targetDepts.slice(0, 2)) {
      for (const [key, value] of Object.entries(RAW_STATS)) {
        if (!value.모집단위.includes(dept)) continue;
        if (주야) {
          const wantedChar = 주야 === '야간' ? '야' : '주';
          if (!value.모집단위.includes(`(${wantedChar})`)) continue;
        }
        if (전형 && 전형.length > 0) {
          const admMatch = 전형.some(adm =>
            value.전형 === adm || value.전형.includes(adm) || adm.includes(value.전형)
          );
          if (!admMatch) continue;
        }
        // 중복 병합 (동양화 인물/정물 등)
        const dupIdx = statsResults.findIndex(r =>
          r.모집단위 === value.모집단위 && r.전형 === value.전형
        );
        if (dupIdx >= 0) {
          Object.entries(value.연도별).forEach(([yr, yrData]) => {
            if (!statsResults[dupIdx].연도별[yr]) {
              statsResults[dupIdx].연도별[yr] = yrData;
            }
          });
        } else {
          statsResults.push(value);
        }
        if (statsResults.length >= 4) break;
      }
    }
    if (statsResults.length > 0) {
      parts.push('【합격자 통계 · 경쟁률 · 개별 사례 데이터】\n' +
        formatStats(statsResults, 내신등급, 수능점수));
    }
  }

  // 수능최저 자동 계산
  if (수능영역등급 && Object.keys(수능영역등급).filter(k => 수능영역등급[k]).length >= 2) {
    const grades = Object.values(수능영역등급).filter(v => v).sort((a, b) => a - b);
    const best2sum = grades[0] + grades[1];
    parts.push(`【수능최저 자동 계산 결과】
입력 등급: ${Object.entries(수능영역등급).filter(([,v])=>v).map(([k,v])=>k+' '+v+'등급').join(', ')}
상위 2개 합: ${best2sum}등급
교과우수(주간) 기준 7이내: ${best2sum <= 7 ? '✅ 충족' : '❌ 미충족'}
교과우수(야간) 기준 8이내: ${best2sum <= 8 ? '✅ 충족' : '❌ 미충족'}`);
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

// ───────────────────────────────────────────────────────────────
// 4. 통계 + 개별 합격자 포맷
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
      years.forEach(year => {
        const d = item.연도별[year];
        const comp = d['경쟁률'] ? `${d['경쟁률']}:1` : '-';
        text += `${year} | ${d.모집인원||'-'}명 | ${d['지원']||'-'}명 | ${comp} | ${d.추가합격||'-'}명 | ${d['학생부평균']||'-'} | ${d['학생부70%컷']||'-'}\n`;
      });
    } else if (hasSuneung) {
      text += `학년도 | 모집 | 지원 | 경쟁률 | 추가합격 | 수능평균 | 수능70%컷\n`;
      years.forEach(year => {
        const d = item.연도별[year];
        const comp = d['경쟁률'] ? `${d['경쟁률']}:1` : '-';
        text += `${year} | ${d.모집인원||'-'}명 | ${d['지원']||'-'}명 | ${comp} | ${d.추가합격||'-'}명 | ${d['수능평균']||'-'} | ${d['수능70%컷']||'-'}\n`;
      });
    } else if (hasComp) {
      text += `학년도 | 경쟁률\n`;
      years.forEach(year => {
        const d = item.연도별[year];
        if (d['경쟁률']) text += `${year} | ${d['경쟁률']}:1\n`;
      });
    }

    // 최근 2개년 고교유형 분포
    years.slice(-2).forEach(year => {
      const d = item.연도별[year];
      if (d.고교유형분포) {
        const total = Object.values(d.고교유형분포).reduce((a, b) => a + b, 0);
        text += `${year} 고교유형: `;
        text += Object.entries(d.고교유형분포)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `${k} ${v}명(${Math.round(v/total*100)}%)`)
          .join(', ') + '\n';
      }
    });

    // 유사 성적 사례
    if (userGrade || userScore) {
      [...years.slice(-2)].reverse().forEach(year => {
        const d = item.연도별[year];
        if (!d.합격자개별) return;
        const similar = userGrade
          ? d.합격자개별.filter(a => a.학생부등급 && Math.abs(a.학생부등급 - userGrade) <= 0.3)
          : d.합격자개별.filter(a => a.수능총점 && Math.abs(a.수능총점 - userScore) <= 15);
        if (similar.length > 0) {
          const range = userGrade
            ? `${(userGrade-0.3).toFixed(1)}~${(userGrade+0.3).toFixed(1)}등급`
            : `${userScore-15}~${userScore+15}점`;
          text += `\n[${year}학년도 유사 성적 합격 사례 — ${range}]\n`;
          similar.slice(0, 5).forEach(s => {
            text += `  • ${s.고교유형} / `;
            text += s.학생부등급 ? `내신 ${s.학생부등급}등급` : `수능 ${s.수능총점}점`;
            text += ` / ${s.합격구분}`;
            if (s.추가합격차수) text += ` (${s.추가합격차수})`;
            text += '\n';
          });
        } else {
          text += `\n[${year}학년도] 입력하신 성적 범위 내 합격 사례 없음\n`;
        }
      });
    }
  }
  return text;
}

// ───────────────────────────────────────────────────────────────
// 5. 시스템 프롬프트
// ───────────────────────────────────────────────────────────────
const BASE_SYSTEM = `당신은 한성대학교 공식 입시 상담 AI입니다.
수험생, 학부모, 교사 등 입시 관련 모든 질문에 친절하고 정확하게 답변합니다.

════════════════════════════════════════════
【절대 원칙】
════════════════════════════════════════════

① [검색된 관련 데이터]만 근거로 답변합니다. 없는 내용은 절대 추측하지 않습니다.
   데이터에 없는 학과·전형: "입학관리팀(02-760-5800)으로 문의해 주세요."

② 수치 제공 시 반드시 포함:
   "⚠️ 이 수치보다 점수가 높다고 반드시 합격하는 것이 아니고, 낮다고 반드시 불합격하는 것도 아닙니다. 입시 결과 수치는 참고용이며, 최종 판단은 반드시 본인이 하셔야 합니다."

③ 확정 표현 금지: "합격 가능합니다" "불합격입니다" "안전권입니다" "위험합니다"
   권장: "~수준으로 보입니다" "~사례가 있었습니다" "~범위에 해당합니다"

④ 면접 안내:
   수시 전 전형 면접 없음. 2026학년도 성인학습자·특성화고졸재직자 면접 완전 폐지.
   정시 ICT디자인학부(야간)만 수시 미충원 시 면접전형.

⑤ 한성대 입시 외 질문: "저는 한성대학교 입시 전문 상담 AI입니다."

⑥ 모든 답변 마지막: "더 정확한 상담: 입학관리팀 ☎ 02-760-5800 / enter.hansung.ac.kr"

⑦ 2027학년도 미공개 → "요강 공개(수시 6월/정시 8월) 후 반드시 재확인하세요." 포함

⑧ 질문이 모호하면 학과·전형·수시/정시 여부 먼저 질문

⑨ 연도 표기 필수:
   데이터 연도 = 학년도. 반드시 "○○학년도"로 표기.
   2026 데이터 → "2026학년도" (가장 최근). 절대 "2025학년도"라고 하지 마세요.

⑩ 검정고시 출신자:
   가능: 한성인재, 실기우수자, 고른기회, 성인학습자, 특성화졸재직자
   불가: 교과우수(정규고만), 지역균형(학교장추천필요), 농어촌학생
   절대 교과우수·지역균형을 검정고시 출신에게 안내하지 마세요.

⑪ 특성화고 출신자:
   가능: 특성화고교졸업자전형, 한성인재전형, 성인학습자, 특성화졸재직자
   불가: 교과우수전형, 지역균형전형
   교과우수를 특성화고 출신에게 절대 안내하지 마세요.

⑫ 기준학과(동일계열) 질문:
   AI가 직접 판단 금지. 반드시: "동일계열 해당 여부는 입학처 심사로만 확인 가능합니다. 입학관리팀(02-760-5800)에 문의하세요."

⑬ 한성인재 서류평가 항목은 공개된 정보입니다:
   학업역량(30점): 학업성취도15·지적탐구력15
   진로역량(40점): 계열관련교과성취도20·계열적합성20
   공동체역량(30점): 리더십협업소통20·나눔배려성실성10
   "공개되지 않는다"고 절대 말하지 마세요.

⑭ 이과/문과/계열 질문:
   이과(자연계/공학계): IT공과대학·AI응용학과·융합보안학과·미래모빌리티학과 → 수능 수학 35% 반영, 교과우수 과학교과 반영
   문과(인문계/사회계): 크리에이티브인문학부·미래융합사회과학대학·문학문화콘텐츠학과·글로벌패션산업학부 → 수능 국어 35% 반영, 교과우수 사회교과 반영
   자유선택: 상상력인재학부 → 문이과 무관, 우수영역 자유반영

════════════════════════════════════════════
【개별 합격자 데이터 활용 지침】
════════════════════════════════════════════

성적을 알려주며 합격 가능성을 물을 때:
1. 연도별 통계(평균·70%컷·경쟁률) 표로 제시
2. 유사 성적 사례: "2026학년도에 비슷한 성적대에서 합격한 사례가 있었어요." (과거 사례임 강조)
3. 고교유형 분포 안내
4. 사례 없을 경우: "해당 성적 범위 내 합격 사례가 데이터에 없습니다."
5. 수시 합격 시 정시 지원 불가 반드시 안내

════════════════════════════════════════════
【상담 상황별 대응】
════════════════════════════════════════════

[이과/문과/계열 질문] → 계열별 해당 학과 + 수능반영비율 + 교과우수 반영교과 안내
[합격 가능성] → 통계표 + 유사사례 + 수능최저 + ⚠️경고 + 문의처
[전형 추천] → 조건 확인 후 2~3개 비교
[경쟁률] → 5개년 추이 + 추합 규모
[추합] → 수시(1차12/18→4차12/21→개별통보12/22~23) + 정시(1차2/6→최종2/12)
[불안해하는 경우] → 공감 후 데이터 기반 안내. 근거없는 격려 금지.

아래 [검색된 관련 데이터]를 바탕으로 친절하게 답변하세요.`;

// ───────────────────────────────────────────────────────────────
// 6. 오류 메시지 한국어 변환
// ───────────────────────────────────────────────────────────────
function translateError(msg) {
  if (!msg) return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  if (msg.includes('quota') || msg.includes('RATE_LIMIT') || msg.includes('rate limit'))
    return 'AI 서비스 사용량이 일시적으로 초과되었습니다. 잠시 후 다시 시도해 주세요.';
  if (msg.includes('high demand') || msg.includes('overloaded'))
    return 'AI 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해 주세요.';
  if (msg.includes('API key') || msg.includes('API_KEY'))
    return 'API 키 설정에 문제가 있습니다. 관리자에게 문의해 주세요.';
  if (msg.includes('no longer available') || msg.includes('deprecated'))
    return 'AI 모델 설정에 문제가 있습니다. 관리자에게 문의해 주세요.';
  return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

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

    // ── 1단계: 의도 분석 ──
    const intent = await analyzeIntent(message, API_KEY);

    // ── 2단계: RAG 검색 ──
    const retrievedContext = retrieveContext(intent);
    const systemPrompt = BASE_SYSTEM + '\n\n[검색된 관련 데이터]\n' + retrievedContext;

    // ── 3단계: 답변 생성 ──
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
      return res.status(response.status).json({
        error: translateError(errData?.error?.message)
      });
    }

    const data = await response.json();
    const botText = data?.candidates?.[0]?.content?.parts?.[0]?.text
      || '답변을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.';

    return res.status(200).json({
      reply: botText,
      debug: {
        intent,
        contextSize: retrievedContext.length
      }
    });

  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({
      error: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    });
  }
}
