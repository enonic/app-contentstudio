import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {AEl} from '@enonic/lib-admin-ui/dom/AEl';
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
import {AccessControlEntry} from '../access/AccessControlEntry';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {ContentId} from '../content/ContentId';
import {PrincipalServerEvent} from '../event/PrincipalServerEvent';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {AuthHelper} from '@enonic/lib-admin-ui/auth/AuthHelper';
import {Permission} from '../access/Permission';
import {ContentHelper} from '../util/ContentHelper';

export class UserAccessWidgetItemView
    extends WidgetItemView {

    private contentId: ContentId;

    private accessListView: UserAccessListView;

    private headerEl: SpanEl;

    private bottomEl: AEl;

    public static debug: boolean = false;

    constructor() {
        super('user-access-widget-item-view');
        this.accessListView = new UserAccessListView();

        PrincipalServerEvent.on(AppHelper.debounce(() => {
           this.layoutUserAccess();
        }, 200));
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<void> {
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

        if (!ContentHelper.isAnyPrincipalAllowed(content.getPermissions(), AuthHelper.getPrincipalsKeys(), Permission.WRITE_PERMISSIONS)) {
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

    public layout(): Q.Promise<void> {
        if (UserAccessWidgetItemView.debug) {
            console.debug('UserAccessWidgetItemView.layout');
        }

        this.showLoadMask();

        return super.layout()
            .then(() => this.layoutUserAccess())
            .finally(() => this.hideLoadMask());
    }

    private layoutUserAccess(): Q.Promise<void> {
        if (this.contentId) {
            return new GetContentByIdRequest(this.contentId).sendAndParse().then((content: Content) => {
                if (content) {
                    this.layoutHeader(content);
                    return this.layoutList(content).then(() =>
                        this.layoutBottom(content)
                    );
                }
            });
        }
    }

    private getUserAccessList(results: EffectivePermission[], everyoneAccess: Access): UserAccessListItemView[] {
        return results.filter(
            (item: EffectivePermission) => item.getAccess() !== everyoneAccess && item.getPermissionAccess().getCount() > 0).map(
            (item: EffectivePermission) => {
                const view: UserAccessListItemView = new UserAccessListItemView();
                view.setObject(item);
                view.setCurrentUser(AuthContext.get().getUser());
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

        return everyoneAccess ? i18n(`field.access.${everyoneAccess.toLowerCase()}.everyone`) : i18n('widget.useraccess.restricted');

    }
}
