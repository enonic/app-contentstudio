import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {SettingsItem} from '../SettingsItem';

export class SettingsItemViewer
    extends NamesAndIconViewer<SettingsItem> {

    resolveDisplayName(item: SettingsItem): string {
        return item.getDisplayName();
    }

    resolveUnnamedDisplayName(object: SettingsItem): string {
        return '';
    }

    resolveSubName(item: SettingsItem, relativePath: boolean = false): string {
        return item.getDescription();
    }

    resolveIconClass(item: SettingsItem): string {
        return `icon-large ${item.getIconClass()}`;
    }
}
