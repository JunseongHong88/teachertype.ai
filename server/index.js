// server/index.js
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/analyze', async (req, res) => {
  const { text } = req.body;

  const systemPrompt = `
당신은 교육 데이터를 분석하는 전문가 GPT입니다.
다음 절차에 따라 수업 발화 데이터를 분석한 후, 각 단계별 결과를 JSON 배열 형식으로 반환하세요.

형식 예시:
[
  { "title": "1. 전처리", "content": "전처리 결과 내용..." },
  { "title": "2. 유형 분류", "content": "분류된 발화 리스트..." },
  ...
]

분석 절차는 다음과 같습니다:
1. [전처리] 시간, 발화자, 원문을 구조화.
2. [유형 분류] 설명/질문/피드백/지시/격려 등으로 분류.
3. [질문 분석] 블룸의 인지 수준, 질문 유형(개방형/폐쇄형, 수렴/확산) 분석.
4. [상호작용/언어 특성 분석] 교사/학생 비율, 문장 길이, 어휘 수준, 감정.
5. [핵심 인사이트 도출] 효과적인 전략, 개선점 요약.
6. [최종 리포트] 위 내용을 종합하여 정리된 피드백 제공.

사용자가 제공한 발화 데이터:
"""

${text}

"""
각 단계를 분리하여 JSON으로 출력하세요.
`;

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      temperature: 0.5
    });

    const result = chat.choices[0].message.content;
    res.json({ result });
  } catch (err) {
    console.error('GPT 오류:', err.message);
    res.status(500).json({ error: 'GPT 분석 실패' });
  }
});

app.listen(3001, () => {
  console.log('✅ GPT 분석 서버가 http://localhost:3001 에서 실행 중입니다!');
});