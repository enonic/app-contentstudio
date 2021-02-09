import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {AEl} from 'lib-admin-ui/dom/AEl';
import {UserAccessListItemView} from './UserAccessListItemView';
import {WidgetItemView} from '../view/context/WidgetItemView';
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
import {LoginResult} from 'lib-admin-ui/security/auth/LoginResult';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {RoleKeys} from 'lib-admin-ui/security/RoleKeys';
import {IsAuthenticatedRequest} from 'lib-admin-ui/security/auth/IsAuthenticatedRequest';

export class UserAccessWidgetItemView
    extends WidgetItemView {

    private contentId: ContentId;

    private accessListView: UserAccessListView;

    private headerEl: SpanEl;

    private bottomEl: AEl;

    private loginResult: LoginResult;

    public static debug: boolean = false;

    constructor() {
        super('user-access-widget-item-view');
        this.accessListView = new UserAccessListView();
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<any> {
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

        const everyoneHasAccess: boolean = !!content.getPermissions().getEntry(RoleKeys.EVERYONE);

        const headerStr = this.getEveryoneAccessDescription(content);

        const headerStrEl = new SpanEl('header-string').setHtml(headerStr);

        this.headerEl = new DivEl('user-access-widget-header');
        this.headerEl.addClass(everyoneHasAccess ? 'icon-unlock' : 'icon-lock');
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

        this.bottomEl = new AEl('edit-permissions-link');
        this.bottomEl.setHtml(i18n('action.editPermissions'));

        this.appendChild(this.bottomEl);

        this.bottomEl.onClicked((event: MouseEvent) => {

            OpenEditPermissionsDialogEvent.create().applyContent(content).build().fire();

            event.stopPropagation();
            event.preventDefault();
            return false;
        });

    }

    private layoutList(content: Content): Q.Promise<boolean> {
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

            return Q.resolve(true);
        });
    }

    public layout(): Q.Promise<any> {
        if (UserAccessWidgetItemView.debug) {
            console.debug('UserAccessWidgetItemView.layout');
        }

        return super.layout().then(this.layoutUserAccess.bind(this));
    }

    private layoutUserAccess(): Q.Promise<any> {
        return new IsAuthenticatedRequest().sendAndParse().then((loginResult) => {

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

    private getEveryoneAccessValue(content: Content): Access {
        const entry: AccessControlEntry = content.getPermissions().getEntry(RoleKeys.EVERYONE);

        if (entry) {
            return AccessControlEntryView.getAccessValueFromEntry(entry);
        }

        return null;
    }

    private getEveryoneAccessDescription(content: Content): string {
        const everyoneAccess: Access = this.getEveryoneAccessValue(content);

        return everyoneAccess ? i18n(`field.access.${everyoneAccess}.everyone`) : i18n('widget.useraccess.restricted');

    }
}
