

export function timeStampToDateTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    };
    return date.toLocaleString('en-US', options);
}

export function isDeadlinePassed(timestamp: number): boolean {
    return timestamp < Math.floor(Date.now() / 1000);
}


