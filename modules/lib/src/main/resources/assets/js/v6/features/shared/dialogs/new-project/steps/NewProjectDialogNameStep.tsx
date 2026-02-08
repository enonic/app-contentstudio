import {Dialog, Input} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ChangeEvent, ReactElement, useCallback, useEffect, useRef, useState} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {setNewProjectDialogName} from '../../../../store/dialogs/newProjectDialog.store';
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
    const [name, setName] = useState('');
    const identifierRef = useRef<HTMLInputElement>(null);
    const [identifier, setIdentifier] = useState('');
    const [description, setDescription] = useState('');
    const [nameError, setNameError] = useState<string>();
    const [identifierError, setIdentifierError] = useState<string>();
    const [descriptionError, setDescriptionError] = useState<string>();
    const isInitialRender = useRef(true);
    const lastAutoIdentifierRef = useRef('');

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

    // Handlers
    const handleDisplayNameChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>): void => {
            const value = e.currentTarget.value;

            setName(value);
            setNameError('');

            if (value.length === 0) {
                setNameError(errorRequiredField);
                return;
            }
        },
        [errorRequiredField]
    );
    const handleIdentifierChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>): void => {
            const value = e.currentTarget.value;

            updateIdentifier(value, true);
        },
        [updateIdentifier]
    );
    const handleDescriptionChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        const value = e.currentTarget.value;

        setDescription(value);
        setDescriptionError('');
    }, []);

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

    // Map name to identifier on user input, skip initial render
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

    return (
        <Dialog.StepContent step="step-name" locked={locked}>
            <div className="flex flex-col gap-7.5">
                <Input label={projectNameLabel} value={name} error={nameError} onChange={handleDisplayNameChange} />
                <Input
                    ref={identifierRef}
                    label={projectIdentifierLabel}
                    value={identifier}
                    error={identifierError}
                    onChange={handleIdentifierChange}
                />
                <Input label={projectDescriptionLabel} value={description} error={descriptionError} onChange={handleDescriptionChange} />
            </div>
        </Dialog.StepContent>
    );
};

NewProjectDialogNameStepContent.displayName = 'NewProjectDialogNameStepContent';
