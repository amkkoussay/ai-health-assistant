/* Style: الرمز يحتفظ بشكل بسيط ومتسع ليستعمل كعلامة هادئة لا كزخرفة تقنية. */
export default function Mark({ small = false }) {
  return (
    <span className={small ? "mark mark-small" : "mark"} aria-hidden="true">
      <svg viewBox="0 0 42 42" role="img">
        <path d="M8 22h7l3.4-7.2 5.1 15.7L27 22h7" />
        <path d="M21 36.5C12.2 30.9 7.6 25.1 7.6 17.8A8.1 8.1 0 0 1 21 11.5a8.1 8.1 0 0 1 13.4 6.3c0 7.3-4.6 13.1-13.4 18.7Z" />
      </svg>
    </span>
  );
}
