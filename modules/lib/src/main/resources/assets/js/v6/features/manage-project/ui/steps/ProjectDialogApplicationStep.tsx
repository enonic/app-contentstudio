import { Dialog, IconButton, ListItem, Tooltip } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { Layers, Pencil, X } from 'lucide-react';
import { listenKeys } from 'nanostores';
import { ReactElement, type RefObject, useMemo, useSyncExternalStore } from 'react';
import {
    $projectDialog,
    $projectDialogInheritedAppKeys,
    moveProjectDialogApplication,
    openProjectDialogApplicationConfig,
    selectProjectDialogApplications,
    unselectProjectDialogApplication,
} from '../../model/projectDialog.store';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { ItemLabel } from '../../../../shared/ui/ItemLabel';
import { ApplicationIcon } from '../../../../shared/ui/icons/ApplicationIcon';
import { ApplicationSelector } from '../../../shared/selectors/ApplicationSelector';
import { SortableGridList } from '@enonic/input-types';
import { type Application } from '../../../../entities/application';

export const ProjectDialogApplicationStepHeader = (): ReactElement => {
    const { mode, title } = useStore($projectDialog, { keys: ['mode', 'title'] });
    const titleLabel = useI18n('dialog.project.wizard.application.title');
    const descriptionLabel = useI18n('dialog.project.wizard.application.description');

    return (
        <Dialog.StepHeader
            step="step-application"
            helper={title}
            title={titleLabel}
            description={mode === 'create' && descriptionLabel}
            withClose
        />
    );
};

ProjectDialogApplicationStepHeader.displayName = 'ProjectDialogApplicationStepHeader';

export type ProjectDialogApplicationStepContentProps = {
    locked?: boolean;
    applicationInputRef?: RefObject<HTMLInputElement | null>;
};

export const ProjectDialogApplicationStepContent = ({
    locked = false,
    applicationInputRef,
}: ProjectDialogApplicationStepContentProps): ReactElement => {
    // Hooks
    const { mode } = useStore($projectDialog, { keys: ['mode'] });
    const applications = useSyncExternalStore(subscribeToApplications, getApplications);
    const inheritedKeys = useStore($projectDialogInheritedAppKeys);
    const selection = useMemo(() => applications.map((app) => app.key), [applications]);

    // Constants
    const label = useI18n('settings.items.wizard.step.applications');
    const typeToSearchLabel = useI18n('field.option.placeholder');
    const noApplicationsFoundLabel = useI18n('dialog.project.wizard.application.noApplicationsFound');
    const reorderLabel = useI18n('field.occurrence.action.reorder');
    const configsDisabledText = useI18n('dialog.project.wizard.application.configsDisabled');
    const isCreating = mode === 'create';
    const hasConfigurableApp = applications.some(hasForm);

    return (
        <Dialog.StepContent step="step-application" locked={locked}>
            <ApplicationSelector
                inputRef={applicationInputRef}
                label={label}
                selection={selection}
                onSelectionChange={selectProjectDialogApplications}
                selectionMode="staged"
                placeholder={typeToSearchLabel}
                emptyLabel={noApplicationsFoundLabel}
                inheritedKeys={inheritedKeys}
                closeOnBlur
            />
            {applications.length > 0 && (
                <SortableGridList
                    items={applications}
                    keyExtractor={(app) => app.key}
                    onMove={moveProjectDialogApplication}
                    enabled
                    fullRowDraggable
                    dragLabel={reorderLabel}
                    className="flex flex-col gap-y-2.5 rounded-md mb-2.5 py-2.5 px-1"
                    renderItem={({ item: application }) => (
                        <ProjectDialogApplicationRow
                            application={application}
                            inherited={inheritedKeys.has(application.key)}
                            editDisabled={isCreating}
                        />
                    )}
                />
            )}
            {isCreating && hasConfigurableApp && (
                <p className="py-2 text-sm text-subtle italic">{configsDisabledText}</p>
            )}
        </Dialog.StepContent>
    );
};

ProjectDialogApplicationStepContent.displayName = 'ProjectDialogApplicationStepContent';

//
// * ProjectDialogApplicationRow
//

type ProjectDialogApplicationRowProps = {
    application: Application;
    inherited: boolean;
    editDisabled: boolean;
};

/** A listed app: name, description, pencil when it has a form, X, or a layers icon when inherited. A stand-in reads as unavailable. */
const ProjectDialogApplicationRow = ({
    application,
    inherited,
    editDisabled,
}: ProjectDialogApplicationRowProps): ReactElement => {
    const key = application.key;

    const editLabel = useI18n('action.edit');
    const removeLabel = useI18n('action.remove');
    const inheritedLabel = useI18n('text.application.inherited');
    const unavailableLabel = useI18n('text.application.not.available', key);

    const description = application.state ? application.description : unavailableLabel;

    return (
        <ListItem className="pl-0 py-0 flex-1 bg-unset">
            <ListItem.Content className="flex items-center gap-2.5 p-1.5 rounded">
                <ItemLabel
                    icon={<ApplicationIcon application={application} />}
                    primary={application.displayName}
                    secondary={description}
                    className="flex-1 self-stretch"
                />
                {hasForm(application) && (
                    <IconButton
                        variant="text"
                        icon={Pencil}
                        aria-label={editLabel}
                        disabled={editDisabled}
                        onClick={() => openProjectDialogApplicationConfig(key)}
                    />
                )}
                {inherited ? (
                    <Tooltip value={inheritedLabel} delay={300}>
                        <span
                            role="img"
                            aria-label={inheritedLabel}
                            tabIndex={0}
                            className="size-10 shrink-0 p-2.5 text-subtle rounded-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                        >
                            <Layers aria-hidden="true" focusable="false" strokeWidth={1.5} className="size-full" />
                        </span>
                    </Tooltip>
                ) : (
                    <IconButton
                        variant="text"
                        icon={X}
                        aria-label={removeLabel}
                        onClick={() => unselectProjectDialogApplication(key)}
                    />
                )}
            </ListItem.Content>
        </ListItem>
    );
};

ProjectDialogApplicationRow.displayName = 'ProjectDialogApplicationRow';

//
// * Internal
//

// Subscribes to the listed apps only, so the other keys of the store leave the step alone.
const subscribeToApplications = (onChange: () => void): (() => void) =>
    listenKeys($projectDialog, ['applications'], onChange);

// The listed apps, read on every notification.
const getApplications = () => $projectDialog.get().applications;

// Whether the app has a config form worth a pencil.
const hasForm = (application: Application): boolean => application.form?.getFormItems().length > 0;
