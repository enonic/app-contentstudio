import React, {ReactElement, useEffect, useState} from 'react';
import {Title} from './utils';
import {OnlinePropertiesWidgetItemViewHelper} from '../../../../../../app/view/context/widget/details/OnlinePropertiesWidgetItemViewHelper';
import {PropertiesWidgetItemViewValue} from '../../../../../../app/view/context/widget/details/PropertiesWidgetItemViewValue';
import {useI18n} from '../../../../hooks/useI18n';
import {useStore} from '@nanostores/preact';
import {$contextContent} from '../../../../store/context/contextContent.store';

type ContentProps = Map<string, PropertiesWidgetItemViewValue>;

const helper = new OnlinePropertiesWidgetItemViewHelper();

export const DetailsWidgetScheduleSection = (): ReactElement => {
    const content = useStore($contextContent);
    const [props, setProps] = useState<ContentProps>(new Map());
    const [propsHasValue, setPropsHasValue] = useState(false);

    useEffect(() => {
        if (!content) return;

        helper.setItem(content);
        helper.generateProps().then((props) => {
            setProps(props);
            setPropsHasValue(Array.from(props.values()).some((value) => Boolean(value.getDisplayName())));
        });
    }, [content]);

    if (!content || !propsHasValue) return undefined;

    return (
        <div>
            <Title text={useI18n('field.contextPanel.details.sections.schedule')} />
            <div className="grid grid-cols-[max-content_1fr] items-center justify-start gap-y-2.5 gap-x-7.5 my-5 relative pr-5">
                {Array.from(props.entries()).map(([key, value]) => (
                    <React.Fragment key={key}>
                        <span className="text-xs text-subtle">{key}</span>
                        <span className="text-xs truncate " title={value.getTitle() || ''}>
                            {value.getDisplayName()}
                        </span>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

DetailsWidgetScheduleSection.displayName = 'DetailsWidgetScheduleSection';
