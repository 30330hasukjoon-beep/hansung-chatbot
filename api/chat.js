// ═══════════════════════════════════════════════════════════════
// 한성대학교 입시 상담 AI — Vercel 서버 코드 (RAG 방식)
// ═══════════════════════════════════════════════════════════════

const RAW_STATS = require('../data/raw_stats.json');

// ───────────────────────────────────────────────────────────────
// 1. 키워드 → 관련 데이터 검색 (RAG 핵심)
// ───────────────────────────────────────────────────────────────

// 학과명 매핑 (사용자가 줄여서 말해도 인식)
const DEPT_MAP = {
  '크리에이티브인문학부': '크리에이티브인문학부',
  '크리에이티브': '크리에이티브인문학부',
  '인문학부': '크리에이티브인문학부',
  '미래융합사회과학대학': '미래융합사회과학대학',
  '미래융합': '미래융합사회과학대학',
  '사회과학': '미래융합사회과학대학',
  '글로벌패션산업학부': '글로벌패션산업학부',
  '글로벌패션': '글로벌패션산업학부',
  '패션': '글로벌패션산업학부',
  'IT공과대학': 'IT공과대학',
  'IT공대': 'IT공과대학',
  '컴퓨터공학': 'IT공과대학',
  '상상력인재학부': '상상력인재학부',
  '상상력인재': '상상력인재학부',
  '문학문화콘텐츠학과': '문학문화콘텐츠학과',
  '문학문화': '문학문화콘텐츠학과',
  '콘텐츠': '문학문화콘텐츠학과',
  'AI응용학과': 'AI응용학과',
  'AI응용': 'AI응용학과',
  '융합보안학과': '융합보안학과',
  '융합보안': '융합보안학과',
  '미래모빌리티학과': '미래모빌리티학과',
  '모빌리티': '미래모빌리티학과',
  '뷰티디자인매니지먼트학과': '뷰티디자인매니지먼트학과',
  '뷰티디자인매니지먼트': '뷰티디자인매니지먼트학과',
  '뷰티': '뷰티디자인매니지먼트학과',
  'ICT디자인학부': 'ICT디자인학부',
  'ICT디자인': 'ICT디자인학부',
  '동양화': '동양화',
  '서양화': '서양화',
  '한국무용': '한국무용',
  '현대무용': '현대무용',
  '발레': '발레',
  '융합행정학과': '융합행정학과',
  '호텔외식경영학과': '호텔외식경영학과',
  '비즈니스컨설팅학과': '비즈니스컨설팅학과',
  'ICT융합디자인학과': 'ICT융합디자인학과',
  'AI소프트웨어학과': 'AI·소프트웨어학과',
  'AI·소프트웨어학과': 'AI·소프트웨어학과',
};

// 전형명 매핑
const ADMISSION_MAP = {
  '교과우수': '교과우수',
  '교과우수전형': '교과우수',
  '교과Ⅰ': '교과우수',
  '지역균형': '지역균형',
  '지역균형전형': '지역균형',
  '교과Ⅱ': '지역균형',
  '한성인재': '한성인재',
  '한성인재전형': '한성인재',
  '실기우수자': '실기우수자',
  '실기우수자전형': '실기우수자',
  '고른기회': '고른기회',
  '기회균형': '고른기회',
  '성인학습자': '성인학습자',
  '재직자': '특성화고교졸재직자',
  '특성화고졸재직자': '특성화고교졸재직자',
  '농어촌': '농어촌학생',
  '농어촌학생': '농어촌학생',
  '특성화고졸업자': '특성화고교졸업자',
  '일반학생': '일반학생',
  '정시': '일반학생',
};

// 주야 감지
function detectDayNight(text) {
  if (text.includes('야간') || text.includes('야')) return '야간';
  if (text.includes('주간') || text.includes('주')) return '주간';
  return null;
}

// 사용자 질문에서 관련 RAG 데이터 추출
function retrieveRelevantData(userMessage) {
  const text = userMessage;
  const results = [];

  // 학과 감지
  let detectedDept = null;
  for (const [keyword, deptName] of Object.entries(DEPT_MAP)) {
    if (text.includes(keyword)) {
      detectedDept = deptName;
      break;
    }
  }

  // 전형 감지
  let detectedAdmission = null;
  for (const [keyword, admName] of Object.entries(ADMISSION_MAP)) {
    if (text.includes(keyword)) {
      detectedAdmission = admName;
      break;
    }
  }

  // 주야 감지
  const dayNight = detectDayNight(text);

  // 관련 데이터 검색
  for (const [key, value] of Object.entries(RAW_STATS)) {
    const deptMatch = detectedDept && value.모집단위.includes(detectedDept);
    const admMatch = detectedAdmission && value.전형 === detectedAdmission;
    const dayNightMatch = !dayNight || value.모집단위.includes(`(${dayNight.charAt(0)})`);

    if (deptMatch && admMatch && dayNightMatch) {
      results.push(value);
    } else if (deptMatch && !detectedAdmission) {
      results.push(value);
    } else if (admMatch && !detectedDept) {
      // 전형만 지정된 경우 상위 5개만
      if (results.length < 5) results.push(value);
    }
  }

  return { results, detectedDept, detectedAdmission, dayNight };
}

