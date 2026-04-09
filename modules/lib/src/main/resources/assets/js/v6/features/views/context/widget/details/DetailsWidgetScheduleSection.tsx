import {Separator} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import React, {type ReactElement, useEffect, useState} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {ExtensionOnlinePropertiesItemViewHelper} from '../../../../../../app/view/context/extension/details/ExtensionOnlinePropertiesItemViewHelper';
import type {ExtensionPropertiesItemViewValue} from '../../../../../../app/view/context/extension/details/ExtensionPropertiesItemViewValue';
import {useI18n} from '../../../../hooks/useI18n';
import {$contextContent} from '../../../../store/context/contextContent.store';

type ContentProps = Map<string, ExtensionPropertiesItemViewValue>;

const helper = new ExtensionOnlinePropertiesItemViewHelper();

const DETAILS_WIDGET_SCHEDULE_SECTION_NAME = 'DetailsWidgetScheduleSection';

export const DetailsWidgetScheduleSection = (): ReactElement => {
    const content = useStore($contextContent);
    const [props, setProps] = useState<ContentProps>(new Map());
    const [propsHasValue, setPropsHasValue] = useState(false);
    const titleText = useI18n('field.contextPanel.details.sections.schedule');

    useEffect(() => {
        if (!content) return;

        helper.setItem(ContentSummaryAndCompareStatus.fromContentSummary(content));
        helper.generateProps().then((props) => {
            setProps(props);
            setPropsHasValue(Array.from(props.values()).some((value) => Boolean(value.getDisplayName())));
        });
    }, [content]);

    if (!content || !propsHasValue) return null;

    return (
        <section data-component={DETAILS_WIDGET_SCHEDULE_SECTION_NAME} className='flex flex-col gap-5'>
            <Separator label={titleText} />
            <div className="grid grid-cols-[max-content_1fr] items-center justify-start gap-y-2.5 gap-x-7.5 relative pr-5">
                {Array.from(props.entries()).map(([key, value]) => (
                    <React.Fragment key={key}>
                        <span className="text-xs text-subtle">{key}</span>
                        <span className="text-xs truncate " title={value.getTitle() || ''}>
                            {value.getDisplayName()}
                        </span>
                    </React.Fragment>
                ))}
            </div>
        </section>
    );
};

DetailsWidgetScheduleSection.displayName = DETAILS_WIDGET_SCHEDULE_SECTION_NAME;
