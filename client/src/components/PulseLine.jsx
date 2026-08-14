/* Style: خط النبض هو الخيط البصري المتكرر في «عيادة هادئة»، رفيع وواضح من دون توهج. */
export default function PulseLine({ className = "" }) {
  return (
    <svg className={`pulse-line ${className}`} viewBox="0 0 150 36" aria-hidden="true">
      <path d="M2 19h28l8-14 13 27 11-20h20l7-8 8 15 8-10h43" />
    </svg>
  );
}
