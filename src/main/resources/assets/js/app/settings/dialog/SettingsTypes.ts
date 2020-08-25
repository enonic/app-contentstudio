import {SettingsType} from './SettingsType';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ProjectIconUrlResolver} from '../../project/ProjectIconUrlResolver';

export class SettingsTypes {

    public static PROJECT: SettingsType =
        SettingsType.create()
            .setName('Project')
            .setDescription(i18n('settings.items.type.projectDescription'))
            .setDisplayName(i18n('settings.items.type.project'))
            .setDisplayNamePlaceholder(i18n('settings.projects.displayName'))
            .setIconClass(ProjectIconUrlResolver.getDefaultProjectIcon())
            .build();

    public static LAYER: SettingsType =
        SettingsType.create()
            .setName('Layer')
            .setDescription(i18n('settings.items.type.layerDescription'))
            .setDisplayName(i18n('settings.items.type.layer'))
            .setDisplayNamePlaceholder(i18n('settings.layers.displayName'))
            .setIconClass(ProjectIconUrlResolver.getDefaultLayerIcon())
            .build();

    private static TYPES: SettingsType[] = [SettingsTypes.PROJECT, SettingsTypes.LAYER];

    static getType(name: string): SettingsType {
        return SettingsTypes.TYPES.find(type => type.getName() === name);
    }

    static getInstantiable(): SettingsType[] {
        return SettingsTypes.TYPES.filter(type => type.getInstantiable());
    }
}
