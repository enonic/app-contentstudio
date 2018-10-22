import i18n = api.util.i18n;

declare var CONFIG;
api.util.i18nInit(CONFIG.messages);

export enum Access {
    FULL,
    READ,
    WRITE,
    PUBLISH,
    CUSTOM
}

export interface AccessOption {
    value: Access;
    name: string;
}

export const ACCESS_OPTIONS: AccessOption[] = [
    {value: Access.FULL, name: i18n('security.access.full')},
    {value: Access.PUBLISH, name: i18n('security.access.publish')},
    {value: Access.WRITE, name: i18n('security.access.write')},
    {value: Access.READ, name: i18n('security.access.read')},
    {value: Access.CUSTOM, name: i18n('security.access.custom')}
];
