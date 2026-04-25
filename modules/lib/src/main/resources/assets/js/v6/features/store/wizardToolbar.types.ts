import type {PublishStatus} from '../../../app/publish/PublishStatus';
import type {ContentState} from '../../../app/content/ContentState';

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
    isContentOnline: boolean;
    contentState: ContentState | null;
    isLayerProject: boolean;
};
