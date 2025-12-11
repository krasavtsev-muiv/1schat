// Страница управления обращениями обратной связи (админка)
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

const STATUS_LABELS = {
  new: 'Новое',
  in_progress: 'В работе',
  resolved: 'Решено',
  closed: 'Закрыто'
};

const STATUS_COLORS = {
  new: '#007bff',
  in_progress: '#ffc107',
  resolved: '#28a745',
  closed: '#6c757d'
};

export default function AdminFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [responseText, setResponseText] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, [filterStatus]);

  const loadFeedback = async () => {
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const response = await api.get('/api/feedback', { params });
      setFeedbackList(response.data.feedback);
    } catch (error) {
      console.error('Ошибка загрузки обращений:', error);
      if (error.response?.status === 403) {
        alert('У вас нет прав для просмотра обращений');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (feedbackId, newStatus) => {
    try {
      setUpdating(true);
      await api.put(`/api/feedback/${feedbackId}/status`, { status: newStatus });
      loadFeedback();
      if (selectedFeedback?.feedback_id === feedbackId) {
        setSelectedFeedback({ ...selectedFeedback, status: newStatus });
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      alert('Ошибка обновления статуса');
    } finally {
      setUpdating(false);
    }
  };

  const submitResponse = async (feedbackId) => {
    if (!responseText.trim()) {
      alert('Введите текст ответа');
      return;
    }

    try {
      setUpdating(true);
      await api.put(`/api/feedback/${feedbackId}/respond`, {
        admin_response: responseText,
        status: 'resolved'
      });
      setResponseText('');
      setSelectedFeedback(null);
      loadFeedback();
    } catch (error) {
      console.error('Ошибка отправки ответа:', error);
      alert('Ошибка отправки ответа');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hours: '2-digit',
      minutes: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Загрузка...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Обращения обратной связи</h1>

      {/* Фильтр по статусу */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ marginRight: '1rem', fontWeight: '500' }}>Фильтр по статусу:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #dee2e6',
            fontSize: '1rem'
          }}
        >
          <option value="">Все</option>
          <option value="new">Новые</option>
          <option value="in_progress">В работе</option>
          <option value="resolved">Решенные</option>
          <option value="closed">Закрытые</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Список обращений */}
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Список обращений ({feedbackList.length})</h2>
          <div style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px' }}>
            {feedbackList.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
                Обращений не найдено
              </div>
            ) : (
              feedbackList.map((feedback) => (
                <div
                  key={feedback.feedback_id}
                  onClick={() => setSelectedFeedback(feedback)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #dee2e6',
                    cursor: 'pointer',
                    background: selectedFeedback?.feedback_id === feedback.feedback_id ? '#e7f3ff' : 'white',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedFeedback?.feedback_id !== feedback.feedback_id) {
                      e.currentTarget.style.background = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedFeedback?.feedback_id !== feedback.feedback_id) {
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                        {feedback.subject}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                        {feedback.name} ({feedback.email})
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                        {formatDate(feedback.created_at)}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        background: STATUS_COLORS[feedback.status] + '20',
                        color: STATUS_COLORS[feedback.status],
                        whiteSpace: 'nowrap',
                        marginLeft: '1rem'
                      }}
                    >
                      {STATUS_LABELS[feedback.status]}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.9rem',
                      color: '#495057',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {feedback.message}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Детали обращения */}
        <div>
          {selectedFeedback ? (
            <div>
              <h2 style={{ marginBottom: '1rem' }}>Детали обращения</h2>
              <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '4px', marginBottom: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Тема:</strong>
                  <div style={{ marginTop: '0.25rem' }}>{selectedFeedback.subject}</div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <strong>От:</strong>
                  <div style={{ marginTop: '0.25rem' }}>
                    {selectedFeedback.name} ({selectedFeedback.email})
                  </div>
                  {selectedFeedback.user_id && (
                    <div style={{ fontSize: '0.9rem', color: '#6c757d', marginTop: '0.25rem' }}>
                      Пользователь: {selectedFeedback.first_name} {selectedFeedback.last_name}
                      {selectedFeedback.username && ` (@${selectedFeedback.username})`}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <strong>Дата создания:</strong>
                  <div style={{ marginTop: '0.25rem' }}>{formatDate(selectedFeedback.created_at)}</div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <strong>Статус:</strong>
                  <div style={{ marginTop: '0.5rem' }}>
                    <select
                      value={selectedFeedback.status}
                      onChange={(e) => updateStatus(selectedFeedback.feedback_id, e.target.value)}
                      disabled={updating}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #dee2e6',
                        fontSize: '1rem',
                        background: 'white'
                      }}
                    >
                      <option value="new">Новое</option>
                      <option value="in_progress">В работе</option>
                      <option value="resolved">Решено</option>
                      <option value="closed">Закрыто</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <strong>Сообщение:</strong>
                  <div
                    style={{
                      marginTop: '0.5rem',
                      padding: '1rem',
                      background: 'white',
                      borderRadius: '4px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {selectedFeedback.message}
                  </div>
                </div>

                {selectedFeedback.admin_response && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Ответ администратора:</strong>
                    <div
                      style={{
                        marginTop: '0.5rem',
                        padding: '1rem',
                        background: '#e7f3ff',
                        borderRadius: '4px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {selectedFeedback.admin_response}
                    </div>
                    {selectedFeedback.responded_at && (
                      <div style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: '0.25rem' }}>
                        Ответ дан: {formatDate(selectedFeedback.responded_at)}
                        {selectedFeedback.responder_first_name && (
                          <span> ({selectedFeedback.responder_first_name} {selectedFeedback.responder_last_name})</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!selectedFeedback.admin_response && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <strong>Ответить на обращение:</strong>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Введите ответ..."
                      rows={5}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginTop: '0.5rem',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                    <button
                      onClick={() => submitResponse(selectedFeedback.feedback_id)}
                      disabled={updating || !responseText.trim()}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem 1.5rem',
                        background: updating || !responseText.trim() ? '#6c757d' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: updating || !responseText.trim() ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        fontWeight: '500'
                      }}
                    >
                      {updating ? 'Отправка...' : 'Отправить ответ'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
              Выберите обращение из списка для просмотра деталей
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
