const TrashIcon = () => (
 <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path
   d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"
   stroke="currentColor"
   strokeWidth="1.7"
   strokeLinecap="round"
   strokeLinejoin="round"
  />
 </svg>
)

const IconDeleteButton = ({ title = "Delete", onClick, className = "" }) => (
 <button
  type="button"
  title={title}
  aria-label={title}
  onClick={onClick}
  className={`icon-delete-btn ${className}`.trim()}
 >
  <TrashIcon />
 </button>
)

export default IconDeleteButton
