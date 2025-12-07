// Страница регистрации
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import Cookies from 'js-cookie';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 - выбор роли и код, 2 - ввод пароля
  const [role, setRole] = useState(''); // 'student' или 'teacher'
  const [code, setCode] = useState('');
  const [group, setGroup] = useState('');
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [checkingCode, setCheckingCode] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Загрузка групп при выборе роли "студент"
  useEffect(() => {
    if (role === 'student') {
      loadGroups();
    } else {
      setGroups([]);
      setGroup('');
    }
  }, [role]);

  const loadGroups = async () => {
    setLoadingGroups(true);
    setError('');
    try {
      const response = await authAPI.getGroups();
      if (response.data.success) {
        setGroups(response.data.data || []);
      }
    } catch (err) {
      console.error('Ошибка загрузки групп:', err);
      setError('Не удалось загрузить список групп');
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleCheckCode = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!code) {
      setError('Введите код из системы 1С');
      return;
    }

    if (role === 'student' && !group) {
      setError('Выберите группу');
      return;
    }

    setCheckingCode(true);
    try {
      const response = await authAPI.checkCode({
        code,
        role,
        group: role === 'student' ? group : undefined,
      });

      if (response.data.valid) {
        setUserInfo(response.data.data);
        setStep(2); // Переходим к вводу пароля
      } else {
        setError(response.data.error || 'Код не подтверждён');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при проверке кода');
    } finally {
      setCheckingCode(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!password || password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.register({
        code,
        role,
        password,
        group: role === 'student' ? group : undefined,
      });

      const { token, user } = response.data;
      Cookies.set('token', token, { expires: 7 });
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Регистрация</h1>
      
      {step === 1 ? (
        <form onSubmit={handleCheckCode} style={{ marginTop: '2rem' }}>
          {error && (
            <div style={{ 
              color: 'red', 
              marginBottom: '1rem', 
              padding: '0.75rem', 
              background: '#fee',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Выберите роль:
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={role === 'student'}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ marginRight: '0.5rem' }}
                />
                Студент
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="role"
                  value="teacher"
                  checked={role === 'teacher'}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ marginRight: '0.5rem' }}
                />
                Преподаватель
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Код из системы 1С:
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Введите ваш код"
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                marginTop: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          {role === 'student' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Группа:
              </label>
              {loadingGroups ? (
                <div style={{ padding: '0.75rem', color: '#666' }}>Загрузка групп...</div>
              ) : (
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    marginTop: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Выберите группу</option>
                  {groups.map((g) => (
                    <option key={g.Код || g.Наименование} value={g.Наименование}>
                      {g.Наименование} {g.Кафедра ? `(${g.Кафедра})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={checkingCode || !code || (role === 'student' && !group)}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              background: checkingCode ? '#ccc' : '#0070f3', 
              color: 'white', 
              borderRadius: '4px',
              border: 'none',
              fontSize: '1rem',
              cursor: checkingCode ? 'not-allowed' : 'pointer'
            }}
          >
            {checkingCode ? 'Проверка...' : 'Проверить код'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} style={{ marginTop: '2rem' }}>
          {error && (
            <div style={{ 
              color: 'red', 
              marginBottom: '1rem', 
              padding: '0.75rem', 
              background: '#fee',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}

          {userInfo && (
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1rem', 
              background: '#e8f5e9',
              borderRadius: '4px'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Подтверждённые данные:</p>
              <p style={{ margin: '0' }}>ФИО: {userInfo.name}</p>
              {userInfo.group && <p style={{ margin: '0.5rem 0 0 0' }}>Группа: {userInfo.group}</p>}
              {userInfo.department && <p style={{ margin: '0.5rem 0 0 0' }}>Кафедра: {userInfo.department}</p>}
              {userInfo.discipline && <p style={{ margin: '0.5rem 0 0 0' }}>Дисциплина: {userInfo.discipline}</p>}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Придумайте пароль:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              required
              minLength={6}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                marginTop: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setPassword('');
                setUserInfo(null);
                setError('');
              }}
              style={{ 
                flex: 1,
                padding: '0.75rem', 
                background: '#6c757d', 
                color: 'white', 
                borderRadius: '4px',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Назад
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              style={{ 
                flex: 2,
                padding: '0.75rem', 
                background: loading ? '#ccc' : '#28a745', 
                color: 'white', 
                borderRadius: '4px',
                border: 'none',
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
