// Утилита для доступа к Socket.IO из других модулей
let ioInstance = null;

module.exports = {
  setIO: (io) => {
    ioInstance = io;
    console.log('Socket.IO экземпляр установлен в утилиту');
  },
  getSocket: () => {
    if (!ioInstance) {
      console.warn('Socket.IO экземпляр еще не установлен');
    }
    return ioInstance;
  }
};
