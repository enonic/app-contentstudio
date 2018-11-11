import LinkEl = api.dom.LinkEl;
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';

export class WidgetItemView extends api.dom.DivEl {

    public static debug: boolean = false;
    private uid: string = '';

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

    private getFullWidgetUrl(url: string, uid: string, contentId: string) {
        return url + '?uid=' + uid + '&contentId=' + contentId;
    }

    public setUrl(url: string, contentId: string, keepId: boolean = false): wemQ.Promise<void> {
        let deferred = wemQ.defer<void>();
        let uid = (!keepId || !this.uid) ? Date.now().toString() : this.uid;
        let linkEl = new LinkEl(this.getFullWidgetUrl(url, uid, contentId)).setAsync();
        let el = this.getEl();
        let onLinkLoaded = ((event: UIEvent) => {
                const mainContainer = event.target['import'].querySelector('widget');
                if (mainContainer) {
                    el.appendChild(mainContainer);
                }
                linkEl.remove();
                deferred.resolve(null);
            });

        this.uid = uid;
        this.removeChildren();

        linkEl.onLoaded(onLinkLoaded);
        document.head.appendChild(linkEl.getHTMLElement());

        return deferred.promise;
    }
}
