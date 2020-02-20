import {Project} from '../../settings/data/project/Project';
import {ProjectListItem} from './ProjectListItem';
import {ProjectList} from './ProjectList';

export class SelectableProjectList
    extends ProjectList {

    private selectedListItem: ProjectListItem;

    private selectionChangedListeners: { (project: ProjectListItem): void } [] = [];

    private focusChangedListeners: { (listItem: ProjectListItem): void } [] = [];

    selectListItem(projectListItem: ProjectListItem) {
        if (projectListItem === this.selectedListItem) {
            return;
        }

        this.selectedListItem.removeClass('selected');
        projectListItem.addClass('selected');
        this.selectedListItem = projectListItem;

        this.notifySelectionChanged();
    }

    preSelectProject(project: Project) {
        this.getItemViews().some((view: ProjectListItem) => {
            if (view.getProject().equals(project)) {
                view.addClass('selected');
                this.selectedListItem = view;
                return true;
            }

            return false;
        });
    }

    onSelectionChanged(listener: (project: ProjectListItem) => void) {
        this.selectionChangedListeners.push(listener);
    }

    onFocusChanged(listener: (listItem: ProjectListItem) => void) {
        this.focusChangedListeners.push(listener);
    }

    protected createItemView(item: Project, readOnly: boolean): ProjectListItem {
        const projectListItem: ProjectListItem = super.createItemView(item, readOnly);

        projectListItem.onClicked(() => {
            this.selectListItem(projectListItem);
        });

        projectListItem.onFocus(() => {
            this.notifyFocusChanged(projectListItem);
        });

        projectListItem.getEl().setTabIndex(0);

        return projectListItem;
    }

    private notifySelectionChanged() {
        this.selectionChangedListeners.forEach((listener) => {
            listener(this.selectedListItem);
        });
    }

    private notifyFocusChanged(listItem: ProjectListItem) {
        this.focusChangedListeners.forEach((listener) => {
            listener(listItem);
        });
    }

}
