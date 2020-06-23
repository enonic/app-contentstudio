import {TreeGrid} from 'lib-admin-ui/ui/treegrid/TreeGrid';
import {TreeGridBuilder} from 'lib-admin-ui/ui/treegrid/TreeGridBuilder';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ResponsiveRanges} from 'lib-admin-ui/ui/responsive/ResponsiveRanges';
import {Body} from 'lib-admin-ui/dom/Body';
import {TreeGridContextMenu} from 'lib-admin-ui/ui/treegrid/TreeGridContextMenu';
import {SettingsTreeGridActions} from './SettingsTreeGridActions';
import {SettingsItemRowFormatter} from './SettingsItemRowFormatter';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import * as Q from 'q';
import {ProjectListRequest} from '../resource/ProjectListRequest';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {EditSettingsItemEvent} from '../event/EditSettingsItemEvent';
import {Project} from '../data/project/Project';
import {SettingsViewItem} from '../view/SettingsViewItem';
import {ProjectViewItem} from '../view/ProjectViewItem';
import {FolderItemBuilder, FolderViewItem} from '../view/FolderViewItem';

export class SettingsItemsTreeGrid
    extends TreeGrid<SettingsViewItem> {

    private treeGridActions: SettingsTreeGridActions;

    private static PROJECTS_FOLDER_ID: string = 'projects';

    constructor() {
        const builder = new TreeGridBuilder<SettingsViewItem>().setColumnConfig([{
            name: i18n('field.name'),
            id: 'name',
            field: 'displayName',
            formatter: SettingsItemRowFormatter.nameFormatter,
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
                const node: TreeNode<SettingsViewItem> = this.getGrid().getDataView().getItem(data.row);
                this.editItem(node);
            }
        });
    }

    fetchChildren(parentNode?: TreeNode<SettingsViewItem>): Q.Promise<SettingsViewItem[]> {
        if (!parentNode) {
            return this.fetchRootItems();
        } else if (this.isProjectsFolder(parentNode.getData())) {
            return new ProjectListRequest().sendAndParse().then((projects: Project[]) => {
                return projects.map(project => ProjectViewItem.create()
                    .setData(project)
                    .build());
            });
        }

        return Q(null);
    }

    getDataId(item: SettingsViewItem): string {
        return item.getId();
    }

    hasChildren(item: SettingsViewItem): boolean {
        return ObjectHelper.iFrameSafeInstanceOf(item, FolderViewItem);
    }

    getItemById(id: string): SettingsViewItem {
        const node: TreeNode<SettingsViewItem> = this.getRoot().getNodeByDataId(id);

        if (node) {
            return node.getData();
        }

        return null;
    }

    appendSettingsItemNode(item: SettingsViewItem) {
        if (this.hasItemWithId(item.getId())) {
            return;
        }

        const parentNode: TreeNode<SettingsViewItem> = this.getSettingsItemParentNode(item);
        if (!parentNode) {
            return;
        }

        this.appendNodeToParent(parentNode, item);

    }

    updateSettingsItemNode(item: SettingsViewItem) {
        if (!this.hasItemWithId(item.getId())) {
            return;
        }

        const treeNodeToUpdate: TreeNode<SettingsViewItem> = this.getRoot().getCurrentRoot().findNode(item.getId());
        treeNodeToUpdate.setData(item);
        treeNodeToUpdate.clearViewers();
        this.invalidateNodes([treeNodeToUpdate]);
    }

    deleteSettingsItemNode(id: string) {
        if (!this.hasItemWithId(id)) {
            return;
        }

        this.deselectNodes([id]);
        const treeNodeToDelete: TreeNode<SettingsViewItem> = this.getRoot().getNodeByDataId(id);
        if (treeNodeToDelete) {
            this.deleteNode(treeNodeToDelete.getData());
        }
    }

    hasItemWithId(id: string) {
        return !!this.getRoot().getNodeByDataId(id);
    }

    protected editItem(node: TreeNode<SettingsViewItem>) {
        const item: SettingsViewItem = node.getData();
        if (ObjectHelper.iFrameSafeInstanceOf(item, ProjectViewItem)) {
            new EditSettingsItemEvent([item]).fire();
        }
    }

    private fetchRootItems(): Q.Promise<SettingsViewItem[]> {
        const projectsFolder: SettingsViewItem = new FolderItemBuilder()
            .setId(SettingsItemsTreeGrid.PROJECTS_FOLDER_ID)
            .setDisplayName(i18n('settings.projects'))
            .setDescription(i18n('settings.projects.description'))
            .build();
        return Q([projectsFolder]);
    }

    private isProjectsFolder(item: SettingsViewItem): boolean {
        return item.getId() === SettingsItemsTreeGrid.PROJECTS_FOLDER_ID;
    }

    private getSettingsItemParentNode(item: SettingsViewItem): TreeNode<SettingsViewItem> {
        if (ObjectHelper.iFrameSafeInstanceOf(item, ProjectViewItem)) {
            return this.getRoot().getNodeByDataId(SettingsItemsTreeGrid.PROJECTS_FOLDER_ID);
        }

        return null;
    }
}
