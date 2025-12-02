// Страница экспорта истории чатов
'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function ExportPage() {
  const [exportType, setExportType] = useState('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [chatIds, setChatIds] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleExport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await api.post('/api/export/history', {
        export_type: exportType,
        date_from: dateFrom || null,
        date_to: dateTo || null,
        chat_ids: chatIds ? chatIds.split(',').map(id => parseInt(id.trim())) : null,
      });
      setResult(response.data);
    } catch (error) {
      setResult({ error: 'Ошибка экспорта' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Экспорт истории чатов</h1>
      <form onSubmit={handleExport} style={{ marginTop: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Формат экспорта:</label>
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Дата начала:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Дата окончания:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>ID чатов (через запятую, необязательно):</label>
          <input
            type="text"
            value={chatIds}
            onChange={(e) => setChatIds(e.target.value)}
            placeholder="1, 2, 3"
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '0.75rem 1.5rem', background: '#0070f3', color: 'white', borderRadius: '4px' }}
        >
          {loading ? 'Экспорт...' : 'Экспортировать'}
        </button>
      </form>
      {result && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: result.error ? '#f8d7da' : '#d4edda', borderRadius: '4px' }}>
          {result.error ? (
            <p style={{ color: '#721c24' }}>{result.error}</p>
          ) : (
            <div>
              <p>Экспорт успешно выполнен!</p>
              <p>Файл: {result.export?.file_path}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

