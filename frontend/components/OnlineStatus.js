// Компонент индикатора онлайн статуса
'use client';

export default function OnlineStatus({ isOnline, size = 8 }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: isOnline ? '#28a745' : '#6c757d',
        border: '2px solid white',
        marginLeft: '0.5rem',
      }}
      title={isOnline ? 'Онлайн' : 'Оффлайн'}
    />
  );
}

