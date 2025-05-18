import React, { useState } from 'react';

function App() {
  const [text, setText] = useState('');
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!text.trim()) return alert('발화 데이터를 입력해 주세요.');
    setLoading(true);
    setSections([]);

    try {
      const response = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await response.json();
      const parsed = JSON.parse(data.result);
      setSections(parsed);
    } catch (err) {
      console.error('분석 실패:', err);
      setSections([
        {
          title: '❌ 오류',
          content: '서버 연결 또는 GPT 분석 중 오류가 발생했습니다.\n관리자에게 문의하세요.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial', maxWidth: '900px', margin: 'auto' }}>
      <h1>🎓 Teachertype.ai</h1>
      <p>수업 발화 데이터를 입력하면 AI가 6단계 분석을 통해 수업 인사이트를 제공합니다.</p>

      <textarea
        rows="10"
        cols="80"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`예:
00:00 교사: 오늘은 동백꽃을 읽어볼 거야.
00:05 교사: 동백꽃이 예쁘긴 한데 의미가 뭘까?`}
        style={{
          width: '100%',
          padding: '1rem',
          fontSize: '1rem',
          marginBottom: '1rem',
          borderRadius: '8px',
          border: '1px solid #ccc',
        }}
      />
      <br />

      <button
        onClick={handleAnalyze}
        style={{
          padding: '0.7rem 1.5rem',
          fontSize: '1rem',
          borderRadius: '6px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
        }}
      >
        {loading ? '분석 중...' : '분석하기'}
      </button>

      {sections.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2>📊 분석 결과</h2>
          {sections.map((s, idx) => (
            <div
              key={idx}
              style={{
                background: '#f9f9f9',
                padding: '1rem',
                borderLeft: '5px solid #2196F3',
                marginBottom: '1rem',
                borderRadius: '6px',
              }}
            >
              <h4>{s.title}</h4>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{s.content}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;