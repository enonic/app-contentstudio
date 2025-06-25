import {Branch} from '../../../../app/versioning/Branch';
import {ContentReferencesLink} from '../ContentReferencesLink';
import {ContentItemProps, ContentListItem} from './ContentListItem';

export type ContentListItemWithReferenceProps = {
    branch: Branch;
    hasInbound: boolean;
} & ContentItemProps;

const CONTENT_LIST_ITEM_WITH_REFERENCE_NAME = 'ContentListItemWithReference';

export const ContentListItemWithReference = ({
    content,
    branch,
    hasInbound,
    'data-component': componentName = CONTENT_LIST_ITEM_WITH_REFERENCE_NAME,
    ...props
}: ContentListItemWithReferenceProps): React.ReactElement => {
    const contentId = content.getContentSummary().getContentId().toString();
    return (
        <ContentListItem content={content} data-component={componentName} {...props}>
            {hasInbound && <ContentReferencesLink contentId={contentId} branch={branch} />}
        </ContentListItem>
    );
}

ContentListItemWithReference.displayName = CONTENT_LIST_ITEM_WITH_REFERENCE_NAME;
