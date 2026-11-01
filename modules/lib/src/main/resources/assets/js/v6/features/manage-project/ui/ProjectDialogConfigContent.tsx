import { cn, Dialog } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import type { ReactElement } from 'react';
import {
    $projectDialog,
    $projectDialogConfigScope,
    applyProjectDialogApplicationConfig,
    setProjectDialogConfigDirty,
} from '../model/projectDialog.store';
import { ApplicationConfigDialogContent } from '../../shared/form';
import { useHtmlAreaDialogYield } from '../../shared/hooks/useHtmlAreaDialogYield';

const COMPONENT_NAME = 'ProjectDialogConfigContent';

/** The `config` view of the project dialog: the config form of the app being edited. */
export const ProjectDialogConfigContent = (): ReactElement | null => {
    const { editingConfig } = useStore($projectDialog, { keys: ['editingConfig'] });
    const configScope = useStore($projectDialogConfigScope);
    const { contentProps } = useHtmlAreaDialogYield();

    const form = editingConfig?.application.getForm();
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
                applicationKey={editingConfig.application.getApplicationKey().toString()}
                form={form}
                configSet={editingConfig.configSet}
                enabled
                {...configScope}
                onApply={applyProjectDialogApplicationConfig}
                onDirtyChange={setProjectDialogConfigDirty}
            />
        </Dialog.Content>
    );
};

ProjectDialogConfigContent.displayName = COMPONENT_NAME;
