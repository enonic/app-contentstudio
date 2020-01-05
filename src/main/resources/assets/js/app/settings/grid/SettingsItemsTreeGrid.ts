import {TreeGrid} from 'lib-admin-ui/ui/treegrid/TreeGrid';
import {TreeGridBuilder} from 'lib-admin-ui/ui/treegrid/TreeGridBuilder';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ResponsiveRanges} from 'lib-admin-ui/ui/responsive/ResponsiveRanges';
import {Body} from 'lib-admin-ui/dom/Body';
import {TreeGridContextMenu} from 'lib-admin-ui/ui/treegrid/TreeGridContextMenu';
import {SettingsTreeGridActions} from './SettingsTreeGridActions';
import {SettingsItemsRowFormatter} from './SettingsItemsRowFormatter';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import * as Q from 'q';
import {FolderItem, FolderItemBuilder} from '../data/FolderItem';
import {SettingsItem} from '../data/SettingsItem';
import {ProjectListRequest} from '../resource/ProjectListRequest';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {EditSettingsItemEvent} from '../event/EditSettingsItemEvent';
import {ProjectItem} from '../data/ProjectItem';

export class SettingsItemsTreeGrid
    extends TreeGrid<SettingsItem> {

    private treeGridActions: SettingsTreeGridActions;

    private static PROJECTS_FOLDER_ID: string = 'projects';

    constructor() {
        const builder = new TreeGridBuilder<SettingsItem>().setColumnConfig([{
            name: i18n('field.name'),
            id: 'name',
            field: 'displayName',
            formatter: SettingsItemsRowFormatter.nameFormatter,
            style: {minWidth: 200}
        }]).setPartialLoadEnabled(true).setLoadBufferSize(20).prependClasses('settings-tree-grid');

        const columns = builder.getColumns().slice(0);
        const [nameColumn] = columns;

        const updateColumns = () => {
            let checkSelIsMoved = ResponsiveRanges._540_720.isFitOrSmaller(Body.get().getEl().getWidth());

            const curClass = nameColumn.getCssClass();

            if (checkSelIsMoved) {
                nameColumn.setCssClass(curClass || 'shifted');
            } else if (curClass && curClass.indexOf('shifted') >= 0) {
                nameColumn.setCssClass(curClass.replace('shifted', ''));
            }

            this.setColumns(columns.slice(0), checkSelIsMoved);
        };

        builder.setColumnUpdater(updateColumns);

        super(builder);

        this.treeGridActions = new SettingsTreeGridActions(this);

        this.setContextMenu(new TreeGridContextMenu(this.treeGridActions));

        this.getGrid().subscribeOnDblClick((event, data) => {
            if (this.isActive()) {
                const node: TreeNode<SettingsItem> = this.getGrid().getDataView().getItem(data.row);
                this.editItem(node);
            }
        });
    }

    fetchChildren(parentNode?: TreeNode<SettingsItem>): Q.Promise<SettingsItem[]> {
        if (!parentNode) {
            return this.fetchRootItems();
        } else if (this.isProjectsFolder(parentNode.getData())) {
            return new ProjectListRequest().sendAndParse();
        }

        return Q(null);
    }

    private fetchRootItems(): Q.Promise<SettingsItem[]> {
        const projectsFolder: SettingsItem = new FolderItemBuilder()
            .setId(SettingsItemsTreeGrid.PROJECTS_FOLDER_ID)
            .setDisplayName(i18n('settings.projects'))
            .setDescription(i18n('settings.projects.description'))
            .build();
        return Q([projectsFolder]);
    }

    getDataId(item: SettingsItem): string {
        return item.getId();
    }

    hasChildren(item: SettingsItem): boolean {
        return ObjectHelper.iFrameSafeInstanceOf(item, FolderItem);
    }

    private isProjectsFolder(item: SettingsItem): boolean {
        return item.getId() === SettingsItemsTreeGrid.PROJECTS_FOLDER_ID;
    }

    protected editItem(node: TreeNode<SettingsItem>) {
        const item: SettingsItem = node.getData();
        if (ObjectHelper.iFrameSafeInstanceOf(item, ProjectItem)) {
            new EditSettingsItemEvent([item]).fire();
        }
    }

    hasItemWithId(id: string) {
        return !!this.getRoot().getCurrentRoot().findNode(id);
    }

    appendSettingsItemNode(item: SettingsItem) {
        if (this.hasItemWithId(item.getId())) {
            return;
        }

        const parentNode: TreeNode<SettingsItem> = this.getSettingsItemParenNode(item);
        if (!parentNode) {
            return;
        }

        this.appendNodeToParent(parentNode, item);

    }

    private getSettingsItemParenNode(item: SettingsItem): TreeNode<SettingsItem> {
        if (ObjectHelper.iFrameSafeInstanceOf(item, ProjectItem)) {
            const projectsNode: TreeNode<SettingsItem> = this.getRoot().getCurrentRoot().findNode(SettingsItemsTreeGrid.PROJECTS_FOLDER_ID);
            return projectsNode;
        }

        return null;
    }

    updateSettingsItemNode(item: SettingsItem) {
        if (!this.hasItemWithId(item.getId())) {
            return;
        }

        const treeNodeToUpdate: TreeNode<SettingsItem> = this.getRoot().getCurrentRoot().findNode(item.getId());
        treeNodeToUpdate.setData(item);
        treeNodeToUpdate.clearViewers();
        this.invalidateNodes([treeNodeToUpdate]);
    }

    deleteSettingsItemNode(id: string) {
        if (!this.hasItemWithId(id)) {
            return;
        }
        const treeNodeToDelete: TreeNode<SettingsItem> = this.getRoot().getCurrentRoot().findNode(id);
        this.deleteNode(treeNodeToDelete.getData());
    }
}
