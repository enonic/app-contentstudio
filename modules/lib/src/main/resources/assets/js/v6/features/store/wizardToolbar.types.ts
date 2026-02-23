import type {PublishStatus} from '../../../app/publish/PublishStatus';
import type {WorkflowStateStatus} from '../../../app/wizard/WorkflowStateManager';

export type WizardToolbarCollaborator = {
    key: string;
    label: string;
    isCurrent?: boolean;
};

export type WizardToolbarStore = {
    projectLabel: string;
    projectName: string;
    projectLanguage: string;
    projectHasIcon: boolean;
    collaborators: WizardToolbarCollaborator[];
    publishStatus: PublishStatus | null;
    contentPath: string;
    canRenameContentPath: boolean;
    workflowStatus: WorkflowStateStatus | null;
    isLayerProject: boolean;
};
