// client/src/App.js
import React, { useState } from 'react';

function App() {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1) 분석하기 핸들러
  const handleAnalyze = async () => {
    setInsights(null);
    setLoading(true);
    try {
      const res = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err) {
      console.error('분석 오류', err);
    } finally {
      setLoading(false);
    }
  };

  // 2) 인사이트 얻기 핸들러
  const handleInsights = async () => {
    if (!analysis) return;
    setLoading(true);
    try {
      const res = await fetch('/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis }),
      });
      const data = await res.json();
      setInsights(data.insights);
    } catch (err) {
      console.error('인사이트 오류', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">수업 발화 분석 & 인사이트 제안</h1>
      <textarea
        rows={10}
        className="w-full p-2 border rounded"
        placeholder="원문 발화 데이터를 여기에 붙여넣으세요."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-2">
        <button
          onClick={handleAnalyze}
          disabled={loading || !text.trim()}
          className="px-4 py-2 mr-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          분석하기
        </button>
        {analysis && (
          <button
            onClick={handleInsights}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            인사이트 얻기
          </button>
        )}
      </div>

      {loading && <p className="mt-4">처리 중...</p>}

      {analysis && (
        <div className="mt-6">
          <h2 className="text-xl mb-2">분석 결과</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(analysis, null, 2)}
          </pre>
        </div>
      )}

      {insights && (
        <div className="mt-6">
          <h2 className="text-xl mb-2">인사이트 제안</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(insights, null, 2)}
          </pre>
        </div>
      )}
    </div>
);

}

export default App;