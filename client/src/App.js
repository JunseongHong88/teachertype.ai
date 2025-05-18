// client/src/App.js

import React, { useState } from 'react';

export default function App() {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  // 분석 요청
  const handleAnalyze = async () => {
    setAnalysis(null);
    setInsights(null);
    setLoading(true);
    try {
      const res = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const { analysis } = await res.json();
      setAnalysis(analysis);
    } catch (err) {
      console.error(err);
      alert('분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 인사이트 요청
  const handleInsights = async () => {
    if (!analysis) return;
    setLoading(true);
    try {
      const res = await fetch('/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis }),
      });
      const { insights } = await res.json();
      setInsights(insights);
    } catch (err) {
      console.error(err);
      alert('인사이트 요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 스피커 색상 클래스
  const speakerColor = speaker =>
    speaker === '교사' ? 'text-red-600' : 'text-blue-600';

  // 분석 전 UI
  if (!analysis) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">
          수업 발화 분석 & 인사이트 제안
        </h1>
        <textarea
          className="w-full h-48 border rounded p-2 mb-4"
          placeholder="여기에 수업 발화 데이터를 붙여넣으세요."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handleAnalyze}
          disabled={loading || !text.trim()}
        >
          {loading ? '분석 중…' : '분석하기'}
        </button>
      </div>
    );
  }

  // 분석 결과 화면
  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-center">분석 결과</h1>

      {/* 전처리 */}
      {analysis.전처리 && (
        <section className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold mb-2">1. 전처리</h2>
          <ul className="list-disc ml-5 space-y-1">
            {analysis.전처리.map((item, i) => (
              <li key={i} className={speakerColor(item.speaker)}>
                [{item.speaker} / {item.stage || '-'}] {item.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 발화유형 */}
      {analysis.발화유형 && (
        <section className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold mb-2">2. 발화 유형</h2>
          <ul className="list-disc ml-5 space-y-1">
            {analysis.발화유형.map(({ id, types }) => (
              <li key={id}>
                발화 {id}: {types.join(', ')}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 질문분석 */}
      {analysis.질문분석 && (
        <section className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold mb-2">3. 질문 분석</h2>
          <ul className="list-disc ml-5 space-y-1">
            {analysis.질문분석.map(({ id, form, focus, bloom }) => (
              <li key={id}>
                질문 {id}: {form} / {focus} / Bloom 단계: {bloom}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 상호작용지표 (객체를 JSON 문자열로 렌더) */}
      {analysis.상호작용지표 && (
        <section className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold mb-2">4. 상호작용 지표</h2>
          <table className="w-full border-collapse">
            <tbody>
              {Object.entries(analysis.상호작용지표).map(([k, v]) => (
                <tr key={k}>
                  <td className="border px-2 py-1 font-medium">{k}</td>
                  <td className="border px-2 py-1">
                    {typeof v === 'object'
                      ? JSON.stringify(v)
                      : v}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* 인사이트 버튼 */}
      <div className="text-center">
        <button
          onClick={handleInsights}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? '요청 중…' : '인사이트 얻기'}
        </button>
      </div>

      {/* 개선 아이디어 */}
      {insights && (
        <section className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold mb-2">5. 개선 아이디어</h2>
          <ul className="list-decimal ml-5 space-y-2">
            {insights.map((it, idx) => (
              <li key={idx}>
                <p className="font-semibold">{it.idea}</p>
                <p className="text-gray-700">{it.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}