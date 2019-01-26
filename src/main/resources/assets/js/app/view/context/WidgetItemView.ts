import LinkEl = api.dom.LinkEl;
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

    private getFullWidgetUrl(url: string, contentId: string) {
        const {repository, branch} = CONFIG;
        const repositoryParam = repository ? `repository=${repository}&` : '';
        const branchParam = branch ? `branch=${branch}&` : '';
        const contentIdParam = contentId ? `contentId=${contentId}&` : '';

        return `${url}?${contentIdParam}${repositoryParam}${branchParam}t=${new Date().getTime()}`;
    }

    public setUrl(url: string, contentId: string): wemQ.Promise<void> {
        let deferred = wemQ.defer<void>();
        let linkEl = new LinkEl(this.getFullWidgetUrl(url, contentId)).setAsync();
        let el = this.getEl();
        let onLinkLoaded = ((event: UIEvent) => {
                const mainContainer = event.target['import'].querySelector('widget');
                if (mainContainer) {
                    el.appendChild(mainContainer);
                }
                linkEl.remove();
                deferred.resolve(null);
            });

        this.removeChildren();
        linkEl.onLoaded(onLinkLoaded);
        document.head.appendChild(linkEl.getHTMLElement());

        return deferred.promise;
    }
}
