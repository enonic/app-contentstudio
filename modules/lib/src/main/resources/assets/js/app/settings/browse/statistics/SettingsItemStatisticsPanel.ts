import {ItemStatisticsPanel} from '@enonic/lib-admin-ui/app/view/ItemStatisticsPanel';
import {SettingsViewItem} from '../../view/SettingsViewItem';
import {SettingsStatisticsView} from './view/SettingsStatisticsView';
import {StatisticsViewFactory} from './StatisticsViewFactory';
import {ProjectDAGVisualization} from './view/project/ProjectDAGVisualization';
import {SettingsTreeList} from '../../SettingsTreeList';

export class SettingsItemStatisticsPanel
    extends ItemStatisticsPanel {

    private activeView: SettingsStatisticsView<SettingsViewItem>;
    private projectDAGVisualization: ProjectDAGVisualization;

    constructor() {
        super('settings-item-statistics-panel');
    }

    setItem(item: SettingsViewItem) {
        if (this.getItem() !== item) {
            this.hideProjectGraph();
        }

        super.setItem(item);
        const view: SettingsStatisticsView<SettingsViewItem> = StatisticsViewFactory.get().getViewForSettingsItem(item);
        view.setItem(item);

        if (!this.activeView) {
            this.appendChild(view);
            this.showProjectGraph(item);
        } else if (this.activeView !== view) {
            this.removeChild(this.activeView);
            this.appendChild(view);
            this.showProjectGraph(item);
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

    private hideProjectGraph() {
        if (!this.projectDAGVisualization) {
            return;
        }
        this.removeChild(this.projectDAGVisualization);
        this.projectDAGVisualization = null;
    }

    private showProjectGraph(item: SettingsViewItem) {
        if (item.getId() !== SettingsTreeList.PROJECTS_FOLDER_ID) {
            return;
        }
        this.projectDAGVisualization = new ProjectDAGVisualization(item.getId());
        this.appendChild(this.projectDAGVisualization);
    }

}
