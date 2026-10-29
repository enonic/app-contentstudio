import { Dialog, Input } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { ReactElement, type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { $projectDialog, setProjectDialogName } from '../../model/projectDialog.store';
import { $projects } from '../../../../entities/project';
import { prettifyProjectIdentifier, validateProjectIdentifier } from '../../../../shared/lib/cms/projects/identifier';

const MAX_IDENTIFIER_LENGTH = 48;

export const ProjectDialogNameStepHeader = (): ReactElement => {
    const { mode, title } = useStore($projectDialog, { keys: ['mode', 'title'] });
    const titleLabel = useI18n('dialog.project.wizard.name.title');
    const descriptionLabel = useI18n('dialog.project.wizard.name.description');

    return (
        <Dialog.StepHeader
            step="step-name"
            helper={title}
            title={titleLabel}
            description={mode === 'create' && descriptionLabel}
            withClose
        />
    );
};

ProjectDialogNameStepHeader.displayName = 'ProjectDialogNameStepHeader';

export type ProjectDialogNameStepContentProps = {
    locked?: boolean;
    nameStepRef?: RefObject<HTMLDivElement | null>;
};

export const ProjectDialogNameStepContent = ({
    locked = false,
    nameStepRef,
}: ProjectDialogNameStepContentProps): ReactElement => {
    const { projects } = useStore($projects);
    const {
        nameData: {
            name: projectName,
            identifier: projectIdentifier,
            description: projectDescription,
            hasError: projectNameHasError,
        },
        mode,
    } = useStore($projectDialog, { keys: ['nameData', 'mode'] });
    const [name, setName] = useState(projectName);
    const identifierRef = useRef<HTMLInputElement>(null);
    const [identifier, setIdentifier] = useState(projectIdentifier);
    const [description, setDescription] = useState(projectDescription);
    const [nameError, setNameError] = useState<string>();
    const [identifierError, setIdentifierError] = useState<string>();
    const [descriptionError, setDescriptionError] = useState<string>();
    const isInitialRender = useRef(true);
    const hasStoredErrorsRef = useRef(projectNameHasError);
    // The identifier follows the display name until the user types a different identifier.
    const isIdentifierCustomRef = useRef(
        projectIdentifier.length > 0 && projectIdentifier !== prettifyProjectIdentifier(projectName, false),
    );

    const projectNameLabel = `${useI18n('field.displayName')} *`;
    const projectIdentifierLabel = `${useI18n('settings.field.project.name')} *`;
    const projectDescriptionLabel = useI18n('field.description');
    const projectErrorIdentifierAlreadyExists = useI18n('settings.project.name.occupied');
    const errorRequiredField = useI18n('field.value.required');
    const errorInvalidField = useI18n('field.value.invalid');
    const errorIdentifierTooLong = useI18n('settings.wizard.project.identifier.tooLong', MAX_IDENTIFIER_LENGTH);

    const validateName = useCallback(
        (value: string): void => {
            setNameError(value.length === 0 ? errorRequiredField : '');
        },
        [errorRequiredField],
    );

    const validateIdentifier = useCallback(
        (value: string): void => {
            if (value.length === 0) {
                setIdentifierError(errorRequiredField);
                return;
            }

            if (value.length > MAX_IDENTIFIER_LENGTH) {
                setIdentifierError(errorIdentifierTooLong);
                return;
            }

            if (!validateProjectIdentifier(value)) {
                setIdentifierError(errorInvalidField);
                return;
            }

            // In edit mode, the identifier is static and cannot be changed.
            const alreadyExists = mode !== 'edit' && projects.some((p) => p.getName() === value);
            setIdentifierError(alreadyExists ? projectErrorIdentifierAlreadyExists : '');
        },
        [
            mode,
            projects,
            errorRequiredField,
            errorInvalidField,
            errorIdentifierTooLong,
            projectErrorIdentifierAlreadyExists,
        ],
    );

    const updateIdentifier = (value: string, isUserInput?: boolean): void => {
        const prettifiedIdentifier = prettifyProjectIdentifier(value, isUserInput);

        setIdentifier(prettifiedIdentifier);
        if (identifierRef.current) identifierRef.current.value = prettifiedIdentifier;
        validateIdentifier(prettifiedIdentifier);
    };

    // The values are updated here, synchronously with the input event. An effect that sets them
    // runs later and overwrites the keystrokes typed before it has run.
    const handleNameChange = (value: string): void => {
        setName(value);
        validateName(value);

        if (mode !== 'edit' && !isIdentifierCustomRef.current) {
            updateIdentifier(value, false);
        }
    };

    const handleIdentifierChange = (value: string): void => {
        const prettifiedIdentifier = prettifyProjectIdentifier(value, true);

        isIdentifierCustomRef.current =
            prettifiedIdentifier.length > 0 && prettifiedIdentifier !== prettifyProjectIdentifier(name, false);
        updateIdentifier(value, true);
    };

    const handleDescriptionChange = (value: string): void => {
        setDescription(value);
        setDescriptionError('');
        // Typing a description surfaces the errors of the required fields left empty.
        validateName(name);
        validateIdentifier(identifier);
    };

    // Shows the errors of the stored values when the step is rendered again with errors (the dialog
    // view returned to 'main') and re-checks the identifier when the projects list changes.
    // Only the errors are set here, see handleNameChange.
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            if (!hasStoredErrorsRef.current) return;
        }

        validateName(name);
        validateIdentifier(identifier);
    }, [name, identifier, validateName, validateIdentifier]);

    // Sync with the store
    useEffect(() => {
        const hasErrors = Boolean(nameError) || Boolean(identifierError) || Boolean(descriptionError);
        const isIncomplete = name.trim().length === 0 || identifier.trim().length === 0;

        const data = {
            name: name.trim(),
            identifier: identifier.trim(),
            description: description.trim(),
            hasError: hasErrors || isIncomplete,
        };

        setProjectDialogName(data);
    }, [name, identifier, description, nameError, identifierError, descriptionError]);

    return (
        <Dialog.StepContent step="step-name" locked={locked}>
            <div ref={nameStepRef} className="flex flex-col gap-7.5">
                {/* Name */}
                <Input
                    label={projectNameLabel}
                    value={name}
                    error={nameError}
                    onChange={(e) => handleNameChange(e.currentTarget.value)}
                />

                {/* Identifier */}
                {mode === 'create' && (
                    <Input
                        ref={identifierRef}
                        label={projectIdentifierLabel}
                        value={identifier}
                        error={identifierError}
                        onChange={(e) => handleIdentifierChange(e.currentTarget.value)}
                    />
                )}
                {mode === 'edit' && (
                    <div className="flex flex-col gap-2">
                        <span className="font-semibold">{projectIdentifierLabel}</span>
                        <span className="text-subtle">{identifier}</span>
                    </div>
                )}

                {/* Description */}
                <Input
                    label={projectDescriptionLabel}
                    value={description}
                    error={descriptionError}
                    onChange={(e) => handleDescriptionChange(e.currentTarget.value)}
                />
            </div>
        </Dialog.StepContent>
    );
};

ProjectDialogNameStepContent.displayName = 'ProjectDialogNameStepContent';
