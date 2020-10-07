import * as Q from 'q';
import {WidgetItemView} from '../../WidgetItemView';
import {VersionList} from './VersionList';
import {ContentServerEventsHandler} from '../../../../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';

export class VersionWidgetItemView extends WidgetItemView {

    private versionListView: VersionList;

    private gridLoadDeferred: Q.Deferred<any>;

    public static debug: boolean = false;

    constructor() {
        super('version-widget-item-view');
        this.managePublishEvent();
    }

    public layout(): Q.Promise<any> {
        if (VersionWidgetItemView.debug) {
            console.debug('VersionsWidgetItemView.layout');
        }
        this.removeChildren();

        return super.layout().then(() => {
            this.versionListView = new VersionList();
            this.versionListView.onLoaded(() => {
                if (this.gridLoadDeferred) {
                    this.gridLoadDeferred.resolve(null);
                    this.gridLoadDeferred = null;
                }
            });

            this.appendChild(this.versionListView);
        });
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<any> {
        if (VersionWidgetItemView.debug) {
            console.debug('VersionsWidgetItemView.setItem: ', item);
        }

        if (this.versionListView) {
            this.versionListView.setContentData(item);
            return this.reloadActivePanel();
        }
        return Q<any>(null);
    }

    private managePublishEvent() {

        let serverEvents = ContentServerEventsHandler.getInstance();

        serverEvents.onContentPublished((contents: ContentSummaryAndCompareStatus[]) => {
            if (this.versionListView && this.versionListView.getContentId()) {
                // check for item because it can be null after publishing pending for delete item
                let itemId = this.versionListView.getContentId();
                let isPublished = contents.some((content) => {
                    return itemId.equals(content.getContentId());
                });

                if (isPublished) {
                    this.reloadActivePanel();
                }
            }
        });
    }

    private reloadActivePanel(): Q.Promise<any> {
        if (VersionWidgetItemView.debug) {
            console.debug('VersionsWidgetItemView.reloadActivePanel');
        }

        if (this.gridLoadDeferred) {
            return this.gridLoadDeferred.promise;
        }

        if (this.versionListView) {
            this.gridLoadDeferred = Q.defer<any>();
            this.versionListView.reload()
                .then(() => this.gridLoadDeferred.resolve(null))
                .catch(reason => this.gridLoadDeferred.reject(reason))
                .finally(() => this.gridLoadDeferred = null);

            return this.gridLoadDeferred.promise;
        } else {
            return Q(null);
        }
    }

}
