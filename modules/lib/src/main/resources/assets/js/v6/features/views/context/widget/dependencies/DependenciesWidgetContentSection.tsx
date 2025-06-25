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
        <section
            data-component={DEPENDENCIES_WIDGET_CONTENT_SECTION_NAME}
            className="flex flex-col items-center w-full"
        >
            <DottedDownArrow className="box-content py-1" />

            <div className="flex flex-col justify-center items-center gap-1 py-3.5 px-2.5 overflow-hidden w-full">
                <ContentIcon contentType={String(content.getType())} url={content.getContentSummary().getIconUrl()} />
                <p className="text-center font-semibold truncate w-full">{content.getDisplayName()}</p>
                <p className="text-center text-xs text-subtle truncate w-full">{content.getPath().toString()}</p>
            </div>

            <DottedDownArrow className="box-content py-1" />
        </section>
    );
};

DependenciesWidgetContentSection.displayName = DEPENDENCIES_WIDGET_CONTENT_SECTION_NAME;
