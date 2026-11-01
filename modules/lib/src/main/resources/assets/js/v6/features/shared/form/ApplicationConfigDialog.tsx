import { type Application } from '@enonic/lib-admin-ui/application/Application';
import { type PropertySet } from '@enonic/input-types/data';
import { type Form } from '@enonic/input-types/schema';
import { cn, Dialog } from '@enonic/ui';
import type { ReactElement } from 'react';
import { useCallback, useRef, useState } from 'react';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { ConfirmationDialog } from '../../../shared/ui/dialogs/ConfirmationDialog';
import { useHtmlAreaDialogYield } from '../hooks/useHtmlAreaDialogYield';
import { ApplicationConfigDialogContent } from './ApplicationConfigDialogContent';
import type { FormScope } from './FormScopeContext';

const COMPONENT_NAME = 'ApplicationConfigDialog';

/** `project` and `content` scope the form; a key left out falls back to the stores. */
export type ApplicationConfigDialogProps = FormScope & {
    /** The application whose config form is edited. The key is the fallback title when it is unknown. */
    application: Application | undefined;
    applicationKey: string;
    form: Form | undefined;
    /** The set the form edits. Pass a clone; the caller copies it back on apply. */
    configSet: PropertySet;
    enabled: boolean;
    /** Set when the dialog opens over another dialog. */
    stacked?: boolean;
    onApply: () => void;
    onClose: () => void;
};

/**
 * The dialog around an application's config form, see `ApplicationConfigDialogContent`, with a discard
 * confirmation when closing with changes. Mount it only while editing.
 */
export const ApplicationConfigDialog = ({
    application,
    applicationKey,
    form,
    configSet,
    enabled,
    stacked = false,
    project,
    content,
    onApply,
    onClose,
}: ApplicationConfigDialogProps): ReactElement => {
    const { overlayHidden, contentProps, shouldIgnoreClose } = useHtmlAreaDialogYield();

    const [view, setView] = useState<'main' | 'confirmation'>('main');
    const dirtyRef = useRef(false);

    const confirmTitle = useI18n('dialog.confirm.title');
    const confirmDescription = useI18n('dialog.confirm.applyChanges');

    const handleDirtyChange = useCallback((dirty: boolean) => {
        dirtyRef.current = dirty;
    }, []);

    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (open) return;

            if (shouldIgnoreClose()) return;

            if (view === 'confirmation') {
                setView('main');
                return;
            }

            if (dirtyRef.current) {
                setView('confirmation');
            } else {
                onClose();
            }
        },
        [shouldIgnoreClose, view, onClose],
    );

    return (
        <Dialog.Root open onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                {!overlayHidden && <Dialog.Overlay className={cn(stacked && 'z-40 bg-transparent')} />}
                {view === 'main' && form && (
                    <Dialog.Content
                        data-click-outside-ignore={stacked || undefined}
                        modal={contentProps.modal}
                        className={cn(
                            'w-full h-full max-sm:max-h-none gap-6 sm:h-fit md:min-w-152 md:max-w-184 md:max-h-[85vh]',
                            contentProps.className,
                        )}
                    >
                        <ApplicationConfigDialogContent
                            application={application}
                            applicationKey={applicationKey}
                            form={form}
                            configSet={configSet}
                            enabled={enabled}
                            project={project}
                            content={content}
                            onApply={onApply}
                            onDirtyChange={handleDirtyChange}
                        />
                    </Dialog.Content>
                )}
                {view === 'confirmation' && (
                    <ConfirmationDialog.Content data-click-outside-ignore={stacked || undefined}>
                        <ConfirmationDialog.DefaultHeader title={confirmTitle} description={confirmDescription} />
                        <ConfirmationDialog.Footer onConfirm={onClose} />
                    </ConfirmationDialog.Content>
                )}
            </Dialog.Portal>
        </Dialog.Root>
    );
};

ApplicationConfigDialog.displayName = COMPONENT_NAME;
