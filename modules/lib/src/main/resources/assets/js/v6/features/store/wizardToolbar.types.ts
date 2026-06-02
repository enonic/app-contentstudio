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
    contentName: string;
    contentParentPath: string;
    canRenameContentPath: boolean;
    isContentOnline: boolean;
    contentState: ContentState | null;
    isLayerProject: boolean;
    isContentInherited: boolean;
    isContentDataInherited: boolean;
};
