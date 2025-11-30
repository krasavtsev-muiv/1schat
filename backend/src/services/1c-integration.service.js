// Сервис для интеграции с 1С:Предприятие
const axios = require('axios');
const User = require('../models/user.model');
const { query } = require('../../config/database');

class OneCIntegrationService {
  constructor() {
    this.apiUrl = process.env.ONE_C_API_URL || 'http://localhost:8080/api';
    this.apiKey = process.env.ONE_C_API_KEY || '';
  }

  // Получение заголовков для запросов к 1С
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  // Синхронизация пользователей из 1С
  async syncUsers() {
    try {
      const response = await axios.get(`${this.apiUrl}/users`, {
        headers: this.getHeaders(),
      });

      const usersFrom1C = response.data.users || [];
      let synced = 0;
      let created = 0;
      let updated = 0;

      for (const user1C of usersFrom1C) {
        try {
          // Поиск пользователя по sync_1c_id
          let existingUser = null;
          if (user1C.id) {
            const result = await query(
              'SELECT * FROM users WHERE sync_1c_id = $1',
              [user1C.id.toString()]
            );
            existingUser = result.rows[0];
          }

          // Определение роли по данным из 1С
          let roleId = 3; // По умолчанию студент
          if (user1C.role === 'admin' || user1C.role === 'Администратор') {
            roleId = 1;
          } else if (user1C.role === 'manager' || user1C.role === 'Преподаватель') {
            roleId = 2;
          }

          const userData = {
            username: user1C.username || user1C.email,
            email: user1C.email,
            first_name: user1C.firstName || user1C.first_name,
            last_name: user1C.lastName || user1C.last_name,
            middle_name: user1C.middleName || user1C.middle_name,
            phone: user1C.phone,
            role_id: roleId,
            faculty: user1C.faculty,
            department: user1C.department,
            position: user1C.position,
            student_group: user1C.studentGroup || user1C.student_group,
            sync_1c_id: user1C.id?.toString(),
            sync_1c_date: new Date(),
          };

          if (existingUser) {
            // Обновление существующего пользователя
            await User.update(existingUser.user_id, userData);
            updated++;
          } else {
            // Создание нового пользователя (без пароля, нужно будет установить при первом входе)
            const tempPassword = Math.random().toString(36).slice(-8);
            const bcrypt = require('bcrypt');
            userData.password_hash = await bcrypt.hash(tempPassword, 10);
            await User.create(userData);
            created++;
          }
          synced++;
        } catch (error) {
          console.error(`Ошибка синхронизации пользователя ${user1C.id}:`, error);
        }
      }

      return {
        success: true,
        synced,
        created,
        updated,
      };
    } catch (error) {
      console.error('Ошибка синхронизации пользователей из 1С:', error);
      throw error;
    }
  }

  // Отправка данных в 1С
  async sendDataTo1C(endpoint, data) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${endpoint}`,
        data,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Ошибка отправки данных в 1С (${endpoint}):`, error);
      throw error;
    }
  }

  // Проверка подключения к 1С
  async checkConnection() {
    try {
      const response = await axios.get(`${this.apiUrl}/health`, {
        headers: this.getHeaders(),
        timeout: 5000,
      });
      return { connected: true, response: response.data };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
}

module.exports = new OneCIntegrationService();

