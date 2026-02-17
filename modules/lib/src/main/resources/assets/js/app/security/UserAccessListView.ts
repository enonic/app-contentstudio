import type Q from 'q';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {type UserAccessListItemView} from './UserAccessListItemView';
import {type AccessControlEntry} from '../access/AccessControlEntry';

export class UserAccessListView
    extends ListBox<AccessControlEntry> {

    private userAccessListItemViews: UserAccessListItemView[];

    constructor(className?: string) {
        super('user-access-list-view' + (className ? ' ' + className : ''));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {

            if (this.userAccessListItemViews && this.userAccessListItemViews.length > 0) {
                this.userAccessListItemViews.forEach((userAccessListItemView: UserAccessListItemView) => {
                    this.appendChild(userAccessListItemView);
                });
            }
            return rendered;
        });
    }

    setItemViews(userAccessListItemViews: UserAccessListItemView[]) {
        this.userAccessListItemViews = userAccessListItemViews;
    }

    protected createItemView(item: AccessControlEntry, readOnly: boolean): Element {
        return null;
    }

    protected getItemId(_item: AccessControlEntry): string {
        return '';
    }

}
