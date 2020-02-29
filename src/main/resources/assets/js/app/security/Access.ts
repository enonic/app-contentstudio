export enum Access {
    FULL = 'full',
    READ = 'read',
    WRITE = 'write',
    PUBLISH = 'publish',
    CUSTOM = 'custom'
}

export const ACCESS_OPTIONS: Access[] = [
    Access.FULL,
    Access.PUBLISH,
    Access.WRITE,
    Access.READ,
    Access.CUSTOM,
];
