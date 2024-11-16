export function timeStamp (): string  {
    const date = new Date();
    const format = (num: number) => num.toString().padStart(2, '0');
    
    const day = format(date.getDate());
    const month = format(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = format(date.getHours());
    const minutes = format(date.getMinutes());
    const seconds = format(date.getSeconds());

    // Return in mm/dd/yyyy hh:mm:ss format
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
};
