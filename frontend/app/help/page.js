// Страница помощи
export default function HelpPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Справка по системе</h1>
      <section style={{ marginTop: '2rem' }}>
        <h2>Как начать работу</h2>
        <ol>
          <li>Зарегистрируйтесь или войдите в систему</li>
          <li>Создайте новый чат или выберите существующий</li>
          <li>Начните общение!</li>
        </ol>
      </section>
      <section style={{ marginTop: '2rem' }}>
        <h2>Основные функции</h2>
        <ul>
          <li><strong>Отправка сообщений:</strong> Введите текст и нажмите Enter или кнопку "Отправить"</li>
          <li><strong>Создание групповых чатов:</strong> В меню чатов выберите "Создать группу"</li>
          <li><strong>Поиск сообщений:</strong> Используйте поиск в окне чата</li>
        </ul>
      </section>
      <section style={{ marginTop: '2rem' }}>
        <h2>Контакты поддержки</h2>
        <p>Если у вас возникли вопросы, обратитесь в службу поддержки:</p>
        <p>Email: support@university.ru</p>
      </section>
    </div>
  );
}

