import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) navigate(`/r/${parts[0]}/${parts[1]}`);
    } catch {}
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <h1 className="text-4xl font-extrabold mb-4">Interactive Repo Explainer</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg text-center">
        Paste a GitHub URL to automatically analyze its architecture, trace dependencies, and get an onboarding guide powered by AI.
      </p>
      
      <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-lg mb-8">
        <input 
          type="url" required value={url} onChange={e => setUrl(e.target.value)} 
          placeholder="https://github.com/expressjs/express" 
          className="flex-1 p-3 border dark:border-gray-700 rounded bg-white dark:bg-gray-800" 
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 font-medium">Analyze</button>
      </form>

      <div className="flex gap-4">
        <span>Try an example:</span>
        <button onClick={() => navigate('/r/expressjs/express')} className="text-blue-500 hover:underline">expressjs/express</button>
        <button onClick={() => navigate('/r/mde/ejs')} className="text-blue-500 hover:underline">mde/ejs</button>
      </div>
    </div>
  );
}
