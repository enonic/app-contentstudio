import { type Application } from '@enonic/lib-admin-ui/application/Application';
import { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { type PropertySet } from '@enonic/input-types/data';
import { type Form } from '@enonic/input-types/schema';
import { validateForm } from '@enonic/input-types';
import { Button, Dialog } from '@enonic/ui';
import { AlertTriangle } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { StatusBarEntry } from '../../../shared/ui/dialogs/status-bar/StatusBarEntry';
import { ApplicationIcon } from '../../../shared/ui/icons/ApplicationIcon';
import { FormRenderer } from './FormRenderer';
import { hasScopeDisabledInputs } from './formScopeRequirements';
import type { FormScope } from './FormScopeContext';

const COMPONENT_NAME = 'ApplicationConfigDialogContent';

/** `project` and `content` scope the form; a key left out falls back to the stores. */
export type ApplicationConfigDialogContentProps = FormScope & {
    /** The application whose config form is edited. The key is the fallback title when it is unknown. */
    application: Application | undefined;
    applicationKey: string;
    form: Form;
    /** The set the form edits. Pass a clone; the caller copies it back on apply. */
    configSet: PropertySet;
    enabled: boolean;
    onApply: () => void;
    /** Whether the set differs from its state on mount; reported on every change. */
    onDirtyChange?: (dirty: boolean) => void;
};

/**
 * The content of an application's config dialog: header, a warning when the scope disables
 * some inputs, the form, and an Apply button that enables once the set is dirty and valid.
 * Mount it only while editing; its dirty baseline is taken on mount.
 */
export const ApplicationConfigDialogContent = ({
    application,
    applicationKey,
    form,
    configSet,
    enabled,
    project,
    content,
    onApply,
    onDirtyChange,
}: ApplicationConfigDialogContentProps): ReactElement => {
    const baselineRef = useRef<string | null>(null);

    const applyLabel = useI18n('action.apply');
    const disabledInputsText = useI18n('dialog.applicationConfig.disabledInputs');
    const hasDisabledInputs = hasScopeDisabledInputs(form, { project, content });

    const key = useMemo(() => ApplicationKey.fromString(applicationKey), [applicationKey]);

    return (
        <>
            <Dialog.Header className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {application && <ApplicationIcon application={application} className="size-8 shrink-0" />}
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
                {hasDisabledInputs && (
                    <StatusBarEntry className="mb-4 bg-surface-warn">
                        <AlertTriangle className="size-6 shrink-0" />
                        <span className="text-sm font-semibold">{disabledInputsText}</span>
                    </StatusBarEntry>
                )}
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

type ApplyButtonProps = {
    label: string;
    configSet: PropertySet;
    form: Form;
    baselineRef: React.RefObject<string | null>;
    onApply: () => void;
    onDirtyChange?: (dirty: boolean) => void;
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
            onDirtyChange?.(isDirty);
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

    return <Button size="lg" label={label} variant="solid" disabled={!dirty || !valid} onClick={onApply} />;
};

ApplyButton.displayName = 'ApplicationConfigApplyButton';
