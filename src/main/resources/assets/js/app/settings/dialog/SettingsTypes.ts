import {SettingsType} from './SettingsType';
import {i18n} from 'lib-admin-ui/util/Messages';

export class SettingsTypes {

    public static PROJECT: SettingsType =
        SettingsType.create()
            .setName('Project')
            .setDescription(i18n('settings.items.type.projectDescription'))
            .setDisplayName(i18n('settings.items.type.project'))
            .setIconClass('icon-tree-2')
            .build();

    private static TYPES: SettingsType[] = [SettingsTypes.PROJECT];

    getType(name: string): SettingsType {
        return SettingsTypes.TYPES.find(type => type.getName() === name);
    }
}
