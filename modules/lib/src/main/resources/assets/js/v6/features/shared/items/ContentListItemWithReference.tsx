import {type Ref} from 'react';
import {type Branch} from '../../../../app/versioning/Branch';
import {ContentReferencesLink, type ContentReferencesLinkProps} from '../ContentReferencesLink';
import {type ContentItemProps, ContentListItem} from './ContentListItem';

export type ContentListItemWithReferenceProps = {
    branch: Branch;
    hasInbound: boolean;
    referenceLinkProps?: Omit<ContentReferencesLinkProps, 'contentId' | 'branch'>;
    referenceLinkRef?: Ref<HTMLAnchorElement>;
} & ContentItemProps;

const CONTENT_LIST_ITEM_WITH_REFERENCE_NAME = 'ContentListItemWithReference';

export const ContentListItemWithReference = ({
    content,
    branch,
    hasInbound,
    referenceLinkProps,
    referenceLinkRef,
    'data-component': componentName = CONTENT_LIST_ITEM_WITH_REFERENCE_NAME,
    ...props
}: ContentListItemWithReferenceProps): React.ReactElement => {
    const contentId = content.getContentId().toString();
    return (
        <ContentListItem content={content} data-component={componentName} {...props}>
            {hasInbound && (
                <ContentReferencesLink
                    ref={referenceLinkRef}
                    contentId={contentId}
                    branch={branch}
                    {...referenceLinkProps}
                />
            )}
        </ContentListItem>
    );
}

ContentListItemWithReference.displayName = CONTENT_LIST_ITEM_WITH_REFERENCE_NAME;
