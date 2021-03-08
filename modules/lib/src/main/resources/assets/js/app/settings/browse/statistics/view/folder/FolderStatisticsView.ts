import {SettingsStatisticsView} from '../SettingsStatisticsView';
import {FolderViewItem} from '../../../../view/FolderViewItem';
import {FolderItemViewer} from '../../../viewer/FolderItemViewer';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {FolderStatisticsViewer} from './FolderStatisticsViewer';

export class FolderStatisticsView extends SettingsStatisticsView<FolderViewItem> {

    createViewer(): FolderStatisticsViewer {
        return new FolderStatisticsViewer();
    }

}
