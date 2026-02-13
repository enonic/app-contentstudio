import {LazyListBox} from '@enonic/lib-admin-ui/ui/selector/list/LazyListBox';
import {type PrincipalLoader} from '@enonic/lib-admin-ui/security/PrincipalLoader';
import {type AccessControlEntry} from '../access/AccessControlEntry';
import {PrincipalContainerViewer} from '@enonic/lib-admin-ui/ui/security/PrincipalContainerViewer';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';

export class AccessControlListBox
    extends LazyListBox<AccessControlEntry> {

    private readonly loader: PrincipalLoader;

    constructor(loader: PrincipalLoader) {
        super('access-control-list-box');

        this.loader = loader;
    }

    protected createItemView(item: AccessControlEntry, readOnly: boolean): PrincipalContainerViewer<AccessControlEntry> {
        const viewer = new PrincipalContainerViewer<AccessControlEntry>();
        viewer.setObject(item);
        return viewer;
    }

    protected getItemId(item: AccessControlEntry): string {
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
