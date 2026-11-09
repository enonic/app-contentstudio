import { type PropertySet } from '@enonic/input-types/data';
import { type Form } from '@enonic/input-types/schema';
import { ValidationVisibilityProvider } from '@enonic/input-types';
import { Button, Dialog } from '@enonic/ui';
import { AlertTriangle, Info } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { type Application } from '../../../entities/application';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { StatusBarEntry } from '../../../shared/ui/dialogs/status-bar/StatusBarEntry';
import { ApplicationIcon } from '../../../shared/ui/icons/ApplicationIcon';
import { FormRenderer } from './FormRenderer';
import { hasScopeDisabledInputs, isFormValidInScope } from './formScopeRequirements';
import type { FormScope } from './FormScopeContext';

const COMPONENT_NAME = 'ApplicationConfigDialogContent';

/**
 * The serialized set as it was a frame after the first mount, by the set. Kept out of React state so
 * it survives the host unmounting the content, e.g. while its discard confirmation shows.
 */
const baselines = new WeakMap<PropertySet, string>();

/** `project` and `content` scope the form; a key left out falls back to the stores. */
export type ApplicationConfigDialogContentProps = FormScope & {
    /** The application whose config form is edited. The key is the fallback title when it is unknown. */
    application: Application | undefined;
    applicationKey: string;
    form: Form;
    /** The set the form edits. Pass a clone; the caller copies it back on apply. */
    configSet: PropertySet;
    enabled: boolean;
    /** A line of information shown above the form, e.g. about what the form cannot offer yet. */
    notice?: string;
    onApply: () => void;
    /** Whether the set differs from its state on mount; reported on every change. */
    onDirtyChange?: (dirty: boolean) => void;
};

/**
 * The content of an application's config dialog: header, a warning when the scope disables
 * some inputs, the form, and an Apply button that enables once the set is dirty and valid for
 * what the scope lets the user fill. The dirty baseline is taken on the first mount of a given set.
 */
export const ApplicationConfigDialogContent = ({
    application,
    applicationKey,
    form,
    configSet,
    enabled,
    notice,
    project,
    content,
    onApply,
    onDirtyChange,
}: ApplicationConfigDialogContentProps): ReactElement => {
    const applyLabel = useI18n('action.apply');
    const disabledInputsText = useI18n('dialog.applicationConfig.disabledInputs');
    const hasDisabledInputs = hasScopeDisabledInputs(form, { project, content });

    return (
        <>
            <Dialog.Header className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {application && <ApplicationIcon application={application} className="size-8 shrink-0" />}
                    <div className="flex flex-col min-w-0">
                        <Dialog.Title className="truncate">{application?.displayName ?? applicationKey}</Dialog.Title>
                        {application?.description && (
                            <Dialog.Description className="truncate text-sm text-subtle">
                                {application.description}
                            </Dialog.Description>
                        )}
                    </div>
                </div>
                <Dialog.DefaultClose className="self-start" />
            </Dialog.Header>

            <Dialog.Body className="p-2 -m-2">
                {hasDisabledInputs && (
                    <StatusBarEntry className="mb-4 bg-surface-warn">
                        <AlertTriangle className="size-6 shrink-0" />
                        <span className="text-sm font-semibold">{disabledInputsText}</span>
                    </StatusBarEntry>
                )}
                {notice && (
                    <StatusBarEntry className="mb-4 bg-surface-info">
                        <Info className="size-6 shrink-0" />
                        <span className="text-sm font-semibold">{notice}</span>
                    </StatusBarEntry>
                )}
                {/* `interactive` shows errors on touched inputs only, so a disabled one shows none. */}
                <ValidationVisibilityProvider visibility={hasDisabledInputs ? 'interactive' : 'all'}>
                    <FormRenderer
                        form={form}
                        propertySet={configSet}
                        enabled={enabled}
                        applicationKey={applicationKey}
                        project={project}
                        content={content}
                    />
                </ValidationVisibilityProvider>
            </Dialog.Body>

            <Dialog.Footer>
                <ApplyButton
                    label={applyLabel}
                    configSet={configSet}
                    form={form}
                    project={project}
                    content={content}
                    onApply={onApply}
                    onDirtyChange={onDirtyChange}
                />
            </Dialog.Footer>
        </>
    );
};

ApplicationConfigDialogContent.displayName = COMPONENT_NAME;

//
// * Apply button
//

type ApplyButtonProps = FormScope & {
    label: string;
    configSet: PropertySet;
    form: Form;
    onApply: () => void;
    onDirtyChange?: (dirty: boolean) => void;
};

const ApplyButton = ({
    label,
    configSet,
    form,
    project,
    content,
    onApply,
    onDirtyChange,
}: ApplyButtonProps): ReactElement => {
    const [dirty, setDirty] = useState(false);
    const [valid, setValid] = useState(true);

    useEffect(() => {
        const check = () => {
            const baseline = baselines.get(configSet);
            if (baseline == null) return;
            const isDirty = JSON.stringify(configSet.toJson()) !== baseline;
            setDirty(isDirty);
            onDirtyChange?.(isDirty);
            setValid(isFormValidInScope(form, configSet, { project, content }));
        };

        let frameId: number | undefined;
        if (!baselines.has(configSet)) {
            frameId = requestAnimationFrame(() => {
                baselines.set(configSet, JSON.stringify(configSet.toJson()));
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
    }, [configSet, form, project, content, onDirtyChange]);

    return <Button size="lg" label={label} variant="solid" disabled={!dirty || !valid} onClick={onApply} />;
};

ApplyButton.displayName = 'ApplicationConfigApplyButton';
