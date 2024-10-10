import {LazyListBox} from '@enonic/lib-admin-ui/ui/selector/list/LazyListBox';
import {PrincipalLoader} from '@enonic/lib-admin-ui/security/PrincipalLoader';
import {PrincipalContainerViewer} from '@enonic/lib-admin-ui/ui/security/PrincipalContainerViewer';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ProjectAccessControlEntry} from '../../../../access/ProjectAccessControlEntry';

export class ProjectAccessControlListBox
    extends LazyListBox<ProjectAccessControlEntry> {

    private readonly loader: PrincipalLoader;

    constructor(loader: PrincipalLoader) {
        super('project-access-control-list-box');

        this.loader = loader;
    }

    protected createItemView(item: ProjectAccessControlEntry, readOnly: boolean): PrincipalContainerViewer<ProjectAccessControlEntry> {
        const viewer = new PrincipalContainerViewer<ProjectAccessControlEntry>();
        viewer.setObject(item);
        return viewer;
    }

    protected getItemId(item: ProjectAccessControlEntry): string {
        return item.getPrincipalKey().toString();
    }

    protected handleLazyLoad(): void {
        super.handleLazyLoad();

        if (this.loader.isPartiallyLoaded()) {
            this.loader.load(true);
        }
    }

    protected getScrollContainer(): Element {
        return this;
    }
}
