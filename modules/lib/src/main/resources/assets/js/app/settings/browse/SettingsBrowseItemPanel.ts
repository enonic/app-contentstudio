import {BrowseItemPanel} from '@enonic/lib-admin-ui/app/browse/BrowseItemPanel';
import {type ItemStatisticsPanel} from '@enonic/lib-admin-ui/app/view/ItemStatisticsPanel';
import {SettingsItemStatisticsPanel} from './statistics/SettingsItemStatisticsPanel';

export class SettingsBrowseItemPanel
    extends BrowseItemPanel {

    createItemStatisticsPanel(): ItemStatisticsPanel {
        return new SettingsItemStatisticsPanel();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('settings-browse-item-panel');

            return rendered;
        });
    }

}
