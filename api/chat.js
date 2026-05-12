// ═══════════════════════════════════════════════════════════════
// 한성대학교 입시 상담 AI — Vercel 서버 코드 (완전판 RAG)
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
  '뷰티디자인매니지먼트학과': ['뷰티디자인매니지먼트학과','뷰티디자인매니지먼트','뷰티디자인','뷰티'],
  'ICT디자인학부': ['ICT디자인학부','ICT디자인','ict디자인'],
  'IT공과대학': ['IT공과대학','IT공과','IT공대','컴퓨터공학','기계전자','산업시스템'],
  '상상력인재학부': ['상상력인재학부','상상력인재','상상력'],
  '문학문화콘텐츠학과': ['문학문화콘텐츠학과','문학문화콘텐츠','문학문화','콘텐츠'],
  'AI응용학과': ['AI응용학과','AI응용','ai응용'],
  '융합보안학과': ['융합보안학과','융합보안'],
  '미래모빌리티학과': ['미래모빌리티학과','미래모빌리티','모빌리티'],
  '동양화': ['동양화'],
  '서양화': ['서양화'],
  '한국무용': ['한국무용'],
  '현대무용': ['현대무용'],
  '발레': ['발레'],
  '융합행정학과': ['융합행정학과','융합행정'],
  '호텔외식경영학과': ['호텔외식경영학과','호텔외식경영','호텔'],
  '비즈니스컨설팅학과': ['비즈니스컨설팅학과','비즈니스컨설팅'],
  'ICT융합디자인학과': ['ICT융합디자인학과','ICT융합디자인'],
  'AI소프트웨어학과': ['AI소프트웨어학과','AI소프트웨어','ai소프트웨어']
};

const ADMISSION_KEYWORDS = {
  '교과우수': ['교과우수','교과우수전형','교과Ⅰ','교과1'],
  '지역균형': ['지역균형','지역균형전형','교과Ⅱ','교과2','학교장추천','추천전형'],
  '한성인재': ['한성인재','한성인재전형','학생부종합','종합전형'],
  '실기우수자': ['실기우수자','실기우수자전형','실기전형'],
  '고른기회': ['고른기회','고른기회전형','기회균형','국가보훈','기초생활'],
  '성인학습자': ['성인학습자','평생학습자','성인학습자전형'],
  '특성화고졸재직자': ['재직자','특성화고졸재직자','재직자전형'],
  '농어촌학생': ['농어촌','농어촌학생','농어촌전형'],
  '특성화고교졸업자': ['특성화고졸업자','특성화고교졸업자'],
  '일반학생': ['정시','일반학생','수능위주']
};

const TOPIC_KEYWORDS = {
  '일정': ['일정','기간','언제','날짜','원서','접수','발표','등록'],
  '추합': ['추합','충원합격','예비번호','예비순위','충원'],
  '자격': ['자격','지원자격','지원가능','지원불가','검정고시'],
  '수능최저': ['수능최저','최저','수능최저기준'],
  '장학금': ['장학금','장학','학비','등록금감면'],
  '전형방법': ['전형방법','평가방법','반영방법','어떻게평가'],
  '모집인원': ['모집인원','몇명','인원','정원'],
  '반영교과': ['반영교과','반영과목','내신과목'],
  '실기': ['실기고사','실기종목','준비물','실기내용'],
  '변천이력': ['바뀌었','변경','달라졌','예전','이전','언제부터','신설','폐지','없어졌'],
  '경쟁률': ['경쟁률','경쟁'],
  '전형추천': ['추천해','유리한','어떤전형','뭐가좋'],
  '수능반영': ['수능반영','영역별반영','반영비율','백분위'],
  '장학금': ['장학금','장학','학비'],
  '전형료': ['전형료','접수비','수수료']
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

  return { detectedDepts, detectedAdmissions, detectedTopics, dayNight, grade };
}

