// client/src/App.js
import React, { useState } from 'react';

function App() {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl w-full">
        <h1 className="text-3xl font-semibold text-center mb-6">수업 발화 분석 & 인사이트 제안</h1>
        <textarea
          className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
          placeholder="원문 발화 데이터를 여기에 붙여넣으세요."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex justify-center space-x-4 mt-4">
          <button
            onClick={handleAnalyze}
            disabled={loading || !text.trim()}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-opacity disabled:opacity-50"
          >
            분석하기
          </button>
          {analysis && (
            <button
              onClick={handleInsights}
              disabled={loading}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-opacity disabled:opacity-50"
            >
              인사이트 얻기
            </button>
          )}
        </div>

        {loading && <p className="text-center text-gray-600 mt-4">처리 중...</p>}

        {analysis && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-center mb-4">분석 결과</h2>
            {Object.entries(analysis).map(([section, items]) => (
              <div key={section} className="mb-6">
                <h3 className="text-xl font-medium mb-2">{section}</h3>
                <ul className="list-disc list-inside space-y-1 max-h-64 overflow-auto">
                  {items.map((item, idx) => (
                    <li key={idx} className="text-gray-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {insights && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-center mb-4">인사이트 제안</h2>
            <ul className="list-decimal list-inside space-y-2">
              {insights.map((insight, idx) => (
                <li key={idx} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <p className="font-semibold">{insight.idea}</p>
                  <p className="text-gray-600 mt-1">{insight.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
