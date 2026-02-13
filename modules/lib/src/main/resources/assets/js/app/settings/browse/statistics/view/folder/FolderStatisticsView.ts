import {SettingsStatisticsView} from '../SettingsStatisticsView';
import {type FolderViewItem} from '../../../../view/FolderViewItem';
import {FolderStatisticsViewer} from './FolderStatisticsViewer';

export class FolderStatisticsView extends SettingsStatisticsView<FolderViewItem> {

    createViewer(): FolderStatisticsViewer {
        return new FolderStatisticsViewer();
    }

}
