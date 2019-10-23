import * as Q from 'q';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';

export class WidgetItemView
    extends DivEl {

    public static debug: boolean = false;

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
        const {repository, branch} = CONFIG;
        const repositoryParam = repository ? `repository=${repository}&` : '';
        const branchParam = branch ? `branch=${branch}&` : '';
        const contentIdParam = contentId ? `contentId=${contentId}&` : '';

        return `${url}?${contentIdParam}${repositoryParam}${branchParam}t=${new Date().getTime()}`;
    }

    public fetchWidgetContents(url: string, contentId: string): Q.Promise<void> {
        const deferred = Q.defer<void>();
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
