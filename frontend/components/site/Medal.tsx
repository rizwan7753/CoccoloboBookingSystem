/** Round icon or photo badge used on tiles, dishes, chairs and events. */
export default function Medal({
  icon,
  photo,
  alt = "",
  size,
  className = "",
}: {
  icon?: string;
  photo?: string | null;
  alt?: string;
  size?: string;
  className?: string;
}) {
  const style = size ? ({ "--medal": size } as React.CSSProperties) : undefined;

  if (photo) {
    return (
      <span className={`medal medal--photo ${className}`} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={alt} loading="lazy" decoding="async" />
      </span>
    );
  }

  return (
    <span className={`medal ${className}`} style={style}>
      {icon && (
        <svg className="medal-art" viewBox="0 0 100 100" aria-hidden="true">
          <use href={`#${icon}`} />
        </svg>
      )}
    </span>
  );
}
