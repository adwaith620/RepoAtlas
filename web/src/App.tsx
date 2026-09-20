import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Analysis from './pages/Analysis';

export default function App() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      <header className="p-4 flex justify-between items-center border-b dark:border-gray-800 bg-white dark:bg-gray-950">
        <a href="/" className="text-xl font-bold">Repo Explainer</a>
        <button onClick={toggleTheme} className="text-sm bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded">
          Toggle Theme
        </button>
      </header>
      <div className="flex-1 overflow-hidden flex flex-col">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/r/:owner/:repo/*" element={<Analysis />} />
        </Routes>
      </div>
    </div>
  );
}
