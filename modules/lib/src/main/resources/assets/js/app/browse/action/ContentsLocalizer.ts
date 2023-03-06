import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import * as Q from 'q';
import {ProjectContext} from '../../project/ProjectContext';
import {EditContentEvent} from '../../event/EditContentEvent';
import {ContentId} from '../../content/ContentId';
import {LocalizeContentsRequest} from '../../resource/LocalizeContentsRequest';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentEventsProcessor} from '../../ContentEventsProcessor';

export class ContentsLocalizer {

    private contents: ContentSummaryAndCompareStatus[];

    localize(contents: ContentSummaryAndCompareStatus[]): Q.Promise<void> {
        if (!contents || contents.length === 0) {
            return Q.resolve();
        }

        this.contents = contents;

        return this.localizeContents();
    }

    private localizeContents(): Q.Promise<void> {
        const projectLang: string = ProjectContext.get().getProject().getLanguage();
        const contentsToEdit: ContentSummaryAndCompareStatus[] = [];
        const contentsToLocalize: ContentSummaryAndCompareStatus[] = [];

        this.contents.forEach((content: ContentSummaryAndCompareStatus) => {
            if (content.getLanguage() !== projectLang) {
                contentsToLocalize.push(content);
            } else {
                contentsToEdit.push(content);
            }
        });

        if (contentsToEdit.length > 0) {
            ContentEventsProcessor.handleEdit(new EditContentEvent(contentsToEdit));
        }

        if (contentsToLocalize.length > 0) {
            const ids: ContentId[] = contentsToLocalize.map((c: ContentSummaryAndCompareStatus) => c.getContentId());

            return new LocalizeContentsRequest(ids, projectLang).sendAndParse().then((updatedItems: ContentSummary[]) => {
                if (updatedItems?.length > 0) {
                    const itemsToOpen: ContentSummaryAndCompareStatus[] =
                        updatedItems.map((item: ContentSummary) => ContentSummaryAndCompareStatus.fromContentSummary(item));
                    ContentEventsProcessor.handleEdit(new EditContentEvent(itemsToOpen).setIsLocalized(true));
                }

                return Q.resolve();
            });
        }

        return Q.resolve();
    }
}
