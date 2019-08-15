import {ContentLayer} from '../content/ContentLayer';
import {LayerViewer} from './LayerViewer';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import ContentPath = api.content.ContentPath;


export class ContentOfLayerViewer
    extends LayerViewer {

    protected content: ContentSummaryAndCompareStatus;

    constructor() {
        super('content-of-layer-viewer');
    }

    setObjects(object: ContentLayer, content: ContentSummaryAndCompareStatus) {
        this.content = content;
        return this.setObject(object);
    }

    resolveDisplayName(object: ContentLayer): string {
        return `${object.getDisplayName()} (${object.getName()})`;
    }

    resolveSubName(): string {
        if (this.content && this.content.getContentSummary()) {
            const contentSummary = this.content.getContentSummary();
            const contentName = contentSummary.getName();
            return !contentName.isUnnamed() ? contentSummary.getPath().toString() :
                   ContentPath.fromParent(contentSummary.getPath().getParentPath(),
                       api.content.ContentUnnamed.prettifyUnnamed()).toString();
        }

        return '';
    }

}
