import {Project} from '../../settings/data/project/Project';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ProjectIconUrlResolver} from '../ProjectIconUrlResolver';

export class ProjectListItemViewer
    extends NamesAndIconViewer<Project> {

    private static DEFAULT_ICON_CLASS: string = 'icon-tree-2';

    constructor() {
        super('project-list-item-viewer');
    }

    resolveDisplayName(item: Project): string {
        return item.getDisplayName();
    }

    resolveUnnamedDisplayName(object: Project): string {
        return '';
    }

    resolveSubName(item: Project, relativePath: boolean = false): string {
        return item.getDescription() || `<${i18n('text.noDescription')}>`;
    }

    resolveIconClass(item: Project): string {
        return `icon-large ${item.getIcon() || ProjectListItemViewer.DEFAULT_ICON_CLASS}`;
    }

    resolveIconUrl(item: Project): string {
        return item.getIcon() ? new ProjectIconUrlResolver()
            .setProjectName(item.getName())
            .setTimestamp(new Date().getTime())
            .resolve() : null;
    }
}
