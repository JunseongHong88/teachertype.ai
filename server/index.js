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
app.use(express.json()); // body-parser 대신

// 4) OpenAI(GPT) 클라이언트 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 5) 분석 엔드포인트 (/analyze)
app.post('/analyze', async (req, res) => {
  const { text } = req.body;

  const systemPrompt = `
당신은 교육 데이터를 분석하는 전문가 GPT입니다.
다음 절차에 따라 수업 발화 데이터를 분석한 후, 각 단계별 결과를 JSON 배열 형식으로 반환하세요.

[
  { "title": "1. 전처리",      "content": "전처리 결과 내용..." },
  { "title": "2. 유형 분류",   "content": "분류된 발화 리스트..." },
  { "title": "3. 질문 분석",   "content": "블룸 인지 수준 및 질문 유형..." },
  { "title": "4. 상호작용 분석","content": "교사/학생 비율 등 분석 결과..." },
  { "title": "5. 인사이트 도출","content": "효과적인 전략 및 개선점 요약" },
  { "title": "6. 최종 리포트",  "content": "종합 피드백 제공 내용" }
]

1. [전처리] 발화자, 원문 구조화  
2. [유형 분류] 설명/질문/피드백/지시/격려 등으로 분류  
3. [질문 분석] 블룸의 인지 수준과 개방형/폐쇄형 질문 유형 분석  
4. [상호작용 분석] 교사/학생 비율, 문장 길이, 어휘 수준 등 분석  
5. [인사이트 도출] 효과적인 전략과 개선점 요약  
6. [최종 리포트] 위 모든 내용을 종합하여 피드백 제공  

사용자가 제공한 발화 데이터:
"""
${text}
"""
각 단계를 JSON 배열로 구분하여 반환하세요.
  `;

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'system', content: systemPrompt }],
      temperature: 0.5
    });

    return res.json({ result: chat.choices[0].message.content });
  } catch (err) {
    console.error('❌ GPT 오류:', err);
    return res.status(500).json({ error: 'GPT 분석 실패' });
  }
});

// 6) React 정적 파일 서빙
const clientBuildPath = path.join(__dirname, '../client/build');
app.use(express.static(clientBuildPath));

// 7) SPA Fallback (React Router 대응)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// 8) 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});