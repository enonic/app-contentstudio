import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Viewer} from '@enonic/lib-admin-ui/ui/Viewer';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {EffectivePermission} from './EffectivePermission';
import {EffectivePermissionMember} from './EffectivePermissionMember';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {PrincipalViewerCompact} from '@enonic/lib-admin-ui/ui/security/PrincipalViewer';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ACCESS_OPTIONS} from './Access';

export class UserAccessListItemView
    extends Viewer<EffectivePermission> {

    private userLine: DivEl;

    private accessLine: DivEl;

    private resizeListener: () => void;

    private currentUser: Principal;

    public static debug: boolean = false;

    constructor(className?: string) {
        super('user-access-list-item-view' + (className ? ' ' + className : ''));
    }

    setCurrentUser(user: Principal) {
        this.currentUser = user;
    }

    doLayout(object: EffectivePermission) {
        super.doLayout(object);

        if (UserAccessListItemView.debug) {
            console.debug('UserAccessListItemView.doLayout');
        }

        if (!this.accessLine && !this.userLine) {
            this.accessLine = new SpanEl('access-line');
            this.userLine = new DivEl('user-line');
            this.appendChildren(this.userLine, this.accessLine);

            this.resizeListener = this.setExtraCount.bind(this);
            if (window.ResizeObserver) {
                new ResizeObserver(AppHelper.debounce(this.resizeListener, 200)).observe(this.getHTMLElement());
            }
            this.userLine.onRendered(() => {
                this.setExtraCount();
            });
        }

        if (object) {
            const access = object.getAccess().toString();
            const status = ACCESS_OPTIONS.find((option) => option.id === access).displayName;
            this.accessLine.setHtml(status).setTitle(status);

            object.getMembers().map((epm: EffectivePermissionMember) => epm.toPrincipal()).forEach((principal: Principal) => {
                const principalViewer: PrincipalViewerCompact = new PrincipalViewerCompact();
                principalViewer.setObject(principal);
                principalViewer.setCurrentUser(this.currentUser);

                if (this.currentUser && this.currentUser.getKey().equals(principal.getKey())) {
                    this.userLine.insertChild(principalViewer, 0);
                } else {
                    this.userLine.appendChild(principalViewer);
                }
            });
        }
    }

    private setExtraCount() {
        if (this.userLine.getChildren().length > 0) {
            let visibleCount = this.getVisibleCount();
            let iconCount = this.getObject().getPermissionAccess().getCount();
            let extraCount = iconCount - visibleCount;

            if (extraCount > 0) {
                this.userLine.getEl().setAttribute('extra-count', '+' + extraCount);
            } else {
                this.userLine.getEl().removeAttribute('extra-count');
            }
        }
    }

    private getVisibleCount(): number {
        let userIcons = this.userLine.getChildren();
        let count = 0;
        for (let userIcon of userIcons) {
            if (userIcon.getEl().getOffsetTopRelativeToParent() === 0) {
                count++;
            } else {
                break;
            }
        }
        return count;
    }

}
