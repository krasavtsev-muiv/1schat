// Утилита для логирования
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const getLogFileName = () => {
  const date = new Date();
  return `app-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.log`;
};

const formatLogMessage = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (data) {
    logMessage += ` ${JSON.stringify(data)}`;
  }
  return logMessage;
};

const writeLog = (level, message, data = null) => {
  const logMessage = formatLogMessage(level, message, data);
  const logFile = path.join(logDir, getLogFileName());

  // Вывод в консоль
  console.log(logMessage);

  // Запись в файл
  fs.appendFileSync(logFile, logMessage + '\n', 'utf8');
};

const logger = {
  info: (message, data) => writeLog('info', message, data),
  error: (message, data) => writeLog('error', message, data),
  warn: (message, data) => writeLog('warn', message, data),
  debug: (message, data) => writeLog('debug', message, data),
};

module.exports = logger;

