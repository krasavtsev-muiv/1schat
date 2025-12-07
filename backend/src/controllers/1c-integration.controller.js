// Контроллер для интеграции с 1С
const oneCService = require('../services/1c-integration.service');
const logger = require('../utils/logger');

// Проверка подключения к 1С
const checkConnection = async (req, res) => {
  try {
    const result = await oneCService.checkConnection();
    res.json(result);
  } catch (error) {
    logger.error('Ошибка проверки подключения к 1С:', error);
    res.status(500).json({ error: 'Ошибка при проверке подключения' });
  }
};

// Получение списка кафедр
const getDepartments = async (req, res) => {
  try {
    const departments = await oneCService.getDepartments();
    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    logger.error('Ошибка получения кафедр из 1С:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при получении кафедр',
    });
  }
};

// Получение списка групп
const getGroups = async (req, res) => {
  try {
    const groups = await oneCService.getGroups();
    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    logger.error('Ошибка получения групп из 1С:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при получении групп',
    });
  }
};

// Получение списка дисциплин
const getDisciplines = async (req, res) => {
  try {
    const disciplines = await oneCService.getDisciplines();
    res.json({
      success: true,
      data: disciplines,
    });
  } catch (error) {
    logger.error('Ошибка получения дисциплин из 1С:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при получении дисциплин',
    });
  }
};

// Получение списка преподавателей
const getTeachers = async (req, res) => {
  try {
    const teachers = await oneCService.getTeachers();
    res.json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    logger.error('Ошибка получения преподавателей из 1С:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при получении преподавателей',
    });
  }
};

// Получение списка студентов
const getStudents = async (req, res) => {
  try {
    const students = await oneCService.getStudents();
    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    logger.error('Ошибка получения студентов из 1С:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при получении студентов',
    });
  }
};

module.exports = {
  checkConnection,
  getDepartments,
  getGroups,
  getDisciplines,
  getTeachers,
  getStudents,
};
