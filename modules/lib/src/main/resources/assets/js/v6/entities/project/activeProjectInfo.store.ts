import { computed } from 'nanostores';
import { $activeProject } from './activeProject.store';

export type ActiveProjectInfo = {
    label: string;
    name: string;
    language: string;
    hasIcon: boolean;
    isLayer: boolean;
};

export const $activeProjectInfo = computed($activeProject, (project): ActiveProjectInfo => {
    const language = project?.getLanguage() || '';
    const name = project?.getName() ?? '';
    const displayName = project?.getDisplayName() || name;

    return {
        label: language ? `${displayName} (${language})` : displayName,
        name,
        language,
        hasIcon: !!project?.getIcon(),
        isLayer: !!project?.hasParents(),
    };
});
