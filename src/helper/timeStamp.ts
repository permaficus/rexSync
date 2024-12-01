export function timeStamp(): string {
  const date = new Date();

  // Format date and time using the machine's locale
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // Optional: Use 24-hour format
  };

  // Use locale
  const formattedDate = new Intl.DateTimeFormat(undefined, options).format(date);
  return formattedDate.replace(',', '').trim();
}