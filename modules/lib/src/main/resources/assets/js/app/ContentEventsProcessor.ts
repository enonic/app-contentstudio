import {NewContentEvent} from './create/NewContentEvent';
import {SortContentEvent} from './browse/sort/SortContentEvent';
import {OpenSortDialogEvent} from './browse/OpenSortDialogEvent';
import {MoveContentEvent} from './move/MoveContentEvent';
import {OpenMoveDialogEvent} from './move/OpenMoveDialogEvent';
import {ShowDependenciesEvent} from './browse/ShowDependenciesEvent';
import {ContentUpdatedEvent} from './event/ContentUpdatedEvent';
import {EditContentEvent} from './event/EditContentEvent';
import {ContentSummaryAndCompareStatus} from './content/ContentSummaryAndCompareStatus';
import {ContentSummary} from './content/ContentSummary';
import {ContentUrlHelper} from './util/ContentUrlHelper';
import {ContentEditParams} from './wizard/ContentEditParams';
import {ContentCreateParams} from './wizard/ContentCreateParams';

export class ContentEventsProcessor {

    static handleNew(newContentEvent: NewContentEvent): void {
        const params: ContentCreateParams = ContentCreateParams.create()
            .setParentContentId(newContentEvent.getParentContent()?.getContentId())
            .setContentTypeName(newContentEvent.getContentType().getContentTypeName())
            .build();

        ContentUrlHelper.openNewContentTab(params);
    }

    static handleEdit(event: EditContentEvent): void {
        event.getModels()
            .filter((item: ContentSummaryAndCompareStatus) => item?.getContentSummary())
            .forEach((content: ContentSummaryAndCompareStatus) => {
            const contentSummary: ContentSummary = content.getContentSummary();

            const editParams: ContentEditParams = ContentEditParams.create()
                .setContentId(contentSummary.getContentId())
                .setProject(event.getProject())
                .setLocalized(event.isLocalized())
                .setDisplayAsNew(event.isDisplayAsNew())
                .build();

            ContentUrlHelper.openEditContentTab(editParams);
        });
    }

    static handleUpdated(event: ContentUpdatedEvent): void {
        // do something when content is updated
    }

    static handleSort(event: SortContentEvent): void {
        const contents: ContentSummaryAndCompareStatus[] = event.getModels();
        new OpenSortDialogEvent(contents[0]).fire();
    }

    static handleMove(event: MoveContentEvent): void {
        const contents: ContentSummaryAndCompareStatus[] = event.getModels();
        new OpenMoveDialogEvent(contents.map(content => content.getContentSummary()), event.getTreeGrid()).fire();
    }

    static handleShowDependencies(event: ShowDependenciesEvent): void {
        ContentUrlHelper.openDependenciesTab(event.getDependencyParams());
    }
}
