import {ReactElement} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentIcon} from '../../../../shared/icons/ContentIcon';
import {DottedDownArrow} from '../../../../shared/icons/DottedDownArrow';

const DEPENDENCIES_WIDGET_CONTENT_SECTION_NAME = 'DependenciesWidgetContentSection';

export const DependenciesWidgetContentSection = ({
    content,
}: {
    content: ContentSummaryAndCompareStatus;
}): ReactElement => {
    return (
        <div data-component={DEPENDENCIES_WIDGET_CONTENT_SECTION_NAME} className="flex flex-col items-center">
            <DottedDownArrow />

            <div className="flex flex-col justify-center items-center gap-1 py-3.5 px-2.5 overflow-hidden">
                <ContentIcon contentType={String(content.getType())} url={content.getContentSummary().getIconUrl()} />
                <span className="text-center font-semibold truncate">{content.getDisplayName()}</span>
                <span className="text-center text-xs text-subtle truncate">{content.getPath().toString()}</span>
            </div>

            <DottedDownArrow />
        </div>
    );
};

DependenciesWidgetContentSection.displayName = DEPENDENCIES_WIDGET_CONTENT_SECTION_NAME;
