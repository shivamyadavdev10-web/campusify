/**
 * Formats ISO Date to a readable string (e.g., "12 Jun 2026")
 */
export const formatDate = (isoString: string | null | undefined): string => {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return "Invalid Date";
  }
};

/**
 * Converts total minutes into a human-readable duration (e.g., "1h 30m" or "45m")
 */
export const formatDuration = (totalMinutes: number | string | null | undefined): string => {
  const mins = Number(totalMinutes);
  if (isNaN(mins) || mins === 0) return "N/A";
  
  const hours = Math.floor(mins / 60);
  const minutes = Math.floor(mins % 60);
  
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
};

/**
 * Extracts initials for Avatars (e.g., "Rahul Sharma" -> "RS")
 */
export const getInitials = (firstName: string = "", lastName: string = ""): string => {
  const first = firstName.trim().charAt(0).toUpperCase();
  const last = lastName.trim().charAt(0).toUpperCase();
  const initials = `${first}${last}`;
  
  return initials.length > 0 ? initials : "🎓"; 
};

/**
 * Debounce function to prevent rapid multiple clicks or keystrokes
 */
export const debounce = <T extends (...args: any[]) => void>(func: T, delay = 500) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};