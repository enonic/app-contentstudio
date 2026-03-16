import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type Element as UiElement} from '@enonic/lib-admin-ui/dom/Element';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import Q from 'q';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContextPanelExtensionElement} from '../../extension/ContextPanelExtensionElement';
import {ProjectContext} from '../../project/ProjectContext';
import {RepositoryId} from '../../repository/RepositoryId';

export interface ExtensionItemViewType {
    layout(): Q.Promise<void>;
    setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<null | void>;
    fetchExtensionContents(url: string, contentId: string): Q.Promise<void>;
    hide(): void;
    show(): void;
}

export class ExtensionItemView
    extends DivEl implements ExtensionItemViewType {

    public static debug: boolean = false;

    private loadMask?: LoadMask;

    private extensionElement: ContextPanelExtensionElement | null = null;

    private lastUrl: string | null = null;

    private lastContentId: string | null = null;

    private restoreInProgress: boolean = false;

    constructor(className?: string) {
        super('extension-item-view' + (className ? ' ' + className : ''));

        // When the container is reloaded (e.g. app redeploy), the custom element may be disconnected and cleaned up.
        // If the view gets attached again without a fresh update call, restore the last rendered extension contents.
        this.onAdded(() => {
            // redoLayout() uses hide()/show() around transitions. If the view is re-attached mid-transition,
            // it can remain hidden. Restore visibility when the parent extension is active.
            const parent: UiElement = this.getParentElement();
            if (parent?.hasClass('active')) {
                this.show();
            }
            this.restoreAfterReconnect();
        });
    }

    public layout(): Q.Promise<void> {
        if (ExtensionItemView.debug) {
            console.debug('ExtensionItemView.layout: ', this);
        }
        return Q();
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<null | void> {
        return Q();
    }

    private static getFullExtensionUrl(url: string, contentId: string | null) {
        const branch: string = CONFIG.has('branch') ? CONFIG.getString('branch') : '';
        const repository: string = `${RepositoryId.CONTENT_REPO_PREFIX}${ProjectContext.get().getProject().getName()}`;
        const repositoryParam = `repository=${repository}&`;
        const branchParam = branch ? `branch=${branch}&` : '';
        const contentIdParam = contentId ? `contentId=${contentId}&` : '';

        return `${url}?${contentIdParam}${repositoryParam}${branchParam}t=${new Date().getTime()}`;
    }

    public fetchExtensionContents(url: string, contentId: string | null): Q.Promise<void> {
        const deferred: Q.Deferred<void> = Q.defer<void>();
        this.lastUrl = url;
        this.lastContentId = contentId;
        const fullUrl: string = ExtensionItemView.getFullExtensionUrl(url, contentId);

        fetch(fullUrl)
            .then(response => response.text())
            .then((html: string) => {
                this.show();
                this.cleanupWidget();
                this.removeChildren();

                // Always create a fresh element to ensure scripts re-execute.
                // Use raw DOM append since this is a native custom element, not a lib-admin-ui Element.
                const extensionElement = ContextPanelExtensionElement.create();
                this.extensionElement = extensionElement;
                this.getHTMLElement().appendChild(extensionElement);

                return this.extensionElement.setHtml(html);
            })
            .then(() => deferred.resolve())
            .catch((error: unknown) => {
                this.handleExtensionRenderError();
                deferred.reject(error);
            });

        return deferred.promise;
    }

    private restoreAfterReconnect(): void {
        if (this.restoreInProgress) {
            return;
        }

        if (!this.lastUrl) {
            return;
        }

        // If the element was disconnected, CustomElement.disconnectedCallback() may have called cleanup(),
        // which clears shadowRoot contents. Restore on re-attach.
        if (this.extensionElement && this.extensionElement.hasContent()) {
            return;
        }

        this.restoreInProgress = true;
        this.fetchExtensionContents(this.lastUrl, this.lastContentId)
            .finally(() => {
                this.restoreInProgress = false;
            });
    }

    public cleanupWidget(): void {
        if (this.extensionElement) {
            this.extensionElement.cleanup();
            this.extensionElement.remove();
            this.extensionElement = null;
        }
    }

    private handleExtensionRenderError(): void {
        const errorElement: DivEl = new DivEl('extension-error');
        errorElement.setHtml(i18n('widget.render.error'));
        this.appendChild(errorElement);
    }

    protected showLoadMask(): void {
        if (!this.loadMask) {
            this.loadMask = new LoadMask(this);
        }

        this.appendChild(this.loadMask);
        this.loadMask.show();
    }

    protected hideLoadMask(): void {
        this.loadMask?.hide();

        if (this.hasChild(this.loadMask)) {
            this.removeChild(this.loadMask);
        }
    }
}
