import {SettingsType} from './SettingsType';
import {i18n} from 'lib-admin-ui/util/Messages';

export class SettingsTypes {

    public static PROJECT: SettingsType = SettingsType.create()
        .setName('Project')
        .setDisplayName(i18n('settings.items.type.project'))
        .setIconClass('icon-tree-2')
        .build();

    private static TYPES: SettingsType[] = [SettingsTypes.PROJECT];

    getType(name: string) {
        const types: SettingsType[] = SettingsTypes.TYPES.filter(type => type.getName() === name);
        return types.length > 0 ? types[0] : null;
    }
}
