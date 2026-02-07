import {Dialog, Input} from '@enonic/ui';
import {ReactElement, useCallback, useEffect, useRef, useState} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {TargetedEvent} from 'preact';
import {useStore} from '@nanostores/preact';
import {$projects} from '../../../../store/projects.store';
import {NamePrettyfier} from '@enonic/lib-admin-ui/NamePrettyfier';
import {setNewProjectDialogName} from '../../../../store/dialogs/newProjectDialog.store';

export const NewProjectDialogNameStepHeader = (): ReactElement => {
    const helperLabel = useI18n('dialog.project.wizard.title');
    const titleLabel = useI18n('dialog.project.wizard.name.title');
    const descriptionLabel = useI18n('dialog.project.wizard.name.description');

    return <Dialog.StepHeader step="step-name" helper={helperLabel} title={titleLabel} description={descriptionLabel} withClose />;
};

NewProjectDialogNameStepHeader.displayName = 'NewProjectDialogNameStepHeader';

export const NewProjectDialogNameStepContent = ({locked = false}: {locked?: boolean}): ReactElement => {
    const {projects} = useStore($projects);
    const [name, setName] = useState<string>();
    const identifierRef = useRef<HTMLInputElement>(null);
    const [identifier, setIdentifier] = useState<string>();
    const [description, setDescription] = useState<string>();
    const [nameError, setNameError] = useState<string>();
    const [identifierError, setIdentifierError] = useState<string>();
    const [descriptionError, setDescriptionError] = useState<string>();

    // Logic to update the identifier
    const updateIdentifier = useCallback(
        (value: string, isUserInput?: boolean) => {
            const prettifiedIdentifier = prettify(value, isUserInput);

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
        [setIdentifier, setIdentifierError, validateProjectIdentifier, projects]
    );

    // Sync with the store
    useEffect(() => {
        const hasErrors = Boolean(nameError) || Boolean(identifierError) || Boolean(descriptionError);

        const data = {
            name: name?.trim(),
            identifier: identifier?.trim(),
            description: description?.trim(),
            hasError: hasErrors,
        };

        setNewProjectDialogName(data);
    }, [name, identifier, description, nameError, identifierError, descriptionError]);

    // Map name to identifier
    useEffect(() => {
        // On first call, we don't call update the identifier to avoid initial input validation error
        if (name === undefined) return;

        updateIdentifier(name, false);
    }, [name, updateIdentifier]);

    // Constants
    const projectNameLabel = useI18n('dialog.project.wizard.name.projectName');
    const projectIdentifierLabel = useI18n('dialog.project.wizard.name.projectIdentifier');
    const projectDescriptionLabel = useI18n('dialog.project.wizard.name.projectDescription');
    const projectErrorIdentifierAlreadyExists = useI18n('dialog.project.wizard.name.idAlreadyExists');
    const errorRequiredField = useI18n('field.value.required');
    const errorInvalidField = useI18n('field.value.invalid');

    // Handlers
    const handleDisplayNameChange = useCallback(
        (e: TargetedEvent<HTMLInputElement>): void => {
            const value = e.currentTarget.value;

            setName(value);
            setNameError('');

            if (value.length === 0) {
                setNameError(errorRequiredField);
                return;
            }
        },
        [setName, setNameError]
    );
    const handleIdentifierChange = useCallback(
        (e: TargetedEvent<HTMLInputElement>): void => {
            const value = e.currentTarget.value;

            updateIdentifier(value, true);
        },
        [updateIdentifier]
    );
    const handleDescriptionChange = useCallback(
        (e: TargetedEvent<HTMLInputElement>): void => {
            const value = e.currentTarget.value;

            setDescription(value);
            setDescriptionError('');
        },
        [setDescription, setDescriptionError]
    );

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

//
// * Utilities
//

function validateProjectIdentifier(value: string): boolean {
    const regExp = /^([a-z0-9])([a-z0-9-])*$/;

    return regExp.test(value) && !value.endsWith('-');
}

function prettify(value: string, isUserInput?: boolean): string {
    const prettified = NamePrettyfier.prettify(value).replace(/\./g, '');

    if (isUserInput && value.endsWith('-') && !prettified.endsWith('-')) {
        return prettified + '-';
    }
    return prettified;
}
