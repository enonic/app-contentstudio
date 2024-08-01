import {TreeListBox, TreeListBoxParams, TreeListElement, TreeListElementParams} from '@enonic/lib-admin-ui/ui/selector/list/TreeListBox';
import {SettingsViewItem} from './view/SettingsViewItem';
import {FolderItemBuilder, FolderViewItem} from './view/FolderViewItem';
import {FolderItemViewer} from './browse/viewer/FolderItemViewer';
import {SettingsItemViewer} from './browse/viewer/SettingsItemViewer';
import {ProjectItemViewer} from './browse/viewer/ProjectItemViewer';
import {Projects} from './resource/Projects';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectViewItem} from './view/ProjectViewItem';
import Q from 'q';
import {SettingsTreeHelper} from './tree/SettingsTreeHelper';

export class SettingsTreeList
    extends TreeListBox<SettingsViewItem> {

    public static PROJECTS_FOLDER_ID: string = 'projects';

    constructor(params?: TreeListBoxParams<SettingsViewItem>) {
        super(params);
    }

    protected createItemView(item: SettingsViewItem, readOnly: boolean): SettingsTreeListElement {
        return new SettingsTreeListElement(item, {scrollParent: this.scrollParent, level: this.level});
    }

    protected getItemId(item: SettingsViewItem): string {
        return item.getId();
    }

    protected handleLazyLoad(): void {
        if (this.getItemCount() === 0) {
            this.setItems(this.isRoot() ? [this.makeRootFolderItem()] : this.getProjectsViewItemsByParent());
        }
    }

    public reload(): void {
        this.setItems(this.isRoot() ? [this.makeRootFolderItem()] : this.getProjectsViewItemsByParent());
    }

    protected addItemView(item: SettingsViewItem, readOnly?: boolean): SettingsTreeListElement {
        const itemView = super.addItemView(item, readOnly) as SettingsTreeListElement;

        itemView.whenRendered(() => itemView.expand());

        return itemView;
    }

    private makeRootFolderItem(): FolderViewItem {
        return new FolderItemBuilder()
            .setId(SettingsTreeList.PROJECTS_FOLDER_ID)
            .setDisplayName(i18n('settings.projects'))
            .setDescription(i18n('settings.projects.description'))
            .build();
    }

    private getProjectsViewItemsByParent(): ProjectViewItem[] {
        const parentId = this.options.parentItem instanceof FolderViewItem ? null : this.options.parentItem.getId();
        return Projects.get().getProjectsPyParent(parentId).map(project => ProjectViewItem.create()
            .setData(project)
            .build());
    }

    private isRoot(): boolean {
        return !this.options.parentItem;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('settings-tree-list');

            return rendered;
        });
    }
}

export class SettingsTreeListElement
    extends TreeListElement<SettingsViewItem> {

    constructor(item: SettingsViewItem, params: TreeListElementParams<SettingsViewItem>) {
        super(item, params);
    }

    protected createChildrenList(params?: TreeListBoxParams<SettingsViewItem>): SettingsTreeList {
        return new SettingsTreeList(params);
    }

    protected hasChildren(item: SettingsViewItem): boolean {
        return SettingsTreeHelper.hasChildren(item);
    }

    protected createItemViewer(item: SettingsViewItem): SettingsItemViewer {
        const viewer = item instanceof FolderViewItem ? new FolderItemViewer() : new ProjectItemViewer();
        viewer.setObject(item);
        return viewer;
    }

    setExpanded(expanded: boolean): void {
        super.setExpanded(expanded);

        if (this.item instanceof FolderViewItem) {
            (this.itemViewer as FolderItemViewer).setExpandedState(expanded);
        }
    }

}
