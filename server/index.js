// server/index.js

/**
 * Teachertype.ai Backend
 * - GPT-4o-mini 기반 분석 및 스트리밍 구현
 * - Express + OpenAI integration
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

/**
 * 수업 발화 데이터 분석용 시스템 프롬프트 생성
 * @param {string} text - 원문 발화 데이터
 * @returns {string}
 */
function createAnalysisPrompt(text) {
  return `당신은 수업 발화 데이터를 분석하는 전문가 GPT입니다.

아래 4단계 절차에 따라 JSON 객체를 생성하세요.

1. 전처리 (Preprocessing)
   - 발화 구분: "교사: …" 또는 "학생: …"로 정렬, 중복·중첩 병합
   - 메타데이터 추출: speaker ("교사"/"학생"), segment ("도입"/"전개"/"정리"/null)
   - 텍스트 클렌징: 필러 단어 제거, 비수업용 언급 제거
   - 토큰화/정규화: 특수문자 제거, 숫자·단위 표준화

2. 유형 분류 (Classification)
   - Expository: 개념·원리 전달
   - Questioning: 학생 사고 유도
   - Feedback: 학생 답변 반응
   - Directive: 과제·행동 지시
   - Encouragement: 격려·동기부여
   기준: 키워드 매핑, 문장 구조 분석

3. 질문 분석 (Question Analysis)
   - 개방형(Open)/폐쇄형(Closed)
   - 수렴형(Convergent)/확산형(Divergent)
   - Bloom 단계: Remember, Understand, Apply, Analyze, Evaluate, Create
   기준: 질문 길이, 의도어, Bloom 매핑

4. 상호작용 분석 (Interaction Analysis)
   - 교사-학생 발화 비율
   - 평균 문장 길이 (단어 수)
   - 어휘 다양성 (TTR)
   - 감성 비율 (긍정 vs 부정 어휘)

출력 형식 예시:
{
  "전처리": [
    { "speaker":"교사", "segment":"도입", "text":"…" },
    ...
  ],
  "유형 분류": [
    { "id":1, "category":["Questioning"] },
    ...
  ],
  "질문 분석": [
    { "id":2, "type":"Open", "mode":"Convergent", "bloom":"Apply" },
    ...
  ],
  "상호작용 분석": {
    "ratio":1.2,
    "avgLength":23.3,
    "ttr":0.45,
    "sentiment": { "positive":0.8, "negative":0.2 }
  }
}

사용자 데이터:
"""
${text}
"""`;
}

/**
 * 인사이트 생성용 시스템 프롬프트 생성
 * @param {object} analysis - 분석 결과 JSON
 * @returns {string}
 */
function createInsightPrompt(analysis) {
  const data = JSON.stringify(analysis, null, 2);
  return `교사 수업 개선 아이디어 제안 전문가로서,
아래 분석 결과를 바탕으로 구체적인 아이디어 5가지를 JSON 배열로 제안하세요.
각 아이디어는 "idea"와 "description" 필드를 가져야 합니다.

분석 결과:
${data}
`;
}

// 1) 비스트리밍 분석
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

// 2) 스트리밍 분석
app.post('/analyze-stream', async (req, res) => {
  const { text } = req.body;
  const prompt = createAnalysisPrompt(text);

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

// 3) 인사이트 생성
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

// 4) 정적 파일 서빙 & SPA Fallback
const clientBuildPath = path.join(__dirname, '../client/build');
app.use(express.static(clientBuildPath));
app.use((req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// 5) 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});