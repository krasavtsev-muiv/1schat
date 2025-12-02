// Компонент подвала сайта
export default function Footer() {
  return (
    <footer style={{ background: '#343a40', color: 'white', padding: '2rem', marginTop: 'auto' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <p>&copy; 2025 Веб-сервис чата. Все права защищены.</p>
        <p style={{ marginTop: '1rem' }}>
          Автор: <strong>Красавцев Сергей Сергеевич</strong>
        </p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.9em' }}>
          Email: 70161070@online.muiv.ru
        </p>
      </div>
    </footer>
  );
}

