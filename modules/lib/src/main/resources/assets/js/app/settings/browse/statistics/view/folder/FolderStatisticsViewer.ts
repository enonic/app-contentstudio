import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {type FolderViewItem} from '../../../../view/FolderViewItem';

export class FolderStatisticsViewer
    extends NamesAndIconViewer<FolderViewItem> {

    constructor() {
        super('folder-statistics-viewer');
    }

    resolveDisplayName(item: FolderViewItem): string {
        return item.getDisplayName();
    }

    resolveIconClass(item: FolderViewItem): string {
        return `icon-large ${item.getIconClass()}`;
    }
}
