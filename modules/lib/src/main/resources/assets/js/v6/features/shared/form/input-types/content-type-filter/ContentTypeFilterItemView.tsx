import { type ContentTypeSummary } from '../../../../../entities/schema';
import { type ReactElement } from 'react';
import { ContentIcon } from '../../../../../shared/ui/icons/ContentIcon';
import { ItemLabel } from '../../../../../shared/ui/ItemLabel';

type ContentTypeFilterItemViewProps = {
    contentType: ContentTypeSummary;
};

const COMPONENT_NAME = 'ContentTypeFilterItemView';

export const ContentTypeFilterItemView = ({ contentType }: ContentTypeFilterItemViewProps): ReactElement => {
    const key = contentType.name;
    const displayName = contentType.title;
    const iconUrl = contentType.iconUrl;

    return (
        <ItemLabel
            icon={<ContentIcon contentType={key} url={iconUrl} typeIcon />}
            primary={displayName}
            secondary={key}
            className="w-full"
        />
    );
};

ContentTypeFilterItemView.displayName = COMPONENT_NAME;
