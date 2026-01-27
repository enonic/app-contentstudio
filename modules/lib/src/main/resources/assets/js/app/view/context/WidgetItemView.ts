import Q from 'q';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {RepositoryId} from '../../repository/RepositoryId';
import {ProjectContext} from '../../project/ProjectContext';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {ExternalWidgetElement} from './ExternalWidgetElement';

export class WidgetItemView
    extends DivEl {

    public static debug: boolean = false;

    private loadMask?: LoadMask;

    private widgetElement: ExternalWidgetElement | null = null;

    constructor(className?: string) {
        super('widget-item-view' + (className ? ' ' + className : ''));
    }

    public layout(): Q.Promise<void> {
        if (WidgetItemView.debug) {
            console.debug('WidgetItemView.layout: ', this);
        }
        return Q();
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<null | void> {
        return Q();
    }

    private static getFullWidgetUrl(url: string, contentId: string) {
        const branch: string = CONFIG.has('branch') ? CONFIG.getString('branch') : '';
        const repository: string = `${RepositoryId.CONTENT_REPO_PREFIX}${ProjectContext.get().getProject().getName()}`;
        const repositoryParam = `repository=${repository}&`;
        const branchParam = branch ? `branch=${branch}&` : '';
        const contentIdParam = contentId ? `contentId=${contentId}&` : '';

        return `${url}?${contentIdParam}${repositoryParam}${branchParam}t=${new Date().getTime()}`;
    }

    public fetchWidgetContents(url: string, contentId: string): Q.Promise<void> {
        const deferred: Q.Deferred<void> = Q.defer<void>();
        const fullUrl: string = WidgetItemView.getFullWidgetUrl(url, contentId);

        fetch(fullUrl)
            .then(response => response.text())
            .then((html: string) => {
                // Clean up previous widget element completely
                if (this.widgetElement) {
                    this.widgetElement.cleanup();
                    this.widgetElement = null;
                }
                this.removeChildren();

                // Always create a fresh widget element to ensure scripts re-execute
                this.widgetElement = document.createElement('external-widget') as ExternalWidgetElement;
                this.getHTMLElement().appendChild(this.widgetElement);

                return this.widgetElement.setWidgetContent(html);
            })
            .then(() => deferred.resolve())
            .catch(() => {
                deferred.reject();
                this.handleWidgetRenderError();
            });

        return deferred.promise;
    }

    public cleanupWidget(): void {
        if (this.widgetElement) {
            this.widgetElement.cleanup();
        }
    }

    private handleWidgetRenderError(): void {
        const errorElement: DivEl = new DivEl('widget-error');
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
