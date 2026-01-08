type WithId = { id: string } | { getId: () => string };

export function findById<T extends WithId>(items: T[], id: string): T | undefined {
    return items.find((item) => {
        const itemId = 'getId' in item ? item.getId() : item.id;
        return itemId === id;
    });
}
