import {Button, IconButton, Separator, Tooltip} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Copy} from 'lucide-react';
import {ReactElement, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {BasePropertiesWidgetItemViewHelper} from '../../../../../../app/view/context/widget/details/BasePropertiesWidgetItemViewHelper';
import {PropertiesWidgetItemViewValue} from '../../../../../../app/view/context/widget/details/PropertiesWidgetItemViewValue';
import {PropertiesWizardStepFormType} from '../../../../../../app/view/context/widget/details/PropertiesWizardStepFormFactory';
import {useI18n} from '../../../../hooks/useI18n';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {closeEditPropertiesDialog, openEditPropertiesDialog} from '../../../../store/dialogs/editPropertiesDialog.store';
import {EditPropertiesDialog} from '../../../../shared/dialogs/EditPropertiesDialog';

type ContentProps = Map<string, PropertiesWidgetItemViewValue>;

const DETAILS_WIDGET_INFO_SECTION_NAME = 'DetailsWidgetInfoSection';

export const DetailsWidgetInfoSection = (): ReactElement => {
    const helper = useMemo(() => new BasePropertiesWidgetItemViewHelper(), []);
    const copyToClipboard = useCallback((text: string): void => {
        void navigator?.clipboard?.writeText(text);
    }, []);
    const content = useStore($contextContent);
    const [props, setProps] = useState<ContentProps>(new Map());
    const [canEditSettings, setCanEditSettings] = useState(false);

    const titleText = useI18n('field.contextPanel.details.sections.info');
    const editSettingsLabel = useI18n('field.contextPanel.details.sections.info.editSettings');
    const copyTooltip = useI18n('field.contextPanel.details.sections.info.copy');
    const contentId = content?.getContentId()?.toString();

    const prevContentId = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!content) {
            setProps(new Map());
            setCanEditSettings(false);
            closeEditPropertiesDialog();
            prevContentId.current = undefined;
            return;
        }

        if (prevContentId.current && prevContentId.current !== contentId) {
            closeEditPropertiesDialog();
        }
        prevContentId.current = contentId;

        helper.setItem(content);
        void helper.generateProps().then(setProps);
        void helper.getAllowedForms([PropertiesWizardStepFormType.SETTINGS]).then((allowedForms) => {
            setCanEditSettings(allowedForms.length > 0);
        });
    }, [content, contentId, helper]);

    const renderPropertyRow = useCallback((key: string, value: PropertiesWidgetItemViewValue): ReactElement => {
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
    }, [copyTooltip]);

    if (!content) return null;

    return (
        <section data-component={DETAILS_WIDGET_INFO_SECTION_NAME} className="flex flex-col gap-5">
            <Separator label={titleText} />

            <dl className="grid grid-cols-[max-content_1fr] items-center gap-x-7.5 gap-y-2.5">
                {Array.from(props.entries()).map(([key, value]) => renderPropertyRow(key, value))}
            </dl>

            <Button
                className="self-end"
                size="sm"
                variant="outline"
                label={editSettingsLabel}
                onClick={() => {
                    if (content) {
                        openEditPropertiesDialog(content);
                    }
                }}
                disabled={!canEditSettings}
            />

            <EditPropertiesDialog/>
        </section>
    );
};

DetailsWidgetInfoSection.displayName = DETAILS_WIDGET_INFO_SECTION_NAME;
