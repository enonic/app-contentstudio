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
import {FolderItemBuilder} from '../FolderItem';
import {SettingsItem} from '../SettingsItem';
import {ProjectListRequest} from '../resource/ProjectListRequest';

export class SettingsItemsTreeGrid
    extends TreeGrid<SettingsItem> {

    private treeGridActions: SettingsTreeGridActions;

    constructor() {
        const builder = new TreeGridBuilder<SettingsItem>().setColumnConfig([{
            name: i18n('field.name'),
            id: 'name',
            field: 'displayName',
            formatter: SettingsItemsRowFormatter.nameFormatter,
            style: {minWidth: 200}
        }]).setPartialLoadEnabled(true).setLoadBufferSize(20).prependClasses('user-tree-grid');

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
            .setId('projects')
            .setDisplayName(i18n('settings.projects'))
            .setDescription(i18n('settings.projects.description'))
            .build();
        return Q([projectsFolder]);
    }

    getDataId(item: SettingsItem): string {
        return item.getId();
    }

    hasChildren(item: SettingsItem): boolean {
        return this.isProjectsFolder(item);
    }

    private isProjectsFolder(item: SettingsItem): boolean {
        return item.getId() === 'projects';
    }
}
