export interface Diff {
    [key: string]: boolean | Diff;
}

export const isEqual = (diff: Diff) => {
    return Object.keys(diff).every((key): boolean => {
        const prop = diff[key];

        if (typeof prop === 'boolean') {
            return !prop;
        }

        return isEqual(prop);
    });
};
