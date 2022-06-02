import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {SettingsType} from './SettingsType';

export class SettingsTypeViewer
    extends NamesAndIconViewer<SettingsType> {

    resolveDisplayName(item: SettingsType): string {
        return item.getDisplayName();
    }

    resolveUnnamedDisplayName(object: SettingsType): string {
        return '';
    }

    resolveSubName(item: SettingsType, relativePath: boolean = false): string {
        return item.getDescription();
    }

    resolveIconClass(item: SettingsType): string {
        return `icon-large ${item.getIconClass()}`;
    }
}
