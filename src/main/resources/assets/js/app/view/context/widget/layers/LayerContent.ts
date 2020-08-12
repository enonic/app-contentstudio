import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {Project} from '../../../../settings/data/project/Project';
import {ContentId} from 'lib-admin-ui/content/ContentId';

export class LayerContent {

    private readonly item: ContentSummaryAndCompareStatus;

    private readonly project: Project;

    constructor(item: ContentSummaryAndCompareStatus, project: Project) {
        this.item = item;
        this.project = project;
    }

    getItem(): ContentSummaryAndCompareStatus {
        return this.item;
    }

    getProject(): Project {
        return this.project;
    }

    getItemId(): string {
        return this.item.getId();
    }

    getContentId(): ContentId {
        return this.item.getContentId();
    }
}
