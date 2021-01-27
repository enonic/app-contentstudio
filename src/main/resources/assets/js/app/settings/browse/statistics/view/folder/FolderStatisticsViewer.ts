import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {FolderViewItem} from '../../../../view/FolderViewItem';

export class FolderStatisticsViewer
    extends NamesAndIconViewer<FolderViewItem> {

    resolveDisplayName(item: FolderViewItem): string {
        return item.getDisplayName();
    }

    resolveIconClass(item: FolderViewItem): string {
        return `icon-large ${item.getIconClass()}`;
    }
}
