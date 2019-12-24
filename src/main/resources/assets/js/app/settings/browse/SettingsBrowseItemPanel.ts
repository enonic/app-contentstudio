import {BrowseItemPanel} from 'lib-admin-ui/app/browse/BrowseItemPanel';
import {ItemStatisticsPanel} from 'lib-admin-ui/app/view/ItemStatisticsPanel';
import {SettingsItem} from '../data/SettingsItem';

export class SettingsBrowseItemPanel
    extends BrowseItemPanel<SettingsItem> {

    createItemStatisticsPanel(): ItemStatisticsPanel<SettingsItem> {
        return new ItemStatisticsPanel();
    }

}
