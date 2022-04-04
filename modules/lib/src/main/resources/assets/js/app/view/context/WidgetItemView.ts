import * as Q from 'q';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {RepositoryId} from '../../repository/RepositoryId';
import {ProjectContext} from '../../project/ProjectContext';
import {CONFIG} from 'lib-admin-ui/util/Config';
import {WidgetHelper} from '../../util/WidgetHelper';

export class WidgetItemView
    extends DivEl {

    public static debug: boolean = false;

    private scriptNodes: HTMLElement[] = [];

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
        this.scriptNodes.push(...WidgetHelper.injectWidgetHtml(html, this).scriptElements);
    }

    public fetchWidgetContents(url: string, contentId: string): Q.Promise<void> {
        const deferred = Q.defer<void>();
        const fullUrl = WidgetItemView.getFullWidgetUrl(url, contentId);
        fetch(fullUrl)
            .then(response => response.text())
            .then((html: string) => {
                this.removeChildren();
                this.injectWidget(html);
                deferred.resolve();
            })
            .catch(err => {
                deferred.reject();
                throw new Error('Failed to fetch page: ' + err);
            });

        return deferred.promise;
    }

    public reset() {
        const documentHead = document.getElementsByTagName('head')[0];
        this.scriptNodes.forEach((scriptNode: HTMLElement) => documentHead.removeChild(scriptNode));
        this.scriptNodes = [];
    }
}
