// server/index.js

/**
 * Teachertype.ai Backend
 *  - GPT-4o-mini 기반 분석 및 스트리밍 구현
 *  - Express + OpenAI integration
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ——————————————
// 프롬프트 생성 함수
// ——————————————
function createAnalysisPrompt(text) {
  return `당신은 수업 발화 데이터를 분석하는 전문가 GPT입니다.
출력은 반드시 유효한 JSON 객체여야 합니다.

구조:
{
  "전처리": ["교사: ...", "학생: ..."],
  "유형 분류": ["설명: ...", "질문: ..."],
  "질문 분석": ["개방형 질문: ...", "..."],
  "상호작용 분석": ["교사:학생 비율 = ...", "..."]
}

절차:
1) 전처리: 발화자+원문 추출
2) 유형 분류: 카테고리별 문장 리스트
3) 질문 분석: 개방형/폐쇄형 및 Bloom 단계
4) 상호작용 분석: 비율·길이·어휘 난이도

사용자 데이터:
"""
${text}
"""`;
}

function createInsightPrompt(analysis) {
  const data = JSON.stringify(analysis, null, 2);
  return `교사 수업 개선 아이디어 제안 전문가로서,
아래 분석 결과를 바탕으로 구체적인 아이디어 5가지를 JSON 배열로 제안하세요.
각 아이디어는 "idea"와 "description" 필드를 가져야 합니다.

분석 결과:
${data}
`;
}

// ——————————————
// 1) 비스트리밍 분석 엔드포인트
// ——————————————
app.post('/analyze', async (req, res) => {
  const { text } = req.body;
  const prompt = createAnalysisPrompt(text);
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.3
    });
    const analysis = JSON.parse(response.choices[0].message.content.trim());
    res.json({ analysis });
  } catch (error) {
    console.error('🚨 분석 오류:', error);
    res.status(500).json({ error: '분석 실패', details: error.message });
  }
});

// ——————————————
// 2) 스트리밍 분석 엔드포인트
// ——————————————
app.post('/analyze-stream', async (req, res) => {
  const { text } = req.body;
  const prompt = createAnalysisPrompt(text);

  // 스트림 헤더
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Transfer-Encoding': 'chunked',
  });

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: prompt }],
    temperature: 0.3,
    stream: true
  });

  for await (const packet of stream) {
    const delta = packet.choices[0].delta?.content;
    if (delta) res.write(delta);
  }
  res.end();
});

// ——————————————
// 3) 인사이트 생성 엔드포인트
// ——————————————
app.post('/insights', async (req, res) => {
  const { analysis } = req.body;
  const prompt = createInsightPrompt(analysis);
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '교사 수업 개선 아이디어 제안 전문가' },
        { role: 'user',   content: prompt }
      ],
      temperature: 0.5
    });
    const insights = JSON.parse(response.choices[0].message.content.trim());
    res.json({ insights });
  } catch (error) {
    console.error('🚨 인사이트 오류:', error);
    res.status(500).json({ error: '인사이트 실패', details: error.message });
  }
});

// ——————————————
// 4) 정적 파일 서빙 & SPA Fallback (라우트 정의 뒤에 배치)
// ——————————————
const clientBuildPath = path.join(__dirname, '../client/build');
app.use(express.static(clientBuildPath));
app.use((req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ——————————————
// 5) 서버 시작
// ——————————————
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});