import {UserAccessListItemView} from './UserAccessListItemView';
import {WidgetItemView} from '../view/detail/WidgetItemView';
import {UserAccessListView} from './UserAccessListView';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {Content} from '../content/Content';
import {AccessControlEntryView} from '../view/AccessControlEntryView';
import {OpenEditPermissionsDialogEvent} from '../event/OpenEditPermissionsDialogEvent';
import {GetEffectivePermissionsRequest} from '../resource/GetEffectivePermissionsRequest';
import {GetContentByIdRequest} from '../resource/GetContentByIdRequest';
import {Access} from './Access';
import {EffectivePermission} from './EffectivePermission';
import {Permission} from '../access/Permission';
import {AccessControlEntry} from '../access/AccessControlEntry';
import ContentId = api.content.ContentId;
import LoginResult = api.security.auth.LoginResult;
import i18n = api.util.i18n;

export class UserAccessWidgetItemView
    extends WidgetItemView {

    private contentId: ContentId;

    private accessListView: UserAccessListView;

    private headerEl: api.dom.SpanEl;

    private bottomEl: api.dom.AEl;

    private loginResult: LoginResult;

    public static debug: boolean = false;

    constructor() {
        super('user-access-widget-item-view');
        this.accessListView = new UserAccessListView();
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): wemQ.Promise<any> {
        const contentId = item.getContentId();
        if (UserAccessWidgetItemView.debug) {
            console.debug('UserAccessWidgetItemView.setContentId: ', contentId);
        }
        this.contentId = contentId;
        return this.layout();
    }

    private layoutHeader(content: Content) {
        if (this.hasChild(this.headerEl)) {
            this.removeChild(this.headerEl);
        }

        const entry: AccessControlEntry = content.getPermissions().getEntry(api.security.RoleKeys.EVERYONE);
        const canEveryoneRead: boolean = !!entry && entry.isAllowed(Permission.READ);

        const headerStr = canEveryoneRead ? i18n('widget.useraccess.everyoneCanRead') : i18n('widget.useraccess.restricted');
        const headerStrEl = new api.dom.SpanEl('header-string').setHtml(headerStr);

        this.headerEl = new api.dom.DivEl('user-access-widget-header');
        this.headerEl.appendChild(new api.dom.DivEl(canEveryoneRead ? 'icon-unlock' : 'icon-lock'));
        this.headerEl.appendChild(headerStrEl);

        this.prependChild(this.headerEl);
    }

    private layoutBottom(content: Content) {

        if (this.hasChild(this.bottomEl)) {
            this.removeChild(this.bottomEl);
        }

        if (!content.isAnyPrincipalAllowed(this.loginResult.getPrincipals(), Permission.WRITE_PERMISSIONS)) {
            return;
        }

        this.bottomEl = new api.dom.AEl('edit-permissions-link');
        this.bottomEl.setHtml(i18n('action.editPermissions'));

        this.appendChild(this.bottomEl);

        this.bottomEl.onClicked((event: MouseEvent) => {

            OpenEditPermissionsDialogEvent.create().applyContent(content).build().fire();

            event.stopPropagation();
            event.preventDefault();
            return false;
        });

    }

    private layoutList(content: Content): wemQ.Promise<boolean> {
        const request = new GetEffectivePermissionsRequest(content.getContentId());

        return request.sendAndParse().then((results: EffectivePermission[]) => {

            if (this.hasChild(this.accessListView)) {
                this.removeChild(this.accessListView);
            }

            const everyoneAccessValue: Access = this.getEveryoneAccessValue(content);
            const userAccessList = this.getUserAccessList(results, everyoneAccessValue);

            this.accessListView = new UserAccessListView();
            this.accessListView.setItemViews(userAccessList);
            this.appendChild(this.accessListView);

            return wemQ.resolve(true);
        });
    }

    public layout(): wemQ.Promise<any> {
        if (UserAccessWidgetItemView.debug) {
            console.debug('UserAccessWidgetItemView.layout');
        }

        return super.layout().then(this.layoutUserAccess.bind(this));
    }

    private layoutUserAccess(): wemQ.Promise<any> {
        return new api.security.auth.IsAuthenticatedRequest().sendAndParse().then((loginResult) => {

            this.loginResult = loginResult;
            if (this.contentId) {
                return new GetContentByIdRequest(this.contentId).sendAndParse().then((content: Content) => {
                    if (content) {
                        this.layoutHeader(content);
                        return this.layoutList(content).then(() => {
                            this.layoutBottom(content);
                        });
                    }
                });
            }
        });
    }

    private getUserAccessList(results: EffectivePermission[], everyoneAccessValue: Access): UserAccessListItemView[] {

        return results.filter(item => item.getAccess() !== everyoneAccessValue &&
                                      item.getPermissionAccess().getCount() > 0).map((item: EffectivePermission) => {
            const view = new UserAccessListItemView();
            view.setObject(item);
            view.setCurrentUser(this.loginResult.getUser());
            return view;
        });
    }

    private getEveryoneAccessValue(content): Access {
        const entry: AccessControlEntry = content.getPermissions().getEntry(api.security.RoleKeys.EVERYONE);

        if (entry) {
            return AccessControlEntryView.getAccessValueFromEntry(entry);
        }

        return null;
    }
}
