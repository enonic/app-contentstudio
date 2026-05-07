import {Dialog, Input} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement, useCallback, useEffect, useRef, useState} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {$projectDialog, setProjectDialogName} from '../../../../store/dialogs/projectDialog.store';
import {$projects} from '../../../../store/projects.store';
import {prettifyProjectIdentifier, validateProjectIdentifier} from '../../../../utils/cms/projects/identifier';

export const ProjectDialogNameStepHeader = (): ReactElement => {
    const {mode, title} = useStore($projectDialog, {keys: ['mode', 'title']});
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
};

export const ProjectDialogNameStepContent = ({locked = false}: ProjectDialogNameStepContentProps): ReactElement => {
    const {projects} = useStore($projects);
    const {
        nameData: {name: projectName, identifier: projectIdentifier, description: projectDescription, hasError: projectNameHasError},
        mode,
    } = useStore($projectDialog, {keys: ['nameData', 'mode']});
    const [name, setName] = useState(projectName);
    const identifierRef = useRef<HTMLInputElement>(null);
    const [identifier, setIdentifier] = useState(projectIdentifier);
    const [description, setDescription] = useState(projectDescription);
    const [nameError, setNameError] = useState<string>();
    const [identifierError, setIdentifierError] = useState<string>();
    const [descriptionError, setDescriptionError] = useState<string>();
    const isInitialRender = useRef(!projectNameHasError);
    const lastAutoIdentifierRef = useRef(prettifyProjectIdentifier(projectName, false));

    const projectNameLabel = `${useI18n('field.displayName')} *`;
    const projectIdentifierLabel = `${useI18n('settings.field.project.name')} *`;
    const projectDescriptionLabel = useI18n('field.description');
    const projectErrorIdentifierAlreadyExists = useI18n('settings.project.name.occupied');
    const errorRequiredField = useI18n('field.value.required');
    const errorInvalidField = useI18n('field.value.invalid');

    const updateIdentifier = useCallback(
        (value: string, isUserInput?: boolean) => {
            const prettifiedIdentifier = prettifyProjectIdentifier(value, isUserInput);

            setIdentifier(prettifiedIdentifier);
            if (identifierRef.current) identifierRef.current.value = prettifiedIdentifier;

            setIdentifierError('');

            if (prettifiedIdentifier.length === 0) {
                setIdentifierError(errorRequiredField);
                return;
            }

            if (!validateProjectIdentifier(prettifiedIdentifier)) {
                setIdentifierError(errorInvalidField);
                return;
            }

            // In edit mode, the identifier is static and cannot be changed.
            if (mode !== 'edit') {
                const alreadyExists = projects.some((p) => p.getName() === prettifiedIdentifier);
                setIdentifierError(alreadyExists ? projectErrorIdentifierAlreadyExists : '');
            }
        },
        [mode, projects, errorRequiredField, errorInvalidField, projectErrorIdentifierAlreadyExists]
    );

    // Processors
    const processName = useCallback(
        (value: string): void => {
            setName(value);
            setNameError('');

            if (value.length === 0) {
                setNameError(errorRequiredField);
            }
        },
        [errorRequiredField]
    );
    const processIdentifier = useCallback(
        (value: string): void => {
            updateIdentifier(value, true);
        },
        [updateIdentifier]
    );
    const processDescription = useCallback((value: string): void => {
        setDescription(value);
        setDescriptionError('');
    }, []);

    // Process values. Skip initial render.
    // Dialog view goes back to 'main' => Re-render this component => Re-process to show possible errors
    useEffect(() => {
        if (isInitialRender.current) return;

        processName(name);
        processIdentifier(identifier);
        processDescription(description);
    }, [name, identifier, description, processName, processIdentifier, processDescription]);

    // Map name to identifier on user input. Skip initial render. Skip in edit mode.
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        if (mode === 'edit') return;

        const shouldSync = identifier === lastAutoIdentifierRef.current;
        lastAutoIdentifierRef.current = prettifyProjectIdentifier(name, false);

        if (shouldSync) {
            updateIdentifier(name, false);
        }
    }, [mode, name, identifier, updateIdentifier]);

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
            <div className="flex flex-col gap-7.5">
                {/* Name */}
                <Input label={projectNameLabel} value={name} error={nameError} onChange={(e) => processName(e.currentTarget.value)} />

                {/* Identifier */}
                {mode === 'create' && (
                    <Input
                        ref={identifierRef}
                        label={projectIdentifierLabel}
                        value={identifier}
                        error={identifierError}
                        onChange={(e) => processIdentifier(e.currentTarget.value)}
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
                    onChange={(e) => processDescription(e.currentTarget.value)}
                />
            </div>
        </Dialog.StepContent>
    );
};

ProjectDialogNameStepContent.displayName = 'ProjectDialogNameStepContent';
