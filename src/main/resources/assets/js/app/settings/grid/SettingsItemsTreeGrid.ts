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
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {EditSettingsItemEvent} from '../event/EditSettingsItemEvent';
import {Project} from '../data/project/Project';
import {SettingsViewItem} from '../view/SettingsViewItem';
import {ProjectViewItem} from '../view/ProjectViewItem';
import {FolderItemBuilder, FolderViewItem} from '../view/FolderViewItem';
import {ProjectListWithMissingRequest} from '../resource/ProjectListWithMissingRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {LoginResult} from 'lib-admin-ui/security/auth/LoginResult';

export class SettingsItemsTreeGrid
    extends TreeGrid<SettingsViewItem> {

    private static PROJECTS_FOLDER_ID: string = 'projects';

    private readonly treeGridActions: SettingsTreeGridActions;

    private projects: Project[];

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
        this.getContextMenu().removeAction(this.treeGridActions.getSyncAction());

        this.projects = [];

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
            return new ProjectListWithMissingRequest().sendAndParse().then((projects: Project[]) => {
                this.projects = projects;

                return this.getProjectsPyParent(null).map(project => ProjectViewItem.create()
                    .setData(project)
                    .build());
            });
        } else {
            const items: ProjectViewItem[] = this.getProjectsPyParent(parentNode.getData().getId()).map(project => ProjectViewItem.create()
                .setData(project)
                .build());

            return Q(items);
        }
    }

    private getProjectsPyParent(parentName: string): Project[] {
        return this.projects.filter((project: Project) => project.getParent() === parentName);
    }

    hasChildren(item: SettingsViewItem): boolean {
        return ObjectHelper.iFrameSafeInstanceOf(item, FolderViewItem) ||
            this.projects.some((project: Project) => project.getParent() === item.getId());
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

        if (ObjectHelper.iFrameSafeInstanceOf(item, ProjectViewItem)) {
            this.projects.push((<ProjectViewItem>item).getData());
        }

        if (parentNode.hasParent() && parentNode.getParent().isExpanded()) {
            parentNode.setExpanded(true);
        }

        this.appendDataToParentNode(item, parentNode);
    }

    hasItemWithId(id: string) {
        return !!this.getRoot().getNodeByDataId(id);
    }

    deleteSettingsItem(id: string) {
        this.deleteNodeByDataId(id);
        this.projects = this.projects.filter((project: Project) => project.getName() !== id);
    }

    protected isToBeExpanded(node: TreeNode<SettingsViewItem>): boolean {
        return true;
    }

    protected editItem(node: TreeNode<SettingsViewItem>) {
        const item: SettingsViewItem = node.getData();

        this.treeGridActions.getAuthInfo().then((loginResult: LoginResult) => {
            if (item.isEditAllowed(loginResult)) {
                new EditSettingsItemEvent([item]).fire();
            }
        }).catch(DefaultErrorHandler.handle);
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
        if (!ObjectHelper.iFrameSafeInstanceOf(item, ProjectViewItem)) {
            return null;
        }

        const projectItem: ProjectViewItem = <ProjectViewItem>item;

        if (!projectItem.getData().getParent()) {
            return this.getRoot().getNodeByDataId(SettingsItemsTreeGrid.PROJECTS_FOLDER_ID);
        }

        return this.getRoot().getNodeByDataId(projectItem.getData().getParent());
    }
}
