// server/index.js

// 1) 환경변수 로드
require('dotenv').config();

// 2) 모듈 불러오기
const express = require('express');
const cors = require('cors');
const path = require('path');
const { OpenAI } = require('openai');

// 3) 앱 초기화
const app = express();
app.use(cors());
app.use(express.json());

// 4) OpenAI 클라이언트 설정
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 5) 분석 엔드포인트 (/analyze)
app.post('/analyze', async (req, res) => {
  const { text } = req.body;
  const systemPrompt = `
당신은 교육 데이터를 분석하는 전문가 GPT입니다.
아래 구조의 JSON 객체만 반환하세요.
키 순서는 정확히 아래 순서를 따르세요.

{
  "전처리": ["교사: '수업을 시작합니다.'", "학생: '네, 선생님.'", ...],
  "유형 분류": ["설명: '지난 시간에 배운 내용을 복습해 볼까요?'", ...],
  "질문 분석": ["개방형 질문: '이 개념이 잘 이해되나요?'", ...],
  "상호작용 분석": ["교사:학생 발화 비율 = 65:35", "평균 문장 길이 = 10.2 단어", ...]
}

<분석 절차>
1. 전처리: 발화자와 원문만 추출해 리스트로 나열
2. 유형 분류: '설명', '질문', '지시', '격려' 등 카테고리별로 실제 발화 문장을 리스트화
3. 질문 분석: '개방형/폐쇄형' 구분과 Bloom 단계별로 해당 발화 문장을 리스트화
4. 상호작용 분석: 교사/학생 발화 비율, 평균 문장 길이, 어휘 난이도를 각각 리스트 항목으로 생성

사용자 입력 데이터:
"""
${text}
"""
`;

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'system', content: systemPrompt }],
      temperature: 0.3
    });
    const raw = chat.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);
    return res.json({ analysis: parsed });
  } catch (err) {
    console.error('❌ 분석 오류:', err);
    return res.status(500).json({ error: '분석 실패', details: err.message });
  }
});

// 6) 인사이트 엔드포인트 (/insights)
app.post('/insights', async (req, res) => {
  const { analysis } = req.body;
  const insightPrompt = `
당신은 교사들에게 수업 개선 아이디어를 제안하는 전문가입니다.
아래 분석 결과를 바탕으로, 교사가 적용할 수 있는 구체적인 수업 개선 아이디어 5가지를 JSON 배열 형태로 제시하세요.
각 아이디어는 'idea', 'description' 두 개의 키를 가져야 합니다.

분석 결과:
${JSON.stringify(analysis, null, 2)}
`;

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: '교사 수업 개선 아이디어 제안 전문가' },
        { role: 'user', content: insightPrompt }
      ],
      temperature: 0.5
    });
    const raw = chat.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);
    return res.json({ insights: parsed });
  } catch (err) {
    console.error('❌ 인사이트 생성 오류:', err);
    return res.status(500).json({ error: '인사이트 생성 실패', details: err.message });
  }
});

// 7) React 정적 파일 서빙
const clientBuildPath = path.join(__dirname, '../client/build');
app.use(express.static(clientBuildPath));

// 8) SPA Fallback
app.use((req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// 9) 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});
