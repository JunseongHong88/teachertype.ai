// server/index.js

/**
 * Teachertype.ai Backend Server
 *  - GPT-4o-mini 기반 분석
 *  - SSE(스트리밍) 및 통합 분석+인사이트 엔드포인트
 */

// 1) 환경변수 로드
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { OpenAI } = require('openai');

// 2) 앱 초기화
const app = express();
app.use(cors());
app.use(express.json());

// 3) OpenAI 클라이언트 설정
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 4) 프롬프트 생성 함수
function createAnalysisPrompt(text) {
  return `당신은 수업 발화 데이터를 분석하는 전문가 GPT입니다.
출력은 반드시 유효한 JSON 객체여야 합니다.

구조:
{
  "전처리": ["교사: ...", "학생: ..."],
  "유형 분류": ["설명: ...", "질문: ..."],
  "질문 분석": ["개방형 질문: ...", ...],
  "상호작용 분석": ["교사:학생 비율 = ...", ...]
}

절차:
1) 전처리: 발화자+원문 추출
2) 유형 분류: 카테고리별 문장 리스트
3) 질문 분석: 개방형/폐쇄형 및 Bloom 단계
4) 상호작용 분석: 비율·길이·어휘 난이도

사용자 데이터:
"""
${text}
"""
`;
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

// 5) /analyze: 한 번에 처리 (비스트리밍)
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

// 6) /analyze-stream: SSE 스트리밍 분석
app.post('/analyze-stream', async (req, res) => {
  const { text } = req.body;
  const prompt = createAnalysisPrompt(text);

  // SSE 헤더
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // 스트림 호출
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: prompt }],
    temperature: 0.3,
    stream: true
  });

  let buffer = '';
  for await (const packet of stream) {
    const delta = packet.choices[0].delta?.content;
    if (delta) {
      buffer += delta;
      res.write(`data: ${JSON.stringify(delta)}\n\n`);
    }
  }

  // 종료 이벤트
  res.write(`event: done\ndata: [DONE]\n\n`);
  res.end();
});

// 7) /insights: 인사이트 생성
app.post('/insights', async (req, res) => {
  const { analysis } = req.body;
  const prompt = createInsightPrompt(analysis);
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '교사 수업 개선 아이디어 제안 전문가' },
        { role: 'user', content: prompt }
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

// 8) React 정적 파일 서빙 & SPA Fallback
const clientBuildPath = path.join(__dirname, '../client/build');
app.use(express.static(clientBuildPath));
app.use((req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// 9) 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 시작됨 - http://localhost:${PORT}`);
});