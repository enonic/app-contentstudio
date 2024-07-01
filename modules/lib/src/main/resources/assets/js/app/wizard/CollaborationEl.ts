import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {PrincipalViewerCompact} from '@enonic/lib-admin-ui/ui/security/PrincipalViewer';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import * as Q from 'q';
import {ContentId} from '../content/ContentId';
import {CollaborationServerEvent} from '../event/CollaborationServerEvent';
import {ProjectContext} from '../project/ProjectContext';
import {GetPrincipalsByKeysRequest} from '../security/GetPrincipalsByKeysRequest';

export class CollaborationEl
    extends DivEl {

    private currentUser?: Principal;

    private usersBlock: DivEl;

    private counterBlock: DivEl;

    private collaborators: PrincipalKey[] = [];

    private readonly contentId: ContentId;

    constructor(contentId: ContentId) {
        super('content-wizard-toolbar-collaboration');

        this.contentId = contentId;

        this.initElements();
        this.initListeners();
    }

    private initElements(): void {
        this.usersBlock = new DivEl('users');
        this.counterBlock = new DivEl('extra');
        this.counterBlock.hide();

        this.appendChildren(this.usersBlock, this.counterBlock);

        this.initCurrentUser();
    }

    private initCurrentUser(): void {
        new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            this.currentUser = loginResult.getUser();
            return Q(null);
        }).catch(DefaultErrorHandler.handle);
    }

    private initListeners(): void {
        const resizeListener = AppHelper.debounce(this.updateVisibleElements.bind(this), 200);
        ResponsiveManager.onAvailableSizeChanged(this, resizeListener);

        this.whenRendered(() => this.updateVisibleElements());

        CollaborationServerEvent.on(this.handeCollaborationEvent.bind(this));
    }

    private updateVisibleElements(): void {
        if (this.usersBlock.getChildren().length === 0 || !this.isRendered()) {
            return;
        }

        const numOfUsersFitting: number = this.getVisibleCount();
        const totalUsers: number = this.usersBlock.getChildren().length;
        // if some items not fitting then showing one item less to save a space for a counter
        const numOfUsersToDisplay: number = totalUsers === numOfUsersFitting ? totalUsers : Math.max(numOfUsersFitting - 1, 1);
        const numOfUsersHidden: number = totalUsers - numOfUsersToDisplay;

        this.usersBlock.getChildren().forEach((userEl: Element, index: number) => userEl.setVisible(index < numOfUsersToDisplay));
        this.updateCounterBlock(numOfUsersHidden);
    }

    private getVisibleCount(): number {
        const userElWidth: number = this.usersBlock.getChildren()[0].getEl().getWidthWithMargin();
        const availableWidth: number = this.getEl().getWidth();

        return Math.floor(availableWidth / userElWidth);
    }

    private updateCounterBlock(numOfUsersHidden: number): void {
        this.counterBlock.setVisible(numOfUsersHidden > 0);

        if (numOfUsersHidden === 0) {
            return;
        }

        this.counterBlock.setHtml(`+${numOfUsersHidden}`);

        let title: string = '';
        this.usersBlock.getChildren().forEach((viewer: PrincipalViewerCompact) => {
            title = title + viewer.getObject().getDisplayName() + '\n';
        });

        this.counterBlock.setTitle(title);
    }

    private handeCollaborationEvent(event: CollaborationServerEvent): void {
        if (event.getContentId().equals(this.contentId) && event.getProject() === ProjectContext.get().getProject().getName()) {
            this.handleContentCollaborationEvent(event);
        }
    }

    private handleContentCollaborationEvent(event: CollaborationServerEvent): void {
        this.collaborators = event.getCollaborators();

        this.addMissingCollaborators();
        this.removeStaleCollaborators();

        this.toggleClass('single', event.getCollaborators().length === 1);
        this.toggleClass('multiple', event.getCollaborators().length > 1);
    }

    private addMissingCollaborators(): void {
        const collaboratorsToAdd: PrincipalKey[] = this.collaborators.filter((userKey: PrincipalKey) => !this.containsUserWithKey(userKey));

        if (collaboratorsToAdd.length === 0) {
            return;
        }

        if (collaboratorsToAdd.length === 1 && collaboratorsToAdd[0].equals(this.currentUser?.getKey())) {
            this.addCollaborators([this.currentUser]);
            return;
        }

        this.fetchAndAddCollaborators(collaboratorsToAdd);
    }

    private containsUserWithKey(userKey: PrincipalKey): boolean {
        return this.usersBlock.getChildren().some((viewer: PrincipalViewerCompact) => viewer.getObject().getKey().equals(userKey));
    }

    private addCollaborators(collaborators: Principal[]): void {
        const renderPromises: Q.Deferred<void>[] = [];

        collaborators.forEach((collaborator: Principal) => {
            const viewer: PrincipalViewerCompact = new PrincipalViewerCompact();
            viewer.setCurrentUser(this.currentUser);
            viewer.setObject(collaborator);

            // triggering check for available space only after all viewers are rendered and we can calc their width
            const deferred = Q.defer<void>();
            renderPromises.push(deferred);
            viewer.whenRendered(() => {
                deferred.resolve();
            });

            this.usersBlock.appendChild(viewer);
        });

        Q.all(renderPromises).then(() => {
            this.updateVisibleElements();
        });
    }

    private fetchAndAddCollaborators(collaboratorsToAdd: PrincipalKey[]): void {
        new GetPrincipalsByKeysRequest(collaboratorsToAdd).sendAndParse().then((collaborators: Principal[]) => {
            // putting current user at first place
            if (this.currentUser) {
                collaborators.sort(this.sortItemsCurrentUserFirst.bind(this));
            }

            this.addCollaborators(collaborators);

            return Q(null);
        }).catch(DefaultErrorHandler.handle);
    }

    private sortItemsCurrentUserFirst(a: Principal, b: Principal): number {
        if (a.getKey().equals(this.currentUser.getKey())) {
            return -1;
        }

        if (b.getKey().equals(this.currentUser.getKey())) {
            return 1;
        }

        return 0;
    }

    private removeStaleCollaborators(): void {
        this.getViewersToRemove().forEach((viewer: PrincipalViewerCompact) => this.usersBlock.removeChild(viewer));
        this.updateVisibleElements();
    }

    private getViewersToRemove(): PrincipalViewerCompact[] {
        const viewersToRemove: PrincipalViewerCompact[] = [];

        this.usersBlock.getChildren().filter((viewer: PrincipalViewerCompact) => {
            const existingUserKey: PrincipalKey = viewer.getObject().getKey();

            if (!this.isCollaborator(existingUserKey)) {
                viewersToRemove.push(viewer);
            }
        });

        return viewersToRemove;
    }

    private isCollaborator(key: PrincipalKey): boolean {
        return key.equals(this.currentUser?.getKey()) || this.collaborators.some((colKey: PrincipalKey) => colKey.equals(key));
    }

}
