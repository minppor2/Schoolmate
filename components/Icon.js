// Google Material Symbols 아이콘 (globals.css에서 웹폰트 로드).
// 사용: <Icon name="home" size={20} filled />
export default function Icon({ name, size = 20, filled = false, style }) {
  return (
    <span
      className="material-symbols-outlined"
      aria-hidden="true"
      style={{
        fontSize: size,
        ...(filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : null),
        ...style,
      }}
    >
      {name}
    </span>
  );
}
