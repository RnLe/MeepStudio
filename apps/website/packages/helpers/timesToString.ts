// timesToString.ts
// Small helper function to convert a date (float timestamp from time.time() from Python) to a string
// As of now:
// "X second ago", "X seconds ago", "X minute ago", "X minutes ago", etc.
// "X week ago", "X weeks ago", "X month ago", "X months ago", "X year ago", "X years ago"

// Helper function to handle singular/plural forms
const pluralize = (count: number, singular: string, plural: string = singular + 's'): string => {
  return count === 1 ? singular : plural;
};

export const agoTimeToString = (
  timestamp: number,
  compactUnderDay: boolean = false
): string => {
  const now = Date.now() / 1000; // Convert to seconds
  const diff = now - timestamp;

  // compact mode: any interval under 1 day
  if (compactUnderDay && diff < 86400) {
    return "less than a day ago";
  }

  if (diff < 60) {
    const seconds = Math.floor(diff);
    return `${seconds} ${pluralize(seconds, 'second')} ago`;
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} ${pluralize(minutes, 'minute')} ago`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} ${pluralize(hours, 'hour')} ago`;
  } else if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days} ${pluralize(days, 'day')} ago`;
  } else if (diff < 2419200) {
    const weeks = Math.floor(diff / 604800);
    return `${weeks} ${pluralize(weeks, 'week')} ago`;
  } else if (diff < 29030400) {
    const months = Math.floor(diff / 2419200);
    return `${months} ${pluralize(months, 'month')} ago`;
  } else {
    const years = Math.floor(diff / 29030400);
    return `${years} ${pluralize(years, 'year')} ago`;
  }
}

// Helper method to convert seconds to a string
// Format: "Xh Ym Zs" (e.g. "1h 2m 3s")
// If showDecimal is true, seconds are shown with one decimal point; otherwise, as an integer.
export const secondsToString = (seconds: number, showDecimal: boolean = false): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  let result = '';
  if (hours > 0) {
    result += `${hours}${pluralize(hours, 'h')} `;
  }
  if (minutes > 0) {
    result += `${minutes}${pluralize(minutes, 'm')} `;
  }
  
  const secsStr = showDecimal ? secs.toFixed(1) : `${Math.floor(secs)}`;
  const secsCount = showDecimal ? parseFloat(secsStr) : Math.floor(secs);
  result += `${secsStr}${pluralize(secsCount, 's')}`;

  return result.trim();
}
