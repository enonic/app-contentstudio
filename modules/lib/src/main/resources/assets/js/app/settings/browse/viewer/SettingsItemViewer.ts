import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {SettingsViewItem} from '../../view/SettingsViewItem';
import {i18n} from 'lib-admin-ui/util/Messages';

export abstract class SettingsItemViewer
    extends NamesAndIconViewer<SettingsViewItem> {

    resolveDisplayName(item: SettingsViewItem): string {
        return item.getDisplayName();
    }

    resolveUnnamedDisplayName(object: SettingsViewItem): string {
        return '';
    }

    resolveSubName(item: SettingsViewItem): string {
        return item.getDescription() || `<${i18n('text.noDescription')}>`;
    }

    resolveIconClass(item: SettingsViewItem): string {
        return `icon-large ${item.getIconClass()}`;
    }
}
