import {ContentSummary} from './ContentSummary';
import {ContentSummaryDiff} from './ContentSummaryDiff';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export class ContentSummaryHelper {

    public static diff(item: ContentSummary, other: ContentSummary): ContentSummaryDiff {
        const diff: ContentSummaryDiff = {};

        if (!ObjectHelper.stringEquals(item.getId(), other.getId())) {
            diff.id = true;
        }

        if (!ObjectHelper.equals(item.getContentId(), other.getContentId())) {
            diff.contentId = true;
        }

        if (!ObjectHelper.equals(item.getName(), other.getName())) {
            diff.name = true;
        }

        if (!ObjectHelper.stringEquals(item.getDisplayName(), other.getDisplayName())) {
            diff.displayName = true;
        }

        if (!ObjectHelper.anyEquals(item.getInherit(), other.getInherit())) {
            const inheritDiff = {
                content: false,
                parent: false,
                name: false,
                sort: false
            };

            if (item.isDataInherited() !== other.isDataInherited()) {
                inheritDiff.content = true;
            }

            if (item.isParentInherited() !== other.isParentInherited()) {
                inheritDiff.parent = true;
            }

            if (item.isNameInherited() !== other.isNameInherited()) {
                inheritDiff.name = true;
            }

            if (item.isSortInherited() !== other.isSortInherited()) {
                inheritDiff.sort = true;
            }

            if (inheritDiff.content || inheritDiff.parent || inheritDiff.name || inheritDiff.sort) {
                diff.inherit = inheritDiff;
            }
        }

        if (!ObjectHelper.equals(item.getPath(), other.getPath())) {
            diff.path = true;
        }

        if (!ObjectHelper.booleanEquals(item.hasChildren(), other.hasChildren())) {
            diff.children = true;
        }

        if (!ObjectHelper.equals(item.getType(), other.getType())) {
            diff.type = true;
        }

        if (!ObjectHelper.stringEquals(item.getIconUrl(), other.getIconUrl())) {
            diff.iconUrl = true;
        }

        if (!ObjectHelper.equals(item.getThumbnail(), other.getThumbnail())) {
            diff.thumbnail = true;
        }

        if (!ObjectHelper.objectEquals(item.getModifier(), other.getModifier())) {
            diff.modifier = true;
        }

        if (!ObjectHelper.objectEquals(item.getCreator(), other.getCreator())) {
            diff.creator = true;
        }

        if (!ObjectHelper.objectEquals(item.getOwner(), other.getOwner())) {
            diff.owner = true;
        }

        if (!ObjectHelper.booleanEquals(item.isPage(), other.isPage())) {
            diff.page = true;
        }

        if (!ObjectHelper.booleanEquals(item.isValid(), other.isValid())) {
            diff.valid = true;
        }

        if (!ObjectHelper.booleanEquals(item.isRequireValid(), other.isRequireValid())) {
            diff.requireValid = true;
        }

        if (!ObjectHelper.dateEquals(item.getCreatedTime(), other.getCreatedTime())) {
            diff.createdTime = true;
        }

        if (!ObjectHelper.dateEquals(item.getModifiedTime(), other.getModifiedTime())) {
            diff.modifiedTime = true;
        }

        if (!ObjectHelper.dateEquals(item.getArchivedTime(), other.getArchivedTime())) {
            diff.archivedTime = true;
        }

        if (!ObjectHelper.objectEquals(item.getArchivedBy(), other.getArchivedBy())) {
            diff.archivedBy = true;
        }

        if (!ObjectHelper.dateEqualsUpToMinutes(item.getPublishFromTime(), other.getPublishFromTime())) {
            diff.publishFromTime = true;
        }

        if (!ObjectHelper.dateEqualsUpToMinutes(item.getPublishToTime(), other.getPublishToTime())) {
            diff.publishToTime = true;
        }

        if (!ObjectHelper.dateEqualsUpToMinutes(item.getPublishFirstTime(), other.getPublishFirstTime())) {
            diff.publishFirstTime = true;
        }

        if (!ObjectHelper.booleanEquals(item.isDeletable(), other.isDeletable())) {
            diff.deletable = true;
        }

        if (!ObjectHelper.booleanEquals(item.isEditable(), other.isEditable())) {
            diff.editable = true;
        }

        if (!ObjectHelper.equals(item.getChildOrder(), other.getChildOrder())) {
            diff.childOrder = true;
        }

        if (!ObjectHelper.stringEquals(item.getLanguage(), other.getLanguage())) {
            diff.language = true;
        }

        if (!ObjectHelper.equals(item.getWorkflow(), other.getWorkflow())) {
            diff.workflow = true;
        }

        if (!ObjectHelper.stringEquals(item.getOriginalParentPath(), other.getOriginalParentPath())) {
            diff.originalParentPath = true;
        }

        if (!ObjectHelper.stringEquals(item.getOriginalName(), other.getOriginalName())) {
            diff.originalName = true;
        }

        if (!ObjectHelper.stringEquals(item.getVariantOf(), other.getVariantOf())) {
            diff.variantOf = true;
        }

        return diff;
    }
}
