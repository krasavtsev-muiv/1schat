// Контроллер для работы администратора с 1С
const admin1CService = require('../services/admin-1c.service');
const logger = require('../utils/logger');

// Создание кафедры в 1С
const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Наименование кафедры обязательно',
      });
    }

    const result = await admin1CService.createDepartment({ name });
    res.status(201).json({
      success: true,
      message: 'Кафедра успешно создана в 1С',
      data: result,
    });
  } catch (error) {
    logger.error('Ошибка создания кафедры:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при создании кафедры',
    });
  }
};

// Создание группы в 1С
const createGroup = async (req, res) => {
  try {
    const { name, department } = req.body;

    if (!name || !department) {
      return res.status(400).json({
        success: false,
        error: 'Наименование группы и кафедра обязательны',
      });
    }

    const result = await admin1CService.createGroup({ name, department });
    res.status(201).json({
      success: true,
      message: 'Группа успешно создана в 1С',
      data: result,
    });
  } catch (error) {
    logger.error('Ошибка создания группы:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при создании группы',
    });
  }
};

// Создание дисциплины в 1С
const createDiscipline = async (req, res) => {
  try {
    const { name, department } = req.body;

    if (!name || !department) {
      return res.status(400).json({
        success: false,
        error: 'Наименование дисциплины и кафедра обязательны',
      });
    }

    const result = await admin1CService.createDiscipline({ name, department });
    res.status(201).json({
      success: true,
      message: 'Дисциплина успешно создана в 1С',
      data: result,
    });
  } catch (error) {
    logger.error('Ошибка создания дисциплины:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при создании дисциплины',
    });
  }
};

// Создание преподавателя в 1С
const createTeacher = async (req, res) => {
  try {
    const { last_name, first_name, middle_name, discipline } = req.body;

    if (!last_name || !first_name || !discipline) {
      return res.status(400).json({
        success: false,
        error: 'Фамилия, имя и дисциплина обязательны',
      });
    }

    const result = await admin1CService.createTeacher({
      last_name,
      first_name,
      middle_name,
      discipline,
    });
    res.status(201).json({
      success: true,
      message: 'Преподаватель успешно создан в 1С',
      data: result,
    });
  } catch (error) {
    logger.error('Ошибка создания преподавателя:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при создании преподавателя',
    });
  }
};

// Создание студента в 1С
const createStudent = async (req, res) => {
  try {
    const { last_name, first_name, middle_name, department, group, disciplines } = req.body;

    if (!last_name || !first_name || !department) {
      return res.status(400).json({
        success: false,
        error: 'Фамилия, имя и кафедра обязательны',
      });
    }

    const result = await admin1CService.createStudent({
      last_name,
      first_name,
      middle_name,
      department,
      group,
      disciplines: disciplines || [],
    });
    res.status(201).json({
      success: true,
      message: 'Студент успешно создан в 1С',
      data: result,
    });
  } catch (error) {
    logger.error('Ошибка создания студента:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при создании студента',
    });
  }
};

module.exports = {
  createDepartment,
  createGroup,
  createDiscipline,
  createTeacher,
  createStudent,
};

