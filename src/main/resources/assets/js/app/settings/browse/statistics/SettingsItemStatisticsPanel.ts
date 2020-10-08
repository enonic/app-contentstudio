import {ItemStatisticsPanel} from 'lib-admin-ui/app/view/ItemStatisticsPanel';
import {ViewItem} from 'lib-admin-ui/app/view/ViewItem';
import {SettingsViewItem} from '../../view/SettingsViewItem';
import {SettingsStatisticsView} from './view/SettingsStatisticsView';
import {StatisticsViewFactory} from './StatisticsViewFactory';

export class SettingsItemStatisticsPanel
    extends ItemStatisticsPanel<SettingsViewItem> {

    private activeView: SettingsStatisticsView<SettingsViewItem>;

    constructor() {
        super('settings-item-statistics-panel');
    }

    setItem(item: ViewItem<SettingsViewItem>) {
        super.setItem(item);

        const view: SettingsStatisticsView<SettingsViewItem> = StatisticsViewFactory.get().getViewForSettingsItem(item.getModel());
        view.setItem(item.getModel());

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
