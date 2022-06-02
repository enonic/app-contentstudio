import * as Q from 'q';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {UserAccessListItemView} from './UserAccessListItemView';
import {AccessControlEntry} from '../access/AccessControlEntry';

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

}
