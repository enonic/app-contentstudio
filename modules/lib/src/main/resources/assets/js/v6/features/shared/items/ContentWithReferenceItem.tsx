import {Branch} from '../../../../app/versioning/Branch';
import {ContentReferencesLink} from '../ContentReferencesLink';
import {ContentItem, ContentItemProps} from './ContentItem';

export type ContentItemWithReferenceProps = {
    branch: Branch;
    hasInbound: boolean;
} & ContentItemProps;

const CONTENT_ITEM_WITH_REFERENCE_NAME = 'ContentItemWithReference';

export const ContentItemWithReference = ({
    content,
    branch,
    hasInbound,
    'data-component': componentName = CONTENT_ITEM_WITH_REFERENCE_NAME,
    ...props
}: ContentItemWithReferenceProps): React.ReactElement => {
    const contentId = content.getContentSummary().getContentId().toString();
    return (
        <ContentItem content={content} data-component={componentName} {...props}>
            {hasInbound && <ContentReferencesLink contentId={contentId} branch={branch} />}
        </ContentItem>
    );
}

ContentItemWithReference.displayName = CONTENT_ITEM_WITH_REFERENCE_NAME;
