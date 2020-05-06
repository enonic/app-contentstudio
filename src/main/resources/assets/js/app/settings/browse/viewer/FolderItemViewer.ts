import {SettingsItemViewer} from './SettingsItemViewer';
import {FolderViewItem} from '../../view/FolderViewItem';

export class FolderItemViewer
    extends SettingsItemViewer {

    resolveDisplayName(item: FolderViewItem): string {
        return super.resolveDisplayName(item);
    }

    resolveUnnamedDisplayName(item: FolderViewItem): string {
        return super.resolveUnnamedDisplayName(item);
    }

    resolveSubName(item: FolderViewItem): string {
        return super.resolveSubName(item);
    }

    resolveIconClass(item: FolderViewItem): string {
        return super.resolveIconClass(item);
    }
}
