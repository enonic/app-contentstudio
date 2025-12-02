import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Button, IconButton, Separator, Tooltip} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Copy} from 'lucide-react';
import {ReactElement, useEffect, useState} from 'react';
import {Content} from '../../../../../../app/content/Content';
import {ContentLanguageUpdatedEvent} from '../../../../../../app/event/ContentLanguageUpdatedEvent';
import {BasePropertiesWidgetItemViewHelper} from '../../../../../../app/view/context/widget/details/BasePropertiesWidgetItemViewHelper';
import {EditPropertiesDialog} from '../../../../../../app/view/context/widget/details/EditPropertiesDialog';
import {PropertiesWidgetItemViewValue} from '../../../../../../app/view/context/widget/details/PropertiesWidgetItemViewValue';
import {PropertiesWizardStepFormType} from '../../../../../../app/view/context/widget/details/PropertiesWizardStepFormFactory';
import {useI18n} from '../../../../hooks/useI18n';
import {$contextContent} from '../../../../store/context/contextContent.store';

type ContentProps = Map<string, PropertiesWidgetItemViewValue>;

const helper = new BasePropertiesWidgetItemViewHelper();

function copyToClipboard(text: string): void {
    navigator?.clipboard?.writeText(text);
}

export function DetailsWidgetInfoSection(): ReactElement {
    const content = useStore($contextContent);
    const [props, setProps] = useState<ContentProps>(new Map());
    const [dialog, setDialog] = useState<EditPropertiesDialog>();

    const titleText = useI18n('field.contextPanel.details.sections.info');
    const editSettingsLabel = useI18n('field.contextPanel.details.sections.info.editSettings');
    const copyTooltip = useI18n('field.contextPanel.details.sections.info.copy');

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

    if (!content) return null;

    return (
        <section className="flex flex-col gap-5">
            <Separator label={titleText} />

            <dl className="grid grid-cols-[max-content_1fr] items-center gap-x-7.5 gap-y-2.5">
                {Array.from(props.entries()).map(([key, value]) => {
                    const isId = key === 'Id';
                    const title = value.getTitle() ?? '';
                    const displayName = value.getDisplayName();

                    return (
                        <div key={key} className="contents">
                            <dt className="text-xs text-subtle">{key}</dt>
                            <dd className="flex items-center justify-between gap-2 overflow-hidden">
                                <span className="text-xs truncate" title={title}>
                                    {displayName}
                                </span>
                                {isId && (
                                    <Tooltip value={copyTooltip} side="left">
                                        <IconButton
                                            className="size-4 shrink-0"
                                            size="sm"
                                            icon={Copy}
                                            iconSize={14}
                                            aria-label={copyTooltip}
                                            onClick={() => copyToClipboard(displayName)}
                                        />
                                    </Tooltip>
                                )}
                            </dd>
                        </div>
                    );
                })}
            </dl>

            <Button
                className="self-end"
                size="sm"
                variant="outline"
                label={editSettingsLabel}
                onClick={() => dialog?.open()}
            />
        </section>
    );
}
