// Страница контактов
export default function ContactsPage() {
  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Контакты</h1>
      <p>
        Если у вас возникли вопросы или проблемы с использованием системы, 
        пожалуйста, свяжитесь с нами:
      </p>
      <div style={{ marginTop: '2rem' }}>
        <p><strong>Email:</strong> support@university.ru</p>
        <p><strong>Телефон:</strong> +7 (495) 123-45-67</p>
        <p><strong>Адрес:</strong> Москва, ул. Примерная, д. 1</p>
      </div>
      <p style={{ marginTop: '2rem' }}>
        Вы также можете использовать форму обратной связи для отправки сообщения.
      </p>
    </div>
  );
}

