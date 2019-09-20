import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';

export class WidgetItemView extends api.dom.DivEl {

    public static debug: boolean = false;

    constructor(className?: string) {
        super('widget-item-view' + (className ? ' ' + className : ''));
    }

    public layout(): wemQ.Promise<any> {
        if (WidgetItemView.debug) {
            console.debug('WidgetItemView.layout: ', this);
        }
        return wemQ<any>(null);
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): wemQ.Promise<any> {
        return wemQ<any>(null);
    }

    public setNoContent() {
        //
    }

    private static getFullWidgetUrl(url: string, contentId: string) {
        const {repository, branch} = CONFIG;
        const repositoryParam = repository ? `repository=${repository}&` : '';
        const branchParam = branch ? `branch=${branch}&` : '';
        const contentIdParam = contentId ? `contentId=${contentId}&` : '';

        return `${url}?${contentIdParam}${repositoryParam}${branchParam}t=${new Date().getTime()}`;
    }

    public fetchWidgetContents(url: string, contentId: string): wemQ.Promise<void> {
        const deferred = wemQ.defer<void>();
        const fullUrl = WidgetItemView.getFullWidgetUrl(url, contentId);
        fetch(fullUrl)
            .then(response => response.text())
            .then((html: string) => {
                const div = document.createElement('div');
                div.innerHTML = html;

                this.removeChildren();
                this.getEl().appendChild(div.firstChild);

                deferred.resolve(null);
            })
            .catch(err => {
                throw new Error('Failed to fetch page: ' + err);
            });

        return deferred.promise;
    }
}
