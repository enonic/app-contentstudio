import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import React, {ReactElement, useEffect, useState} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {WidgetItemViewInterface} from '../../../../../../app/view/context/WidgetItemView';
import {Title} from './utils';
import {Button} from '@enonic/ui';
import {BasePropertiesWidgetItemViewHelper} from '../../../../../../app/view/context/widget/details/BasePropertiesWidgetItemViewHelper';
import {PropertiesWidgetItemViewValue} from '../../../../../../app/view/context/widget/details/PropertiesWidgetItemViewValue';
import {Copy} from 'lucide-react';
import {EditPropertiesDialog} from '../../../../../../app/view/context/widget/details/EditPropertiesDialog';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Content} from '../../../../../../app/content/Content';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {ContentLanguageUpdatedEvent} from '../../../../../../app/event/ContentLanguageUpdatedEvent';
import {PropertiesWizardStepFormType} from '../../../../../../app/view/context/widget/details/PropertiesWizardStepFormFactory';
import Q from 'q';
import {useI18n} from '../../../../hooks/useI18n';

type Props = {
    content?: ContentSummaryAndCompareStatus;
};

type ContentProps = Map<string, PropertiesWidgetItemViewValue>;

const helper = new BasePropertiesWidgetItemViewHelper();

const copyIdToClipboard = (props: ContentProps) => {
    navigator.clipboard.writeText(props.get('Id')?.getDisplayName() || '');
};

const DetailsWidgetInfoSection = ({content}: Props): ReactElement => {
    const [props, setProps] = useState<ContentProps>(new Map());
    const [dialog, setDialog] = useState<EditPropertiesDialog>();

    useEffect(() => {
        if (!content) return;

        helper.setItem(content);
        helper.generateProps().then(setProps);
        helper.getAllowedForms([PropertiesWizardStepFormType.SETTINGS]).then((allowedForms) => {
            const dialog = new EditPropertiesDialog({
                title: i18n('widget.properties.edit.settings.text'),
                updatedHandler: (updatedContent: Content) => {
                    NotifyManager.get().showFeedback(
                        i18n('notify.properties.settings.updated', updatedContent.getName())
                    );

                    if (updatedContent.getLanguage() && updatedContent.getLanguage() !== content.getLanguage()) {
                        new ContentLanguageUpdatedEvent(updatedContent.getLanguage()).fire();
                    }
                },
            })
                .setItem(content.getContentSummary())
                .setFormsAllowed(allowedForms);

            setDialog(dialog);
        });
    }, [content]);

    if (!content) return undefined;

    return (
        <div>
            <Title text={useI18n('field.contextPanel.details.sections.info')} />
            <div className="grid grid-cols-[max-content_1fr] items-center justify-start gap-y-2.5 gap-x-7.5 my-5">
                {Array.from(props.entries()).map(([key, value]) => (
                    <React.Fragment key={key}>
                        <span className="text-xs text-subtle">{key}</span>

                        {key === 'Id' ? (
                            <div className="flex items-center justify-between gap-2 min-w-0">
                                <span className="text-xs truncate" title={value.getTitle() || ''}>
                                    {value.getDisplayName()}
                                </span>
                                <Copy
                                    className="size-3.5 shrink-0 hover:cursor-pointer"
                                    onClick={() => copyIdToClipboard(props)}
                                />
                            </div>
                        ) : (
                            <span className="text-xs truncate min-w-0" title={value.getTitle() || ''}>
                                {value.getDisplayName()}
                            </span>
                        )}
                    </React.Fragment>
                ))}
            </div>
            <div className="flex justify-end">
                <Button
                    size="sm"
                    variant="outline"
                    label={useI18n('field.contextPanel.details.sections.info.editSettings')}
                    onClick={() => dialog?.open()}
                />
            </div>
        </div>
    );
};

DetailsWidgetInfoSection.displayName = 'DetailsWidgetInfoSection';

export class DetailsWidgetInfoSectionElement
    extends LegacyElement<typeof DetailsWidgetInfoSection>
    implements WidgetItemViewInterface
{
    constructor(props: Props) {
        super(props, DetailsWidgetInfoSection);
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
