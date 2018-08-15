import AccessControlEntry = api.security.acl.AccessControlEntry;
import UserAccessListItemView = api.ui.security.acl.UserAccessListItemView;

export class UserAccessListView
    extends api.ui.selector.list.ListBox<AccessControlEntry> {

    private userAccessListItemViews: UserAccessListItemView[];

    constructor(className?: string) {
        super('user-access-list-view' + (className ? ' ' + className : ''));
    }

    doRender(): wemQ.Promise<boolean> {
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
