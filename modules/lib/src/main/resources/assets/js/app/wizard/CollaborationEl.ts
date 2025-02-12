import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {PrincipalViewerCompact} from '@enonic/lib-admin-ui/ui/security/PrincipalViewer';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import * as Q from 'q';
import {ContentId} from '../content/ContentId';
import {ProjectContext} from '../project/ProjectContext';
import {GetPrincipalsByKeysRequest} from '../security/GetPrincipalsByKeysRequest';
import {subscribe as subscribeToCollaborators} from '../stores/collaboration';

export class CollaborationEl
    extends DivEl {

    private currentUser: Principal;

    private usersBlock: DivEl;

    private counterBlock: DivEl;

    private collaborators: PrincipalKey[] = [];

    constructor(contentId: ContentId) {
        super('content-wizard-toolbar-collaboration');

        this.currentUser = AuthContext.get().getUser();

        this.initElements();
        this.initListeners(contentId);
    }

    private initElements(): void {
        this.usersBlock = new DivEl('users');
        this.counterBlock = new DivEl('extra');
        this.counterBlock.hide();

        this.appendChildren(this.usersBlock, this.counterBlock);
    }

    private initListeners(contentId: ContentId): void {
        const resizeListener = AppHelper.debounce(this.updateVisibleElements.bind(this), 200);
        ResponsiveManager.onAvailableSizeChanged(this, resizeListener);

        this.whenRendered(() => this.updateVisibleElements());

        const project = ProjectContext.get().getProject().getName();
        const unsubscribeToCollaborators = subscribeToCollaborators(contentId.toString(), project, (collaborators) => {
            this.handleCollaboratorsUpdated(collaborators);
        });

        this.onRemoved(() => {
            unsubscribeToCollaborators();
        });
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
        const nonOriginalElements = this.getChildren().filter((el: Element) => el !== this.usersBlock && el !== this.counterBlock);
        const extras = nonOriginalElements.reduce((acc: number, el: Element) => acc + el.getEl().getWidthWithMargin(), 0);
        const availableWidth: number = this.getEl().getWidth() - extras;

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
            if (title.length > 0) {
                title += '\n';
            }
            title = title + viewer.getObject().getDisplayName();
        });

        this.counterBlock.setTitle(title);
    }

    private handleCollaboratorsUpdated(collaborators: Set<string>): void {
        const collaboratorsKeys = Array.from(collaborators).map(c => PrincipalKey.fromString(c));
        this.collaborators = collaboratorsKeys;

        this.addMissingCollaborators();
        this.removeStaleCollaborators();

        const isSingle = collaboratorsKeys.length < 2;
        this.toggleClass('single', isSingle);
        this.toggleClass('multiple', !isSingle);
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
