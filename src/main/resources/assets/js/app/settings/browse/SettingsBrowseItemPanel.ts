import {BrowseItemPanel} from 'lib-admin-ui/app/browse/BrowseItemPanel';
import {ItemStatisticsPanel} from 'lib-admin-ui/app/view/ItemStatisticsPanel';
import {SettingsItem} from '../data/SettingsItem';
import {SettingsItemStatisticsPanel} from './SettingsItemStatisticsPanel';

export class SettingsBrowseItemPanel
    extends BrowseItemPanel<SettingsItem> {

    createItemStatisticsPanel(): ItemStatisticsPanel<SettingsItem> {
        return new SettingsItemStatisticsPanel();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('settings-browse-item-panel');

            return rendered;
        });
    }

}
