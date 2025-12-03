// Компонент аватара пользователя
'use client';

export default function UserAvatar({ user, size = 40 }) {
  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : '?';

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: user?.avatar_url ? `url(${user.avatar_url})` : '#0070f3',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: `${size * 0.4}px`,
      }}
    >
      {!user?.avatar_url && initials}
    </div>
  );
}

