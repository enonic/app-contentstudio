import {Slash} from 'lucide-react';
import {type ReactElement} from 'react';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentId} from '../../../../../app/content/ContentId';
import {ContentName} from '../../../../../app/content/ContentName';
import {ContentPath} from '../../../../../app/content/ContentPath';
import type {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentSummaryBuilder} from '../../../../../app/content/ContentSummary';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ItemLabel} from '../../ItemLabel';
import {cn} from '@enonic/ui';

export const ROOT_ID = 'root';

const PATH_SELECTOR_ROOT_LABEL_NAME = 'PathSelectorRootLabel';

export const createRootContent = () => new ContentSummaryBuilder()
    .setId(ROOT_ID)
    .setHasChildren(false)
    .setContentId(new ContentId(ROOT_ID))
    .setName(new ContentName(ROOT_ID))
    .setDisplayName(i18n('field.root'))
    .setPath(ContentPath.getRoot())
    .setType(ContentTypeName.FOLDER)
    .build();

export const isRootContent = (content: ContentSummaryAndCompareStatus): boolean =>
    content.getContentId()?.toString() === ROOT_ID;

type RootLabelProps = {
    content: ContentSummaryAndCompareStatus;
    className?: string;
};

export const RootLabel = ({content, className}: RootLabelProps): ReactElement => (
    <ItemLabel
        data-component={PATH_SELECTOR_ROOT_LABEL_NAME}
        icon={<Slash size={20} strokeWidth={2} />}
        primary={content.getDisplayName() || i18n('field.root')}
        className={cn('h-10', className)}
    />
);

RootLabel.displayName = PATH_SELECTOR_ROOT_LABEL_NAME;
