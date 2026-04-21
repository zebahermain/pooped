/**
 * DoctorLinkSmall
 *
 * Compact, inline variant of the "Find a doctor near me" link.
 * Used inside small alert cards (e.g. the 2-day and 3+-day no-movement
 * cards on Home) where the full DoctorCard would be too heavy.
 *
 * Keeping this as a shared component ensures the copy, icon, target and
 * styling stay visually consistent across every surface it appears on.
 */

type DoctorLinkSmallProps = {
  /** Override the default link label. */
  label?: string;
  /** Extra classes appended to the anchor (e.g. spacing overrides). */
  className?: string;
};

const DOCTOR_SEARCH_URL =
  "https://www.google.com/maps/search/gastroenterologist+near+me";

export const DoctorLinkSmall = ({
  label = "Find a doctor near me",
  className = "",
}: DoctorLinkSmallProps) => {
  return (
    <a
      href={DOCTOR_SEARCH_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline ${className}`}
      data-testid="doctor-link-small"
    >
      <span aria-hidden="true">🩺</span>
      <span>{label}</span>
      <span aria-hidden="true">→</span>
    </a>
  );
};

export default DoctorLinkSmall;
