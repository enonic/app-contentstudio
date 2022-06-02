import * as Q from 'q';
import {TreeGrid} from '@enonic/lib-admin-ui/ui/treegrid/TreeGrid';
import {TreeGridBuilder} from '@enonic/lib-admin-ui/ui/treegrid/TreeGridBuilder';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {TreeGridContextMenu} from '@enonic/lib-admin-ui/ui/treegrid/TreeGridContextMenu';
import {SettingsTreeGridActions} from './SettingsTreeGridActions';
import {TreeNode} from '@enonic/lib-admin-ui/ui/treegrid/TreeNode';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {EditSettingsItemEvent} from '../event/EditSettingsItemEvent';
import {Project} from '../data/project/Project';
import {SettingsViewItem} from '../view/SettingsViewItem';
import {ProjectViewItem} from '../view/ProjectViewItem';
import {FolderItemBuilder, FolderViewItem} from '../view/FolderViewItem';
import {ProjectListWithMissingRequest} from '../resource/ProjectListWithMissingRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {SettingsItemsTreeGridHelper} from './SettingsItemsTreeGridHelper';

export class SettingsItemsTreeGrid
    extends TreeGrid<SettingsViewItem> {

    private static PROJECTS_FOLDER_ID: string = 'projects';

    private readonly treeGridActions: SettingsTreeGridActions;

    private projects: Project[];

    constructor() {
        super(new TreeGridBuilder<SettingsViewItem>()
            .setColumnConfig(SettingsItemsTreeGridHelper.generateColumnsConfig())
            .setPartialLoadEnabled(true)
            .setLoadBufferSize(20)
            .prependClasses('settings-tree-grid'));

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

        new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
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
