import {SettingsType} from './SettingsType';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectIconUrlResolver} from '../../../project/ProjectIconUrlResolver';

export class SettingsTypes {

    private static INSTANCE: SettingsTypes;

    private readonly project: SettingsType;

    private readonly layer: SettingsType;

    protected constructor() {
        this.project = SettingsType.create()
            .setName('Project')
            .setDescription(i18n('settings.items.type.projectDescription'))
            .setDisplayName(i18n('settings.items.type.project'))
            .setDisplayNamePlaceholder(i18n('settings.projects.displayName'))
            .setIconClass(ProjectIconUrlResolver.getDefaultProjectIcon())
            .build();

        this.layer = SettingsType.create()
            .setName('Layer')
            .setDescription(i18n('settings.items.type.layerDescription'))
            .setDisplayName(i18n('settings.items.type.layer'))
            .setDisplayNamePlaceholder(i18n('settings.layers.displayName'))
            .setIconClass(ProjectIconUrlResolver.getDefaultLayerIcon())
            .build();
    }

    static get(): SettingsTypes {
        if (!SettingsTypes.INSTANCE) {
            SettingsTypes.INSTANCE = new SettingsTypes();
        }

        return SettingsTypes.INSTANCE;
    }

    getProject(): SettingsType {
        return this.project;
    }

    getLayer(): SettingsType {
        return this.layer;
    }

    getType(name: string): SettingsType {
        return [this.project, this.layer].find(type => type.getName() === name);
    }

    getInstantiable(): SettingsType[] {
        return [this.project, this.layer].filter(type => type.getInstantiable());
    }
}
