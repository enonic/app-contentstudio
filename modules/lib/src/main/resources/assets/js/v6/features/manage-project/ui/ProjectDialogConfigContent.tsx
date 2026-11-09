import { cn, Dialog } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement, useMemo } from 'react';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import {
    $projectDialog,
    $projectDialogConfigScope,
    $projectDialogHasUnsavedApplications,
    applyProjectDialogApplicationConfig,
    setProjectDialogConfigDirty,
} from '../model/projectDialog.store';
import { ApplicationConfigDialogContent } from '../../shared/form';
import { hasCreatableTypeInputs } from '../../shared/form/formScopeRequirements';
import { useFormDialogYield } from '../../shared/hooks/useFormDialogYield';

const COMPONENT_NAME = 'ProjectDialogConfigContent';

/** The `config` view of the project dialog: the config form of the app being edited. */
export const ProjectDialogConfigContent = (): ReactElement | null => {
    const { editingConfig } = useStore($projectDialog, { keys: ['editingConfig'] });
    const configScope = useStore($projectDialogConfigScope);
    const hasUnsavedApplications = useStore($projectDialogHasUnsavedApplications);
    const { contentProps } = useFormDialogYield();
    const unsavedAppsNotice = useI18n('dialog.applicationConfig.unsavedApps');

    const form = editingConfig?.application.form;
    // Only a form that offers creatable types can miss the ones of an unsaved app.
    const showUnsavedAppsNotice = useMemo(
        () => hasUnsavedApplications && form != null && hasCreatableTypeInputs(form),
        [hasUnsavedApplications, form],
    );

    if (!editingConfig || !form) return null;

    return (
        <Dialog.Content
            modal={contentProps.modal}
            className={cn(
                'w-full h-full max-sm:max-h-none gap-6 sm:h-fit md:min-w-152 md:max-w-184 md:max-h-[85vh]',
                contentProps.className,
            )}
            data-component={COMPONENT_NAME}
        >
            <ApplicationConfigDialogContent
                application={editingConfig.application}
                applicationKey={editingConfig.application.key}
                form={form}
                configSet={editingConfig.configSet}
                enabled
                notice={showUnsavedAppsNotice ? unsavedAppsNotice : undefined}
                {...configScope}
                onApply={applyProjectDialogApplicationConfig}
                onDirtyChange={setProjectDialogConfigDirty}
            />
        </Dialog.Content>
    );
};

ProjectDialogConfigContent.displayName = COMPONENT_NAME;
