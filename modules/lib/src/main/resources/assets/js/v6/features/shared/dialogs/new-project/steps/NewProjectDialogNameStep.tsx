import {Dialog, Input} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement, useCallback, useEffect, useRef, useState} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {$newProjectDialog, setNewProjectDialogName} from '../../../../store/dialogs/newProjectDialog.store';
import {$projects} from '../../../../store/projects.store';
import {prettifyProjectIdentifier, validateProjectIdentifier} from '../../../../utils/cms/projects/identifier';

export const NewProjectDialogNameStepHeader = (): ReactElement => {
    const helperLabel = useI18n('dialog.project.wizard.title');
    const titleLabel = useI18n('dialog.project.wizard.name.title');
    const descriptionLabel = useI18n('dialog.project.wizard.name.description');

    return <Dialog.StepHeader step="step-name" helper={helperLabel} title={titleLabel} description={descriptionLabel} withClose />;
};

NewProjectDialogNameStepHeader.displayName = 'NewProjectDialogNameStepHeader';

export const NewProjectDialogNameStepContent = ({locked = false}: {locked?: boolean}): ReactElement => {
    const {projects} = useStore($projects);
    const {
        nameData: {name: initialName, identifier: initialIdentifier, description: initialDescription, hasError: initialHasError},
    } = useStore($newProjectDialog);
    const [name, setName] = useState(initialName);
    const identifierRef = useRef<HTMLInputElement>(null);
    const [identifier, setIdentifier] = useState(initialIdentifier);
    const [description, setDescription] = useState(initialDescription);
    const [nameError, setNameError] = useState<string>();
    const [identifierError, setIdentifierError] = useState<string>();
    const [descriptionError, setDescriptionError] = useState<string>();
    const isInitialRender = useRef(!initialHasError);
    const lastAutoIdentifierRef = useRef(prettifyProjectIdentifier(initialName, false));

    const projectNameLabel = useI18n('dialog.project.wizard.name.projectName');
    const projectIdentifierLabel = useI18n('dialog.project.wizard.name.projectIdentifier');
    const projectDescriptionLabel = useI18n('dialog.project.wizard.name.projectDescription');
    const projectErrorIdentifierAlreadyExists = useI18n('dialog.project.wizard.name.idAlreadyExists');
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

            const alreadyExists = projects.some((p) => p.getName() === prettifiedIdentifier);

            setIdentifierError(alreadyExists ? projectErrorIdentifierAlreadyExists : '');
        },
        [projects, errorRequiredField, errorInvalidField, projectErrorIdentifierAlreadyExists]
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

    // Map name to identifier on user input. Skip initial render.
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        const shouldSync = identifier === lastAutoIdentifierRef.current;
        lastAutoIdentifierRef.current = prettifyProjectIdentifier(name, false);

        if (shouldSync) {
            updateIdentifier(name, false);
        }
    }, [name, identifier, updateIdentifier]);

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

        setNewProjectDialogName(data);
    }, [name, identifier, description, nameError, identifierError, descriptionError]);

    return (
        <Dialog.StepContent step="step-name" locked={locked}>
            <div className="flex flex-col gap-7.5">
                <Input label={projectNameLabel} value={name} error={nameError} onChange={(e) => processName(e.currentTarget.value)} />
                <Input
                    ref={identifierRef}
                    label={projectIdentifierLabel}
                    value={identifier}
                    error={identifierError}
                    onChange={(e) => processIdentifier(e.currentTarget.value)}
                />
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

NewProjectDialogNameStepContent.displayName = 'NewProjectDialogNameStepContent';
