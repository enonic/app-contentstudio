import { Dialog, IconButton, ListItem } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { Pencil, X } from 'lucide-react';
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

const subscribeToApplications = (onChange: () => void): (() => void) =>
    listenKeys($projectDialog, ['applications'], onChange);
const getApplications = () => $projectDialog.get().applications;

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
    const applications = useSyncExternalStore(subscribeToApplications, getApplications);
    const inheritedKeys = useStore($projectDialogInheritedAppKeys);
    const selection = useMemo(() => applications.map((app) => app.getApplicationKey().toString()), [applications]);

    // Constants
    const label = useI18n('settings.items.wizard.step.applications');
    const typeToSearchLabel = useI18n('field.option.placeholder');
    const noApplicationsFoundLabel = useI18n('dialog.project.wizard.application.noApplicationsFound');
    const reorderLabel = useI18n('field.occurrence.action.reorder');
    const editLabel = useI18n('action.edit');
    const removeLabel = useI18n('action.remove');

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
                    keyExtractor={(app) => app.getApplicationKey().toString()}
                    onMove={moveProjectDialogApplication}
                    enabled
                    fullRowDraggable
                    dragLabel={reorderLabel}
                    className="flex flex-col gap-y-2.5 rounded-md mb-2.5 py-2.5 px-1"
                    renderItem={({ item: application }) => {
                        const key = application.getApplicationKey().toString();
                        const hasForm = application.getForm()?.getFormItems().length > 0;

                        return (
                            <ListItem className="pl-0 py-0 flex-1 bg-unset">
                                <ListItem.Content className="flex items-center gap-2.5 p-1.5 rounded cursor-move">
                                    <ItemLabel
                                        icon={<ApplicationIcon application={application} />}
                                        primary={application.getDisplayName()}
                                        secondary={application.getDescription()}
                                        className="flex-1 self-stretch"
                                    />
                                    {hasForm && (
                                        <IconButton
                                            variant="text"
                                            icon={Pencil}
                                            aria-label={editLabel}
                                            onClick={() => openProjectDialogApplicationConfig(key)}
                                        />
                                    )}
                                    {!inheritedKeys.has(key) && (
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
                    }}
                />
            )}
        </Dialog.StepContent>
    );
};

ProjectDialogApplicationStepContent.displayName = 'ProjectDialogApplicationStepContent';
