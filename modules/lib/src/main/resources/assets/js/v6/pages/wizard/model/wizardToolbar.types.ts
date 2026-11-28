import type { PublishStatus } from '../../../../app/publish/PublishStatus';
import type { ContentState } from '../../../shared/lib/cms/content/ContentState';

export type WizardToolbarCollaborator = {
    key: string;
    label: string;
    isCurrent?: boolean;
};

export type WizardToolbarStore = {
    collaborators: WizardToolbarCollaborator[];
    publishStatus: PublishStatus | null;
    contentName: string;
    contentParentPath: string;
    canRenameContentPath: boolean;
    isContentOnline: boolean;
    contentState: ContentState | null;
    isContentInherited: boolean;
    isContentDataInherited: boolean;
};
