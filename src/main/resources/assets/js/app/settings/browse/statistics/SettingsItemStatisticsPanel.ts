import {ItemStatisticsPanel} from 'lib-admin-ui/app/view/ItemStatisticsPanel';
import {ViewItem} from 'lib-admin-ui/app/view/ViewItem';
import {SettingsViewItem} from '../../view/SettingsViewItem';
import {SettingsStatisticsView} from './view/SettingsStatisticsView';
import {StatisticsViewFactory} from './StatisticsViewFactory';

export class SettingsItemStatisticsPanel
    extends ItemStatisticsPanel {

    private activeView: SettingsStatisticsView<SettingsViewItem>;

    constructor() {
        super('settings-item-statistics-panel');
    }

    setItem(item: SettingsViewItem) {
        super.setItem(item);

        const view: SettingsStatisticsView<SettingsViewItem> = StatisticsViewFactory.get().getViewForSettingsItem(item);
        view.setItem(item);

        if (!this.activeView) {
            this.appendChild(view);
        } else if (this.activeView !== view) {
            this.removeChild(this.activeView);
            this.appendChild(view);
        }

        this.activeView = view;
    }

    clearItem() {
        super.clearItem();

        if (this.activeView) {
            this.removeChild(this.activeView);
            this.activeView = null;
        }
    }

}
