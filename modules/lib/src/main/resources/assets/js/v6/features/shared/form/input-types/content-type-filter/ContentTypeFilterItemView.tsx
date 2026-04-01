import {type ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {type ReactElement} from 'react';
import {ContentIcon} from '../../../icons/ContentIcon';
import {ItemLabel} from '../../../ItemLabel';

type ContentTypeFilterItemViewProps = {
    contentType: ContentTypeSummary;
};

const COMPONENT_NAME = 'ContentTypeFilterItemView';

export const ContentTypeFilterItemView = ({contentType}: ContentTypeFilterItemViewProps): ReactElement => {
    const key = contentType.getContentTypeName().toString();
    const displayName = contentType.getTitle();
    const iconUrl = contentType.getIconUrl();

    return <ItemLabel icon={<ContentIcon contentType={key} url={iconUrl} />} primary={displayName} secondary={key} className="w-full" />;
};

ContentTypeFilterItemView.displayName = COMPONENT_NAME;
