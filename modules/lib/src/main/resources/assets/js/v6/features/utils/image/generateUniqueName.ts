export function generateUniqueName(imageSource: string): string {
    const imgFormatMatch = /image\/([a-z]+?);/i.exec(imageSource);
    const type = imgFormatMatch?.[1] ?? 'jpg';

    const date = new Date();
    const dateParts = [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
    ];

    const padNumber = (n: number): string => String(n).padStart(2, '0');

    return `image-${dateParts.map(padNumber).join('')}.${type}`;
}
