import Q from 'q';
import {ItemStatisticsPanel} from '@enonic/lib-admin-ui/app/view/ItemStatisticsPanel';
import {SettingsViewItem} from '../../view/SettingsViewItem';
import {SettingsStatisticsView} from './view/SettingsStatisticsView';
import {StatisticsViewFactory} from './StatisticsViewFactory';
import {ProjectDAGVisualization} from './view/project/ProjectDAGVisualization';
import {SettingsItemsTreeGridHighlightEvent} from '../../../event/SettingsItemsTreeGridHighlightEvent';
import {SettingsItemsTreeGrid} from '../../grid/SettingsItemsTreeGrid';

export class SettingsItemStatisticsPanel
    extends ItemStatisticsPanel {

    private activeView: SettingsStatisticsView<SettingsViewItem>;
    private projectDAGVisualization: ProjectDAGVisualization;

    constructor() {
        super('settings-item-statistics-panel');

        SettingsItemsTreeGridHighlightEvent.on((event: SettingsItemsTreeGridHighlightEvent) => {
            const highligtedItem = event.getHighlightedItem();

            if (this.projectDAGVisualization) {
                this.removeChild(this.projectDAGVisualization);
                this.projectDAGVisualization = null;
            }

            if (highligtedItem.id === SettingsItemsTreeGrid.PROJECTS_FOLDER_ID) {
                setTimeout(() => {
                    this.projectDAGVisualization = new ProjectDAGVisualization(SettingsItemsTreeGrid.PROJECTS_FOLDER_ID);
                    this.appendChild(this.projectDAGVisualization);
                }, 100);
            }
        }); 
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