// ───────────────────────────────────────────────────────────────
// 3. RAG 컨텍스트 검색
// ───────────────────────────────────────────────────────────────
function retrieveContext(analysis) {
  const { detectedDepts, detectedAdmissions, detectedTopics, dayNight } = analysis;
  let parts = [];

  // 일정
  if (detectedTopics.includes('일정') || detectedTopics.includes('추합')) {
    const isJeongsi = detectedAdmissions.includes('일반학생');
    if (isJeongsi) {
      parts.push('【정시 일정】\n' + JSON.stringify(KNOWLEDGE.schedule_jeongsi, null, 2));
    } else {
      parts.push('【수시 일정】\n' + JSON.stringify(KNOWLEDGE.schedule_susi, null, 2));
    }
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
        if (KNOWLEDGE.admission_quota[quotaKey]) {
          parts.push(`【${adm} 학과별 모집인원】\n` + JSON.stringify(KNOWLEDGE.admission_quota[quotaKey], null, 2));
        }
      }
    }
    parts.push('【수시 전체 모집인원】\n' + JSON.stringify(KNOWLEDGE.admission_quota.수시전체, null, 2));
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

  // 전형 추천 (자격·일정 등 전반 안내)
  if (detectedTopics.includes('전형추천')) {
    parts.push('【전형별 자격 요약】\n' + JSON.stringify(KNOWLEDGE.admission_eligibility, null, 2));
    parts.push('【내신 환산 및 반영교과】\n' + JSON.stringify(KNOWLEDGE.grade_conversion, null, 2));
  }

  // RAW 통계 (학과+전형 매칭)
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
      parts.push('【합격자 통계 데이터】\n' + formatStats(statsResults));
    }
  }

  // 아무것도 감지 안 된 경우 → 기본 안내 데이터 제공
  if (parts.length === 1) {
    parts.unshift('【한성대 입시 기본 정보】\n' +
      '수시원서: 2025.09.08~09.12 / 정시원서: 2025.12.29~12.31\n' +
      '수능최저: 교과우수주간(2개합7이내), 교과우수야간(2개합8이내), 나머지없음\n' +
      '문의: 입학관리팀 02-760-5800 / enter.hansung.ac.kr');
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
      text += `학년도 | 모집 | 최초합격 | 추가합격 | 학생부평균 | 70%컷\n`;
      for (const year of years) {
        const d = item.연도별[year];
        text += `${year} | ${d.모집인원}명 | ${d.최초합격}명 | ${d.추가합격}명 | ${d['학생부평균'] || '-'} | ${d['학생부70%컷'] || '-'}\n`;
      }
    } else if (hasSuneung) {
      text += `학년도 | 모집 | 최초합격 | 추가합격 | 수능평균 | 수능70%컷\n`;
      for (const year of years) {
        const d = item.연도별[year];
        text += `${year} | ${d.모집인원}명 | ${d.최초합격}명 | ${d.추가합격}명 | ${d['수능평균'] || '-'} | ${d['수능70%컷'] || '-'}\n`;
      }
    }

    const latestYear = years[years.length - 1];
    if (item.연도별[latestYear] && item.연도별[latestYear].고교유형분포) {
      const dist = item.연도별[latestYear].고교유형분포;
      const total = Object.values(dist).reduce((a, b) => a + b, 0);
      text += `${latestYear} 고교유형: `;
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
// 4. 시스템 프롬프트 (최소화)
// ───────────────────────────────────────────────────────────────
const BASE_SYSTEM = `당신은 한성대학교 공식 입시 상담 AI입니다.

【절대 원칙】
① 제공된 [검색된 관련 데이터]만 근거로 상담합니다.
② 수치 제공 시 반드시 포함: "⚠️ 이 수치보다 높다고 반드시 합격하는 것이 아니고, 낮다고 반드시 불합격하는 것도 아닙니다. 최종 판단은 본인이 하셔야 합니다."
③ 확정 표현 절대 금지: "합격 가능", "불합격", "안전권", "위험"
④ 한성대 입시 외 질문: "저는 한성대학교 입시 전문 상담 AI입니다."
⑤ 모든 답변 마지막: "더 정확한 상담: 입학관리팀 ☎ 02-760-5800 / enter.hansung.ac.kr"
⑥ 2027학년도 미공개 → 2026 기준 안내 후 요강 공개(수시 6월/정시 8월) 시 재확인 권고
⑦ 질문이 모호하면 학과·전형·수시/정시 여부를 먼저 확인

아래 [검색된 관련 데이터]를 바탕으로 친절하게 답변하세요.`;

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
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
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
        contextSize: retrievedContext.length
      }
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
