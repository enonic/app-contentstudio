import {IconUrlResolver} from 'lib-admin-ui/icon/IconUrlResolver';
import {UriHelper} from 'lib-admin-ui/util/UriHelper';
import {assertNotNull} from 'lib-admin-ui/util/Assert';

export class ProjectIconUrlResolver
    extends IconUrlResolver {

    public static DEFAULT_ICON_CLASS: string = 'icon-tree-2';

    private static PREFIX: string = UriHelper.getRestUri('project/icon/');

    private name: string;

    private size: number;

    private ts: number;

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

        let result = ProjectIconUrlResolver.PREFIX + this.name;

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
