import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import React, {ReactElement, useEffect, useState} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {WidgetItemViewInterface} from '../../../../../../app/view/context/WidgetItemView';
import {Title} from './utils';
import {OnlinePropertiesWidgetItemViewHelper} from '../../../../../../app/view/context/widget/details/OnlinePropertiesWidgetItemViewHelper';
import {PropertiesWidgetItemViewValue} from '../../../../../../app/view/context/widget/details/PropertiesWidgetItemViewValue';
import Q from 'q';
import {useI18n} from '../../../../hooks/useI18n';

type Props = {
    content?: ContentSummaryAndCompareStatus;
};

type ContentProps = Map<string, PropertiesWidgetItemViewValue>;

const helper = new OnlinePropertiesWidgetItemViewHelper();

const DetailsWidgetScheduleSection = ({content}: Props): ReactElement => {
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
                        <span className="text-xs truncate min-w-0" title={value.getTitle() || ''}>
                            {value.getDisplayName()}
                        </span>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

DetailsWidgetScheduleSection.displayName = 'DetailsWidgetScheduleSection';

export class DetailsWidgetScheduleSectionElement
    extends LegacyElement<typeof DetailsWidgetScheduleSection>
    implements WidgetItemViewInterface
{
    constructor(props: Props) {
        super(props, DetailsWidgetScheduleSection);
    }

    // Backwards compatibility

    public static debug: boolean = false;

    public layout(): Q.Promise<void> {
        return Q();
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<null | void> {
        if (!item) return;

        this.props.setKey('content', item);

        return Q();
    }

    public fetchWidgetContents(url: string, contentId: string): Q.Promise<void> {
        return Q();
    }

    public hide(): void {
        return;
    }

    public show(): void {
        return;
    }
}
