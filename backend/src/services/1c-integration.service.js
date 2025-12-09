// Сервис для интеграции с 1С:Предприятие
const axios = require('axios');
const logger = require('../utils/logger');

class OneCIntegrationService {
  constructor() {
    this.apiUrl = process.env.ONE_C_API_URL || 'http://localhost:3040/PD/hs/eis';
    this.maxRetries = 3;
    this.retryDelay = 10000; // 10 секунд
  }

  // Вспомогательный метод для ожидания
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Базовый метод для выполнения запросов к 1С с обработкой лимитов
  async makeRequest(endpoint, options = {}) {
    const { method = 'GET', data = null, params = null } = options;
    let retryCount = 0;

    while (retryCount < this.maxRetries) {
      try {
        const config = {
          method,
          url: `${this.apiUrl}${endpoint}`,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          timeout: 30000, // 30 секунд таймаут
        };

        if (data) {
          config.data = data;
        }

        if (params) {
          config.params = params;
        }

        logger.info(`Запрос к 1С: ${method} ${endpoint}`);
        const response = await axios(config);

        if (response.data && response.data.success === false) {
          throw new Error(response.data.error || 'Ошибка от 1С API');
        }

        return response.data;
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message || '';
        const errorString = errorMessage.toString();
        const statusCode = error.response?.status;
        const responseData = error.response?.data;
        
        // Проверяем текст ответа (может быть строка, объект или HTML)
        let responseText = '';
        if (typeof responseData === 'string') {
          responseText = responseData;
        } else if (responseData && typeof responseData === 'object') {
          responseText = JSON.stringify(responseData);
        }
        
        // Объединяем все возможные тексты ошибки для проверки
        const fullErrorText = `${errorString} ${responseText}`.toLowerCase();

        // Проверяем на ошибку лимита запросов
        // Учебная версия 1С возвращает статус 500 с текстом:
        // "Training version limitation reached\nInfobase connections limitation reached"
        const isLimitError = 
          statusCode === 500 && (
            fullErrorText.includes('training version limitation reached') ||
            fullErrorText.includes('infobase connections limitation reached') ||
            fullErrorText.includes('training version limitation') ||
            fullErrorText.includes('infobase connections limitation') ||
            fullErrorText.includes('limitation reached')
          );

        if (isLimitError) {
          retryCount++;
          if (retryCount < this.maxRetries) {
            logger.warn(
              `Лимит запросов к 1С достигнут (статус: ${statusCode}). Ожидание ${this.retryDelay / 1000} секунд... (попытка ${retryCount}/${this.maxRetries})`
            );
            await this.sleep(this.retryDelay);
            continue;
          } else {
            logger.error('Превышено максимальное количество попыток при ошибке лимита запросов');
            // Создаем специальную ошибку для фронтенда
            const limitError = new Error('LIMIT_REACHED');
            limitError.isLimitError = true;
            limitError.retryAfter = this.retryDelay / 1000;
            throw limitError;
          }
        }

        // Если это не ошибка лимита, логируем и пробрасываем дальше
        logger.error(`Ошибка запроса к 1С (${endpoint}):`, errorMessage || errorString);
        throw error;
      }
    }
  }

  // Получение списка групп (для формы регистрации)
  async getGroups() {
    try {
      const response = await this.makeRequest('/Groups');
      return response.data || [];
    } catch (error) {
      logger.error('Ошибка получения списка групп из 1С:', error);
      throw error;
    }
  }

  // Получение студента по коду
  async getStudentByCode(code) {
    try {
      if (!code) {
        throw new Error('Код студента не указан');
      }
      const response = await this.makeRequest(`/StudentsFull/${code}`);
      return response.data || null;
    } catch (error) {
      logger.error(`Ошибка получения студента по коду ${code} из 1С:`, error);
      throw error;
    }
  }

  // Получение преподавателя по коду
  async getTeacherByCode(code) {
    try {
      if (!code) {
        throw new Error('Код преподавателя не указан');
      }
      const response = await this.makeRequest(`/TeachersFull/${code}`);
      return response.data || null;
    } catch (error) {
      logger.error(`Ошибка получения преподавателя по коду ${code} из 1С:`, error);
      throw error;
    }
  }

  // Получение списка кафедр
  async getDepartments() {
    try {
      const response = await this.makeRequest('/Departments');
      return response.data || [];
    } catch (error) {
      logger.error('Ошибка получения списка кафедр из 1С:', error);
      throw error;
    }
  }

  // Получение списка дисциплин
  async getDisciplines() {
    try {
      const response = await this.makeRequest('/Disciplines');
      return response.data || [];
    } catch (error) {
      logger.error('Ошибка получения списка дисциплин из 1С:', error);
      throw error;
    }
  }

  // Получение списка преподавателей
  async getTeachers() {
    try {
      const response = await this.makeRequest('/Teachers');
      return response.data || [];
    } catch (error) {
      logger.error('Ошибка получения списка преподавателей из 1С:', error);
      throw error;
    }
  }

  // Получение списка студентов
  async getStudents() {
    try {
      const response = await this.makeRequest('/Students');
      return response.data || [];
    } catch (error) {
      logger.error('Ошибка получения списка студентов из 1С:', error);
      throw error;
    }
  }

  // Проверка подключения к 1С
  async checkConnection() {
    try {
      const response = await this.makeRequest('/Departments');
      return { connected: true, message: 'Подключение к 1С установлено' };
    } catch (error) {
      logger.error('Ошибка проверки подключения к 1С:', error);
      return {
        connected: false,
        error: error.message || 'Не удалось подключиться к 1С',
      };
    }
  }

  // Маппинг данных студента из 1С в формат локальной БД
  map1CStudentToLocalUser(student1C) {
    if (!student1C) {
      return null;
    }

    const username = student1C.Группа
      ? `${student1C.Группа}@${student1C.Фамилия}`
      : `${student1C.Код}@${student1C.Фамилия}`;

    return {
      sync_1c_id: student1C.Код?.toString(),
      username: username,
      last_name: student1C.Фамилия || '',
      first_name: student1C.Имя || '',
      middle_name: student1C.Отчество || null,
      department: student1C.Кафедра || null,
      student_group: student1C.Группа || null,
      role_id: 3, // student
      disciplines: student1C.Дисциплины || [],
    };
  }

  // Маппинг данных преподавателя из 1С в формат локальной БД
  map1CTeacherToLocalUser(teacher1C) {
    if (!teacher1C) {
      return null;
    }

    // Для преподавателя username формируется из кода и фамилии
    const username = `${teacher1C.Код}@${teacher1C.Фамилия}`;

    return {
      sync_1c_id: teacher1C.Код?.toString(),
      username: username,
      last_name: teacher1C.Фамилия || '',
      first_name: teacher1C.Имя || '',
      middle_name: teacher1C.Отчество || null,
      role_id: 2, // teacher (преподаватель)
      discipline: teacher1C.Дисциплина || null,
      students: teacher1C.Студенты || [],
    };
  }
}

module.exports = new OneCIntegrationService();
