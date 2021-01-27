import * as Q from 'q';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {RepositoryId} from '../../repository/RepositoryId';
import {ProjectContext} from '../../project/ProjectContext';

export class WidgetItemView
    extends DivEl {

    public static debug: boolean = false;

    private scriptNodes: HTMLElement[] = [];

    constructor(className?: string) {
        super('widget-item-view' + (className ? ' ' + className : ''));
    }

    public layout(): Q.Promise<any> {
        if (WidgetItemView.debug) {
            console.debug('WidgetItemView.layout: ', this);
        }
        return Q<any>(null);
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<any> {
        return Q<any>(null);
    }

    private static getFullWidgetUrl(url: string, contentId: string) {
        const branch: string = CONFIG.branch;
        const repository: string = `${RepositoryId.CONTENT_REPO_PREFIX}${ProjectContext.get().getProject().getName()}`;
        const repositoryParam = `repository=${repository}&`;
        const branchParam = branch ? `branch=${branch}&` : '';
        const contentIdParam = contentId ? `contentId=${contentId}&` : '';

        return `${url}?${contentIdParam}${repositoryParam}${branchParam}t=${new Date().getTime()}`;
    }

    private injectScriptNode(node: HTMLElement) {
        const scriptNode = document.createElement('script');
        scriptNode.text = node.innerHTML;
        for(let i = node.attributes.length-1; i >= 0; i--) {
            scriptNode.setAttribute(node.attributes[i].name, node.attributes[i].value);
        }
        document.getElementsByTagName('head')[0].appendChild(scriptNode);
        this.scriptNodes.push(scriptNode);
    }

    private injectWidgetHtml(widgetContainer: HTMLElement) {
        const widgetEl = widgetContainer.querySelector('widget');
        if (!widgetEl) {
            return;
        }

        this.getEl().appendChild(widgetEl);
    }

    private injectWidgetScripts(widgetContainer: HTMLElement) {
        const scriptTags = widgetContainer.querySelectorAll('script');

        let i = 0;
        while (i < scriptTags.length) {
            this.injectScriptNode(scriptTags[i++]);
        }
    }

    public fetchWidgetContents(url: string, contentId: string): Q.Promise<void> {
        const deferred = Q.defer<void>();
        const fullUrl = WidgetItemView.getFullWidgetUrl(url, contentId);
        fetch(fullUrl)
            .then(response => response.text())
            .then((html: string) => {
                const widgetContainer = document.createElement('html');
                widgetContainer.innerHTML = html;

                this.removeChildren();

                this.injectWidgetScripts(widgetContainer);
                this.injectWidgetHtml(widgetContainer);

                deferred.resolve(null);
            })
            .catch(err => {
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
