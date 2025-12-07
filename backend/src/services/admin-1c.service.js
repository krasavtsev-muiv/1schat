// Сервис для работы администратора с 1С (создание сущностей)
const oneCService = require('./1c-integration.service');
const Department = require('../models/department.model');
const Group = require('../models/group.model');
const Discipline = require('../models/discipline.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');

class Admin1CService {
  // Создание кафедры в 1С
  async createDepartment(departmentData) {
    try {
      const { name } = departmentData;

      if (!name) {
        throw new Error('Наименование кафедры обязательно');
      }

      // Отправляем данные в 1С
      const response = await oneCService.makeRequest('/Departments', {
        method: 'POST',
        data: {
          Наименование: name,
        },
      });

      if (!response.success) {
        throw new Error(response.error || 'Ошибка создания кафедры в 1С');
      }

      // Сохраняем копию в нашей БД
      const department = await Department.findOrCreate({
        name: name,
        sync_1c_code: response.Код?.toString() || null,
        description: null,
      });

      logger.info(`Кафедра "${name}" создана в 1С и сохранена в БД`);
      return {
        success: true,
        department,
        code: response.Код,
      };
    } catch (error) {
      logger.error('Ошибка создания кафедры в 1С:', error);
      throw error;
    }
  }

  // Создание группы в 1С
  async createGroup(groupData) {
    try {
      const { name, department } = groupData;

      if (!name || !department) {
        throw new Error('Наименование группы и кафедра обязательны');
      }

      // Отправляем данные в 1С
      const response = await oneCService.makeRequest('/Groups', {
        method: 'POST',
        data: {
          Наименование: name,
          Кафедра: department,
        },
      });

      if (!response.success) {
        throw new Error(response.error || 'Ошибка создания группы в 1С');
      }

      // Находим кафедру в нашей БД
      const departmentRecord = await Department.findByName(department);
      if (!departmentRecord) {
        throw new Error('Кафедра не найдена в нашей БД');
      }

      // Сохраняем копию в нашей БД
      const group = await Group.findOrCreate({
        name: name,
        department_id: departmentRecord.department_id,
        sync_1c_code: response.Код?.toString() || null,
        description: null,
      });

      logger.info(`Группа "${name}" создана в 1С и сохранена в БД`);
      return {
        success: true,
        group,
        code: response.Код,
      };
    } catch (error) {
      logger.error('Ошибка создания группы в 1С:', error);
      throw error;
    }
  }

  // Создание дисциплины в 1С
  async createDiscipline(disciplineData) {
    try {
      const { name, department } = disciplineData;

      if (!name || !department) {
        throw new Error('Наименование дисциплины и кафедра обязательны');
      }

      // Отправляем данные в 1С
      const response = await oneCService.makeRequest('/Disciplines', {
        method: 'POST',
        data: {
          Наименование: name,
          Кафедра: department,
        },
      });

      if (!response.success) {
        throw new Error(response.error || 'Ошибка создания дисциплины в 1С');
      }

      // Находим кафедру в нашей БД
      const departmentRecord = await Department.findByName(department);
      if (!departmentRecord) {
        throw new Error('Кафедра не найдена в нашей БД');
      }

      // Сохраняем копию в нашей БД
      const discipline = await Discipline.findOrCreate({
        name: name,
        department_id: departmentRecord.department_id,
        sync_1c_code: response.Код?.toString() || null,
        description: null,
      });

      logger.info(`Дисциплина "${name}" создана в 1С и сохранена в БД`);
      return {
        success: true,
        discipline,
        code: response.Код,
      };
    } catch (error) {
      logger.error('Ошибка создания дисциплины в 1С:', error);
      throw error;
    }
  }

  // Создание преподавателя в 1С
  async createTeacher(teacherData) {
    try {
      const { last_name, first_name, middle_name, discipline } = teacherData;

      if (!last_name || !first_name || !discipline) {
        throw new Error('Фамилия, имя и дисциплина обязательны');
      }

      // Отправляем данные в 1С
      const response = await oneCService.makeRequest('/Teachers', {
        method: 'POST',
        data: {
          Фамилия: last_name,
          Имя: first_name,
          Отчество: middle_name || null,
          Дисциплина: discipline,
        },
      });

      if (!response.success) {
        throw new Error(response.error || 'Ошибка создания преподавателя в 1С');
      }

      // Находим дисциплину в нашей БД
      const disciplineRecord = await Discipline.findByName(discipline);
      
      // Создаём запись преподавателя в нашей БД (без пароля, будет установлен при регистрации)
      const username = `${response.Код}@${last_name}`;
      let teacher = await User.findByUsername(username);
      
      if (!teacher) {
        const { hashPassword } = require('../utils/password.util');
        const tempPasswordHash = await hashPassword('temp_' + response.Код);
        
        teacher = await User.create({
          username,
          email: `${username}@temp.local`,
          password_hash: tempPasswordHash,
          first_name,
          last_name,
          middle_name: middle_name || null,
          role_id: 2, // manager
          sync_1c_id: response.Код?.toString(),
        });

        // Создаём связь преподаватель-дисциплина
        if (disciplineRecord) {
          const TeacherDiscipline = require('../models/teacher-discipline.model');
          await TeacherDiscipline.create(teacher.user_id, disciplineRecord.discipline_id);
        }
      }

      logger.info(`Преподаватель "${last_name} ${first_name}" создан в 1С и сохранён в БД`);
      return {
        success: true,
        teacher,
        code: response.Код,
      };
    } catch (error) {
      logger.error('Ошибка создания преподавателя в 1С:', error);
      throw error;
    }
  }

  // Создание студента в 1С
  async createStudent(studentData) {
    try {
      const { last_name, first_name, middle_name, department, group, disciplines } = studentData;

      if (!last_name || !first_name || !department) {
        throw new Error('Фамилия, имя и кафедра обязательны');
      }

      // Отправляем данные в 1С
      const response = await oneCService.makeRequest('/Students', {
        method: 'POST',
        data: {
          Фамилия: last_name,
          Имя: first_name,
          Отчество: middle_name || null,
          Кафедра: department,
          Группа: group || null,
          Дисциплины: disciplines || [],
        },
      });

      if (!response.success) {
        throw new Error(response.error || 'Ошибка создания студента в 1С');
      }

      // Создаём запись студента в нашей БД (без пароля, будет установлен при регистрации)
      const username = group ? `${group}@${last_name}` : `${response.Код}@${last_name}`;
      let student = await User.findByUsername(username);
      
      if (!student) {
        const { hashPassword } = require('../utils/password.util');
        const tempPasswordHash = await hashPassword('temp_' + response.Код);
        
        student = await User.create({
          username,
          email: `${username}@temp.local`,
          password_hash: tempPasswordHash,
          first_name,
          last_name,
          middle_name: middle_name || null,
          role_id: 3, // student
          department: department,
          student_group: group || null,
          sync_1c_id: response.Код?.toString(),
        });

        // Создаём связи студент-дисциплина
        if (disciplines && disciplines.length > 0) {
          const StudentDiscipline = require('../models/student-discipline.model');
          for (const disciplineName of disciplines) {
            const disciplineRecord = await Discipline.findByName(disciplineName);
            if (disciplineRecord) {
              await StudentDiscipline.create(student.user_id, disciplineRecord.discipline_id);
            }
          }
        }
      }

      logger.info(`Студент "${last_name} ${first_name}" создан в 1С и сохранён в БД`);
      return {
        success: true,
        student,
        code: response.Код,
      };
    } catch (error) {
      logger.error('Ошибка создания студента в 1С:', error);
      throw error;
    }
  }
}

module.exports = new Admin1CService();