// ───────────────────────────────────────────────────────────────
// 2. 기본 입시 정보 (모집요강 핵심)
// ───────────────────────────────────────────────────────────────
const BASE_SYSTEM = `당신은 한성대학교 공식 입시 상담 AI입니다.

【핵심 원칙】
① 제공된 데이터 수치만을 근거로 상담합니다.
② 입시결과 수치 제공 시 반드시 포함:
   "⚠️ 이 수치보다 높다고 반드시 합격하는 것이 아니고, 낮다고 반드시 불합격하는 것도 아닙니다. 최종 판단은 본인이 하셔야 합니다."
③ "합격 가능", "불합격" 등 확정 표현 절대 금지
④ 한성대 입시 외 질문: "한성대 입시 전문 상담 AI입니다."로 안내
⑤ 모든 답변 마지막: "더 정확한 상담: 입학관리팀 ☎ 02-760-5800 / enter.hansung.ac.kr"
⑥ 2027학년도는 아직 미공개. 2026학년도 기준 안내 후 요강 공개(수시 6월/정시 8월) 시 재확인 권고

【2026학년도 핵심 정보】
수시원서: 2025.09.08~09.12 / 서류마감: 09.15 / 합격발표: 교과우수 12.10, 나머지 11.07
정시원서: 2025.12.29~12.31 / 합격발표: 2026.01.30

수능최저: 교과우수주간(2개합7이내), 교과우수야간(2개합8이내), 나머지 없음
학교장추천: 지역균형전형만 필요

수시최대6회(성인학습자·재직자 제한없음) / 수시합격시 정시절대불가

정시반영비율:
- 인문·사회·디자인계: 국어35%+수학25%+영어20%+탐구20%
- 공대계(IT·AI·융합보안·모빌리티): 국어25%+수학35%+영어20%+탐구20%
- 상상력인재: 우수영역순 40-30-20-10%
- 예술학부: 국어또는수학중높은것40%+영어40%+탐구20%

영어등급점수: 1등급100/2등급97/3등급94/4등급80/5등급70/6등급55/7등급40/8등급25/9등급10
한국사가산점: 1~4등급10점/5등급8점/6등급6점/7등급4점/8등급2점/9등급0점

문의처: 입학관리팀 02-760-5800 / enter.hansung.ac.kr`;

// ───────────────────────────────────────────────────────────────
// 3. 검색된 데이터를 텍스트로 변환
// ───────────────────────────────────────────────────────────────
function formatRetrievedData(retrievedData) {
  if (!retrievedData || retrievedData.length === 0) return '';

  let text = '\n\n【검색된 입시결과 데이터】\n';

  for (const item of retrievedData) {
    text += `\n▶ ${item.모집단위} / ${item.전형}전형\n`;
    text += `학년도 | `;

    const years = Object.keys(item.연도별).sort();
    const hasScore = years.some(y => item.연도별[y].학생부평균);
    const hasSuneung = years.some(y => item.연도별[y].수능평균);

    if (hasScore) {
      text += `모집인원 | 최초합격 | 추가합격 | 학생부평균 | 학생부70%컷\n`;
      for (const year of years) {
        const d = item.연도별[year];
        text += `${year} | ${d.모집인원}명 | ${d.최초합격}명 | ${d.추가합격}명 | ${d.학생부평균 || '-'} | ${d.학생부70%컷 || '-'}\n`;
      }
    } else if (hasSuneung) {
      text += `모집인원 | 최초합격 | 추가합격 | 수능평균 | 수능70%컷\n`;
      for (const year of years) {
        const d = item.연도별[year];
        text += `${year} | ${d.모집인원}명 | ${d.최초합격}명 | ${d.추가합격}명 | ${d.수능평균 || '-'} | ${d['수능70%컷'] || '-'}\n`;
      }
    }

    // 최근 고교유형 분포
    const latestYear = years[years.length - 1];
    if (item.연도별[latestYear].고교유형분포) {
      const dist = item.연도별[latestYear].고교유형분포;
      const total = Object.values(dist).reduce((a, b) => a + b, 0);
      text += `${latestYear} 고교유형: `;
      text += Object.entries(dist)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([k, v]) => `${k} ${Math.round(v/total*100)}%`)
        .join(', ') + '\n';
    }
  }

  return text;
}

// ───────────────────────────────────────────────────────────────
// 4. Vercel API 핸들러
// ───────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });
  }

  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: '메시지가 없습니다.' });
    }

    // RAG: 관련 데이터 검색
    const { results, detectedDept, detectedAdmission } = retrieveRelevantData(message);
    const retrievedText = formatRetrievedData(results);

    // 시스템 프롬프트 + 검색된 데이터 결합
    const systemPrompt = BASE_SYSTEM + retrievedText;

    // 대화 히스토리 구성
    const contents = [
      ...history,
      { role: 'user', parts: [{ text: message }] }
    ];

    // Gemini API 호출
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json({
        error: errData?.error?.message || '알 수 없는 오류'
      });
    }

    const data = await response.json();
    const botText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '답변을 가져오지 못했습니다.';

    return res.status(200).json({
      reply: botText,
      debug: { detectedDept, detectedAdmission, dataCount: results.length }
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
