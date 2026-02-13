import {type Project} from '../settings/data/project/Project';
import {IconUrlResolver} from '@enonic/lib-admin-ui/icon/IconUrlResolver';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';
import {UrlHelper} from '../util/UrlHelper';

export class ProjectIconUrlResolver
    extends IconUrlResolver {

    private static DEFAULT_PROJECT_ICON_CLASS: string = 'icon-tree-2';

    private static DEFAULT_LAYER_ICON_CLASS: string = 'icon-layer';

    private name: string;

    private size: number;

    private ts: number;

    static getDefaultIcon(project: Project) {
        return project.hasParents() ? ProjectIconUrlResolver.DEFAULT_LAYER_ICON_CLASS : ProjectIconUrlResolver.DEFAULT_PROJECT_ICON_CLASS;
    }

    static getDefaultProjectIcon() {
        return ProjectIconUrlResolver.DEFAULT_PROJECT_ICON_CLASS;
    }

    static getDefaultLayerIcon() {
        return ProjectIconUrlResolver.DEFAULT_LAYER_ICON_CLASS;
    }

    setProjectName(value: string): ProjectIconUrlResolver {
        this.name = value;
        return this;
    }

    setSize(value: number): ProjectIconUrlResolver {
        this.size = value;
        return this;
    }

    setTimestamp(value: number): ProjectIconUrlResolver {
        this.ts = value;
        return this;
    }

    resolve(): string {
        this.validate();

        // fetching it dynamically since it can be changed in UriHelper.setAdminUri
        const prefix: string = UrlHelper.getCmsRestUri('project/icon/');

        let result: string = prefix + this.name;

        if (this.size != null) {
            result = super.appendParam('scaleSize', this.size.toString(), result);
        }

        if (this.ts != null) {
            result = super.appendParam('ts', this.ts.toString(), result);
        }

        return result;
    }

    private validate() {
        assertNotNull(this.name, 'Project name cannot be null');
    }
}
