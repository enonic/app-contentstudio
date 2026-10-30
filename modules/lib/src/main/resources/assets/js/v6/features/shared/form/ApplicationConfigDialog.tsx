import { type Application } from '@enonic/lib-admin-ui/application/Application';
import { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { type PropertySet } from '@enonic/input-types/data';
import { type Form } from '@enonic/input-types/schema';
import { validateForm } from '@enonic/input-types';
import { Button, cn, Dialog } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { ConfirmationDialog } from '../../../shared/ui/dialogs/ConfirmationDialog';
import { ApplicationIcon } from '../../../shared/ui/icons/ApplicationIcon';
import { $isHtmlAreaModalDialogOpen, $isHtmlAreaOverlayOpen } from '../../rich-text-inserts/model/htmlAreaModal.store';
import { FormRenderer } from './FormRenderer';
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
 * The dialog around an application's config form: the form, an Apply button that enables
 * once the set is dirty and valid, and a discard confirmation when closing with changes.
 * Mount it only while editing; its dirty baseline is taken on mount.
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
    const overlayOpen = useStore($isHtmlAreaOverlayOpen);
    const modalDialogOpen = useStore($isHtmlAreaModalDialogOpen);

    const [view, setView] = useState<'main' | 'confirmation'>('main');
    const dirtyRef = useRef(false);
    const baselineRef = useRef<string | null>(null);

    const applyLabel = useI18n('action.apply');
    const confirmTitle = useI18n('dialog.confirm.title');
    const confirmDescription = useI18n('dialog.confirm.applyChanges');

    const key = useMemo(() => ApplicationKey.fromString(applicationKey), [applicationKey]);

    const handleDirtyChange = useCallback((dirty: boolean) => {
        dirtyRef.current = dirty;
    }, []);

    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (open) return;

            if ($isHtmlAreaOverlayOpen.get()) return;

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
        [view, onClose],
    );

    return (
        <Dialog.Root open onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                {!modalDialogOpen && <Dialog.Overlay className={cn(stacked && 'z-40 bg-transparent')} />}
                {view === 'main' && form && (
                    <Dialog.Content
                        data-click-outside-ignore={stacked || undefined}
                        modal={!overlayOpen}
                        className={cn(
                            'w-full h-full max-sm:max-h-none gap-6 sm:h-fit md:min-w-152 md:max-w-184 md:max-h-[85vh]',
                            modalDialogOpen && 'invisible',
                        )}
                    >
                        <Dialog.Header className="flex items-center gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {application && (
                                    <ApplicationIcon application={application} className="size-8 shrink-0" />
                                )}
                                <div className="flex flex-col min-w-0">
                                    <Dialog.Title className="truncate">
                                        {application?.getDisplayName() ?? applicationKey}
                                    </Dialog.Title>
                                    {application?.getDescription() && (
                                        <Dialog.Description className="truncate text-sm text-subtle">
                                            {application.getDescription()}
                                        </Dialog.Description>
                                    )}
                                </div>
                            </div>
                            <Dialog.DefaultClose className="self-start" />
                        </Dialog.Header>

                        <Dialog.Body className="p-2 -m-2">
                            <FormRenderer
                                form={form}
                                propertySet={configSet}
                                enabled={enabled}
                                applicationKey={key}
                                project={project}
                                content={content}
                            />
                        </Dialog.Body>

                        <Dialog.Footer>
                            <ApplyButton
                                label={applyLabel}
                                configSet={configSet}
                                form={form}
                                baselineRef={baselineRef}
                                onApply={onApply}
                                onDirtyChange={handleDirtyChange}
                            />
                        </Dialog.Footer>
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

//
// * Apply button
//

type ApplyButtonProps = {
    label: string;
    configSet: PropertySet;
    form: Form;
    baselineRef: React.RefObject<string | null>;
    onApply: () => void;
    onDirtyChange: (dirty: boolean) => void;
};

const ApplyButton = ({
    label,
    configSet,
    form,
    baselineRef,
    onApply,
    onDirtyChange,
}: ApplyButtonProps): ReactElement => {
    const [dirty, setDirty] = useState(false);
    const [valid, setValid] = useState(true);

    useEffect(() => {
        const check = () => {
            if (baselineRef.current == null) return;
            const current = JSON.stringify(configSet.toJson());
            const isDirty = current !== baselineRef.current;
            setDirty(isDirty);
            onDirtyChange(isDirty);
            setValid(validateForm(form, configSet).isValid);
        };

        let frameId: number | undefined;
        if (baselineRef.current == null) {
            frameId = requestAnimationFrame(() => {
                baselineRef.current = JSON.stringify(configSet.toJson());
                frameId = undefined;
            });
        } else {
            check();
        }

        configSet.onChanged(check);

        return () => {
            if (frameId != null) {
                cancelAnimationFrame(frameId);
            }
            configSet.unChanged(check);
        };
    }, [configSet, form, baselineRef, onDirtyChange]);

    return (
        <Dialog.Close asChild>
            <Button size="lg" label={label} variant="solid" disabled={!dirty || !valid} onClick={onApply} />
        </Dialog.Close>
    );
};

ApplyButton.displayName = 'ApplicationConfigDialogApplyButton';
