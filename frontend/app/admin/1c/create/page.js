// Страница создания сущностей в 1С (админка)
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function Admin1CCreatePage() {
  const [activeTab, setActiveTab] = useState('department');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Формы данных
  const [departmentForm, setDepartmentForm] = useState({ name: '' });
  const [groupForm, setGroupForm] = useState({ name: '', department: '' });
  const [disciplineForm, setDisciplineForm] = useState({ name: '', department: '' });
  const [teacherForm, setTeacherForm] = useState({ 
    last_name: '', 
    first_name: '', 
    middle_name: '', 
    discipline: '' 
  });
  const [studentForm, setStudentForm] = useState({ 
    last_name: '', 
    first_name: '', 
    middle_name: '', 
    department: '', 
    group: '', 
    disciplines: [] 
  });

  // Загрузка списка кафедр для форм
  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await api.get('/api/1c/departments');
      if (response.data.success) {
        setDepartments(response.data.data || []);
      }
    } catch (err) {
      console.error('Ошибка загрузки кафедр:', err);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/api/admin/1c/departments', departmentForm);
      if (response.data.success) {
        setSuccess(`Кафедра "${departmentForm.name}" успешно создана в 1С`);
        setDepartmentForm({ name: '' });
        await loadDepartments();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания кафедры');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/api/admin/1c/groups', groupForm);
      if (response.data.success) {
        setSuccess(`Группа "${groupForm.name}" успешно создана в 1С`);
        setGroupForm({ name: '', department: '' });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания группы');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscipline = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/api/admin/1c/disciplines', disciplineForm);
      if (response.data.success) {
        setSuccess(`Дисциплина "${disciplineForm.name}" успешно создана в 1С`);
        setDisciplineForm({ name: '', department: '' });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания дисциплины');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/api/admin/1c/teachers', teacherForm);
      if (response.data.success) {
        setSuccess(`Преподаватель "${teacherForm.last_name} ${teacherForm.first_name}" успешно создан в 1С`);
        setTeacherForm({ last_name: '', first_name: '', middle_name: '', discipline: '' });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания преподавателя');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/api/admin/1c/students', studentForm);
      if (response.data.success) {
        setSuccess(`Студент "${studentForm.last_name} ${studentForm.first_name}" успешно создан в 1С`);
        setStudentForm({ 
          last_name: '', 
          first_name: '', 
          middle_name: '', 
          department: '', 
          group: '', 
          disciplines: [] 
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания студента');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'department', label: 'Кафедра' },
    { id: 'group', label: 'Группа' },
    { id: 'discipline', label: 'Дисциплина' },
    { id: 'teacher', label: 'Преподаватель' },
    { id: 'student', label: 'Студент' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Создание сущностей в 1С</h1>

      {success && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: '#d4edda', 
          borderRadius: '4px',
          color: '#155724',
          border: '1px solid #c3e6cb'
        }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: '#f8d7da', 
          borderRadius: '4px',
          color: '#721c24',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: '2rem', borderBottom: '2px solid #dee2e6' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setError('');
                setSuccess('');
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: activeTab === tab.id ? '#0070f3' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#0070f3',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #0070f3' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        {activeTab === 'department' && (
          <form onSubmit={handleCreateDepartment}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Наименование кафедры: *
              </label>
              <input
                type="text"
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ 
                padding: '0.75rem 1.5rem', 
                background: loading ? '#ccc' : '#28a745', 
                color: 'white', 
                borderRadius: '4px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Создание...' : 'Создать кафедру'}
            </button>
          </form>
        )}

        {activeTab === 'group' && (
          <form onSubmit={handleCreateGroup}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Наименование группы: *
              </label>
              <input
                type="text"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Кафедра: *
              </label>
              <select
                value={groupForm.department}
                onChange={(e) => setGroupForm({ ...groupForm, department: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">Выберите кафедру</option>
                {departments.map((d) => (
                  <option key={d.Код || d.Наименование} value={d.Наименование}>
                    {d.Наименование}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ 
                padding: '0.75rem 1.5rem', 
                background: loading ? '#ccc' : '#28a745', 
                color: 'white', 
                borderRadius: '4px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Создание...' : 'Создать группу'}
            </button>
          </form>
        )}

        {activeTab === 'discipline' && (
          <form onSubmit={handleCreateDiscipline}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Наименование дисциплины: *
              </label>
              <input
                type="text"
                value={disciplineForm.name}
                onChange={(e) => setDisciplineForm({ ...disciplineForm, name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Кафедра: *
              </label>
              <select
                value={disciplineForm.department}
                onChange={(e) => setDisciplineForm({ ...disciplineForm, department: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">Выберите кафедру</option>
                {departments.map((d) => (
                  <option key={d.Код || d.Наименование} value={d.Наименование}>
                    {d.Наименование}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ 
                padding: '0.75rem 1.5rem', 
                background: loading ? '#ccc' : '#28a745', 
                color: 'white', 
                borderRadius: '4px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Создание...' : 'Создать дисциплину'}
            </button>
          </form>
        )}

        {activeTab === 'teacher' && (
          <form onSubmit={handleCreateTeacher}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Фамилия: *
              </label>
              <input
                type="text"
                value={teacherForm.last_name}
                onChange={(e) => setTeacherForm({ ...teacherForm, last_name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Имя: *
              </label>
              <input
                type="text"
                value={teacherForm.first_name}
                onChange={(e) => setTeacherForm({ ...teacherForm, first_name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Отчество:
              </label>
              <input
                type="text"
                value={teacherForm.middle_name}
                onChange={(e) => setTeacherForm({ ...teacherForm, middle_name: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Дисциплина: *
              </label>
              <input
                type="text"
                value={teacherForm.discipline}
                onChange={(e) => setTeacherForm({ ...teacherForm, discipline: e.target.value })}
                placeholder="Введите наименование дисциплины"
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ 
                padding: '0.75rem 1.5rem', 
                background: loading ? '#ccc' : '#28a745', 
                color: 'white', 
                borderRadius: '4px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Создание...' : 'Создать преподавателя'}
            </button>
          </form>
        )}

        {activeTab === 'student' && (
          <form onSubmit={handleCreateStudent}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Фамилия: *
              </label>
              <input
                type="text"
                value={studentForm.last_name}
                onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Имя: *
              </label>
              <input
                type="text"
                value={studentForm.first_name}
                onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Отчество:
              </label>
              <input
                type="text"
                value={studentForm.middle_name}
                onChange={(e) => setStudentForm({ ...studentForm, middle_name: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Кафедра: *
              </label>
              <select
                value={studentForm.department}
                onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">Выберите кафедру</option>
                {departments.map((d) => (
                  <option key={d.Код || d.Наименование} value={d.Наименование}>
                    {d.Наименование}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Группа:
              </label>
              <input
                type="text"
                value={studentForm.group}
                onChange={(e) => setStudentForm({ ...studentForm, group: e.target.value })}
                placeholder="Например: ИТ-21"
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Дисциплины (через запятую):
              </label>
              <input
                type="text"
                placeholder="Например: Основы программирования, Базы данных"
                onChange={(e) => {
                  const disciplines = e.target.value.split(',').map(d => d.trim()).filter(d => d);
                  setStudentForm({ ...studentForm, disciplines });
                }}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ 
                padding: '0.75rem 1.5rem', 
                background: loading ? '#ccc' : '#28a745', 
                color: 'white', 
                borderRadius: '4px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Создание...' : 'Создать студента'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

