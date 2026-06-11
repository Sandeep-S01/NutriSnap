type NutriSnapLogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
};

export function NutriSnapLogo({
  className = "",
  markClassName = "size-10",
  showWordmark = true,
}: NutriSnapLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        className={markClassName}
        viewBox="0 0 64 64"
        fill="none"
        role="img"
        aria-label="NutriSnap"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="64" height="64" rx="16" fill="#F8FAFC" />
        <path
          d="M13 42V26.5C13 22.9 15.9 20 19.5 20H25.5L28.4 14.8C29.1 13.7 30.3 13 31.6 13H41.2C42.5 13 43.7 13.7 44.4 14.8L47.2 20H50C53.6 20 56.5 22.9 56.5 26.5V42"
          stroke="#15803D"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13 42V45.5C13 49.1 15.9 52 19.5 52H22"
          stroke="#15803D"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M47.5 52H50C53.6 52 56.5 49.1 56.5 45.5V42"
          stroke="#15803D"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="35" cy="36" r="16" fill="#F8FAFC" stroke="#15803D" strokeWidth="4" />
        <path
          d="M31.8 37.8C31.8 29.8 37.1 24 45.2 22.5C46.1 31 40.7 38 32.9 40.2"
          fill="#22C55E"
        />
        <path
          d="M24.5 47.2C25.2 40.4 30.7 35.1 37.4 34.2C38.2 41.3 33.7 47.2 26.4 49.2"
          fill="#FB923C"
        />
        <path
          d="M27.8 47.6L36.2 38.8"
          stroke="#FFF7ED"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M34.8 45.8L30.8 42.4"
          stroke="#FFF7ED"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M37 41.8L32.8 39"
          stroke="#FFF7ED"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path d="M30 38.6C33 32.8 37 29.2 42.4 25.8" stroke="#F8FAFC" strokeWidth="2.3" strokeLinecap="round" />
        <circle cx="51" cy="26" r="3" fill="#22C55E" />
      </svg>
      {showWordmark ? (
        <span className="text-base font-semibold tracking-normal text-slate-950">
          NutriSnap
        </span>
      ) : null}
    </span>
  );
}
