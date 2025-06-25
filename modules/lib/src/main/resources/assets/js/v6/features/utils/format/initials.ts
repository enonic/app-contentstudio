export function getInitials(name: string): string {
    const initials = name.split(' ').map((word) => word.substring(0, 1).toUpperCase());

    return initials.length >= 2 ? initials.join('').substring(0, 2) : name.substring(0, 2).toUpperCase();
}
