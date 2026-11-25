import { isPrincipalKey } from '@enonic/ui-utils';
import { subscribe as subscribeToCollaborators } from '../../../../app/stores/collaboration';
import { resolvePrincipalsByKeys } from '../../../entities/principal/api/principals.api';
import { getActiveProjectName } from '../../../entities/project/activeProject.store';
import { getCurrentUser } from '../../../shared/lib/cms/security/auth';
import { handleError } from '../../../shared/notifications';
import { setWizardToolbarCollaborators } from './wizardToolbar.store';

let displayNames: Map<string, string> | undefined;

let unsubscribeFromCollaborators: (() => void) | undefined;

let watchedContentId: string | undefined;

let requestId = 0;

function getDisplayNames(): Map<string, string> {
    if (displayNames != null) return displayNames;

    displayNames = new Map();

    const user = getCurrentUser();
    if (user?.key) {
        displayNames.set(user.key, user.displayName);
    }

    return displayNames;
}

function sortCollaboratorKeys(keys: string[]): string[] {
    const currentUserKey = getCurrentUser()?.key;
    if (!currentUserKey) return keys;

    return [...keys].sort((a, b) => {
        if (a === currentUserKey) return -1;
        if (b === currentUserKey) return 1;
        return 0;
    });
}

function updateCollaborators(keys: string[], id: number): void {
    if (id !== requestId) return;

    const names = getDisplayNames();
    const currentUserKey = getCurrentUser()?.key;

    setWizardToolbarCollaborators(
        keys.map((key) => ({
            key,
            label: names.get(key) || key,
            isCurrent: currentUserKey === key,
        })),
    );
}

function handleCollaboratorsUpdated(collaborators: Set<string>): void {
    const keys = sortCollaboratorKeys(Array.from(collaborators));
    const id = ++requestId;
    const names = getDisplayNames();
    const missingKeys = keys.filter((key) => !names.has(key)).filter(isPrincipalKey);

    if (missingKeys.length === 0) {
        updateCollaborators(keys, id);
        return;
    }

    void resolvePrincipalsByKeys(missingKeys)
        .match((principals) => {
            principals.forEach((principal) => names.set(principal.key, principal.displayName));
        }, handleError)
        .then(() => updateCollaborators(keys, id));
}

function unsubscribe(): void {
    unsubscribeFromCollaborators?.();
    unsubscribeFromCollaborators = undefined;
    watchedContentId = undefined;
    requestId += 1;
    setWizardToolbarCollaborators([]);
}

/** Shows who else has the content open in the wizard toolbar; a repeated call for the same content does nothing. */
export function watchWizardCollaborators(contentId: string): void {
    if (watchedContentId === contentId) return;

    unsubscribe();
    watchedContentId = contentId;
    unsubscribeFromCollaborators = subscribeToCollaborators(contentId, getActiveProjectName(), (collaborators) =>
        handleCollaboratorsUpdated(collaborators),
    );
}

export function unwatchWizardCollaborators(): void {
    unsubscribe();
    displayNames = undefined;
}
