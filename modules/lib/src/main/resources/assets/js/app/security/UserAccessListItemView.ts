import {i18n} from 'lib-admin-ui/util/Messages';
import {ResponsiveManager} from 'lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from 'lib-admin-ui/ui/responsive/ResponsiveItem';
import {Viewer} from 'lib-admin-ui/ui/Viewer';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {Principal} from 'lib-admin-ui/security/Principal';
import {EffectivePermission} from './EffectivePermission';
import {EffectivePermissionMember} from './EffectivePermissionMember';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {PrincipalViewerCompact} from 'lib-admin-ui/ui/security/PrincipalViewer';

export class UserAccessListItemView
    extends Viewer<EffectivePermission> {

    private userLine: DivEl;

    private accessLine: DivEl;

    private resizeListener: (item: ResponsiveItem) => void;

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
            this.appendChildren(this.accessLine, this.userLine);

            this.resizeListener = this.setExtraCount.bind(this);
            ResponsiveManager.onAvailableSizeChanged(this, this.resizeListener);

            this.userLine.onRendered(() => {
                this.setExtraCount();
            });
        }

        if (object) {
            this.accessLine.setHtml(i18n(`security.access.${object.getAccess()}`));

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

    remove(): any {
        ResponsiveManager.unAvailableSizeChanged(this);
        return super.remove();
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
