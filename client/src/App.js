// client/src/App.js
import React, { useState } from 'react';

function App() {
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
    } finally {
      setLoading(false);
    }
  };

  // 로딩/입력 전 UI
  if (!analysis) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4 text-center">
          수업 발화 분석 & 인사이트 제안
        </h1>
        <textarea
          className="w-full h-64 border p-2 rounded mb-4"
          placeholder="여기에 발화 데이터를 붙여넣으세요"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !text.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? '분석 중...' : '분석하기'}
        </button>
      </div>
    );
  }

  // 분석 결과가 있을 때 화면
  const { 전처리, 유형분류, 질문분석, 상호작용지표 } = analysis;

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold text-center">분석 결과</h1>

      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">1. 전처리</h2>
        <ul className="list-disc ml-5 space-y-1">
          {전처리.map((item, i) => (
            <li key={i}>
              <strong className="text-red-600">{item.speaker}:</strong>{' '}
              {item.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">2. 유형 분류</h2>
        <ul className="list-disc ml-5 space-y-1">
          {유형분류.map(({ id, 유형 }) => (
            <li key={id}>
              #{id} → {유형.join(', ')}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">3. 질문 분석</h2>
        <ul className="list-disc ml-5 space-y-1">
          {질문분석.map(({ id, 형태, 초점, 블룸 }) => (
            <li key={id}>
              #{id} → {형태} / {초점} / 블룸: {블룸}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">4. 상호작용 지표</h2>
        <table className="w-full table-auto border-collapse">
          <tbody>
            {Object.entries(상호작용지표).map(([key, value]) => (
              <tr key={key}>
                <td className="border px-2 py-1 font-medium">{key}</td>
                <td className="border px-2 py-1">{JSON.stringify(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 인사이트 얻기 버튼 */}
      <div className="text-center">
        <button
          onClick={handleInsights}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? '요청 중...' : '인사이트 얻기'}
        </button>
      </div>

      {/* 인사이트 결과 */}
      {insights && (
        <section className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">5. 개선 아이디어</h2>
          <ul className="list-decimal ml-5 space-y-2">
            {insights.map((idea, i) => (
              <li key={i}>
                <p className="font-semibold">{idea.idea}</p>
                <p className="text-gray-700">{idea.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default App;