import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {SettingsViewItem} from '../../view/SettingsViewItem';

export abstract class SettingsItemViewer
    extends NamesAndIconViewer<SettingsViewItem> {

    resolveDisplayName(item: SettingsViewItem): string {
        return item.getDisplayName();
    }

    resolveUnnamedDisplayName(object: SettingsViewItem): string {
        return '';
    }

    resolveSubName(item: SettingsViewItem): string {
        return item.getDescription();
    }

    resolveIconClass(item: SettingsViewItem): string {
        return `icon-large ${item.getIconClass()}`;
    }
}
