import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';

export class ArchiveItemViewer
    extends ContentSummaryAndCompareStatusViewer {

    protected toggleState(): void {
        // Disable state icons for dependant items
    }
}
