import * as Q from 'q';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {RepositoryId} from '../../repository/RepositoryId';
import {ProjectContext} from '../../project/ProjectContext';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {WidgetHelper} from '../../util/WidgetHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {WidgetInjectionResult} from '../../util/WidgetInjectionResult';
import {Element} from '@enonic/lib-admin-ui/dom/Element';

export class WidgetItemView
    extends DivEl {

    public static debug: boolean = false;

    private injectedNodes: HTMLElement[] = [];

    private widgetContainer?: Element;

    constructor(className?: string) {
        super('widget-item-view' + (className ? ' ' + className : ''));
    }

    public layout(): Q.Promise<void> {
        if (WidgetItemView.debug) {
            console.debug('WidgetItemView.layout: ', this);
        }
        return Q();
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<void> {
        return Q();
    }

    private static getFullWidgetUrl(url: string, contentId: string) {
        const branch: string = CONFIG.getString('branch');
        const repository: string = `${RepositoryId.CONTENT_REPO_PREFIX}${ProjectContext.get().getProject().getName()}`;
        const repositoryParam = `repository=${repository}&`;
        const branchParam = branch ? `branch=${branch}&` : '';
        const contentIdParam = contentId ? `contentId=${contentId}&` : '';

        return `${url}?${contentIdParam}${repositoryParam}${branchParam}t=${new Date().getTime()}`;
    }

    private injectWidget(html: string) {
        const result: WidgetInjectionResult = WidgetHelper.injectWidgetHtml(html, this);
        this.injectedNodes.push(...result.scriptElements);
        this.injectedNodes.push(...result.linkElements);
    }

    public fetchWidgetContents(url: string, contentId: string): Q.Promise<void> {
        const deferred: Q.Deferred<void> = Q.defer<void>();
        const fullUrl: string = WidgetItemView.getFullWidgetUrl(url, contentId);

        fetch(fullUrl)
            .then(response => response.text())
            .then((html: string) => {
                this.removeChildren();
                this.reset();
                this.injectWidget(html);
                deferred.resolve();
            })
            .catch(() => {
                deferred.reject();
                this.handleWidgetRenderError();
            });

        return deferred.promise;
    }

    private handleWidgetRenderError(): void {
        const errorElement: DivEl = new DivEl('widget-error');
        errorElement.setHtml(i18n('widget.render.error'));
        this.appendChild(errorElement);
    }

    public reset() {
        const documentHead = document.getElementsByTagName('head')[0];
        this.injectedNodes.forEach((injectedNode: HTMLElement) => documentHead.removeChild(injectedNode));
        this.injectedNodes = [];
        this.widgetContainer?.getHTMLElement().dispatchEvent(new Event('remove'));
    }
}
