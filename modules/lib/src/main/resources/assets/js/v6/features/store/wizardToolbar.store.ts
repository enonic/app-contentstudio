import {map} from 'nanostores';
import type {PublishStatus} from '../../../app/publish/PublishStatus';
import type {WorkflowStateStatus} from '../../../app/wizard/WorkflowStateManager';
import type {WizardToolbarCollaborator, WizardToolbarStore} from './wizardToolbar.types';

const createInitialState = (): WizardToolbarStore => ({
    projectLabel: '',
    projectName: '',
    projectLanguage: '',
    projectHasIcon: false,
    collaborators: [],
    publishStatus: null,
    contentPath: '',
    canRenameContentPath: false,
    isPathAvailable: true,
    isContentOnline: false,
    workflowStatus: null,
    isLayerProject: false,
});

export const $wizardToolbar = map<WizardToolbarStore>(createInitialState());

export function setWizardToolbarProjectLabel(projectLabel: string): void {
    $wizardToolbar.setKey('projectLabel', projectLabel);
}

export function setWizardToolbarProjectInfo(projectName: string, projectLanguage: string, projectHasIcon: boolean): void {
    $wizardToolbar.setKey('projectName', projectName);
    $wizardToolbar.setKey('projectLanguage', projectLanguage);
    $wizardToolbar.setKey('projectHasIcon', projectHasIcon);
}

export function setWizardToolbarCollaborators(collaborators: WizardToolbarCollaborator[]): void {
    $wizardToolbar.setKey('collaborators', collaborators);
}

export function setWizardToolbarPublishStatus(publishStatus: PublishStatus | null): void {
    $wizardToolbar.setKey('publishStatus', publishStatus);
}

export function setWizardToolbarContentPath(contentPath: string): void {
    $wizardToolbar.setKey('contentPath', contentPath);
}

export function setWizardToolbarCanRenameContentPath(canRenameContentPath: boolean): void {
    $wizardToolbar.setKey('canRenameContentPath', canRenameContentPath);
}

export function setWizardToolbarIsPathAvailable(isPathAvailable: boolean): void {
    $wizardToolbar.setKey('isPathAvailable', isPathAvailable);
}

export function setWizardToolbarIsContentOnline(isContentOnline: boolean): void {
    $wizardToolbar.setKey('isContentOnline', isContentOnline);
}

export function setWizardToolbarWorkflowStatus(workflowStatus: WorkflowStateStatus | null): void {
    $wizardToolbar.setKey('workflowStatus', workflowStatus);
}

export function setWizardToolbarIsLayerProject(isLayerProject: boolean): void {
    $wizardToolbar.setKey('isLayerProject', isLayerProject);
}

export function resetWizardToolbar(): void {
    $wizardToolbar.set(createInitialState());
}
