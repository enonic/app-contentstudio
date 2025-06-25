const padNumber = (n: number): string => String(n).padStart(2, '0');

const randomSuffix = (): string => Math.random().toString(36).slice(2, 8);

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

    return `image-${dateParts.map(padNumber).join('')}${randomSuffix()}.${type}`;
}
