import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {map} from 'nanostores';
import {ProjectDeleteRequest} from '../../../../app/settings/resource/ProjectDeleteRequest';
import {clearPendingDeletedProject, markPendingDeletedProject} from '../projects.store';

type DeleteSettingsDialogStore = {
    open: boolean;
    expected: string;
    projectName: string;
    navigateAfterDeletion: boolean;
};

const initialState: DeleteSettingsDialogStore = {
    open: false,
    expected: '',
    projectName: '',
    navigateAfterDeletion: false,
};

export const $deleteSettingsDialog = map<DeleteSettingsDialogStore>(structuredClone(initialState));

export const openDeleteSettingsDialog = (expected: string, projectName: string, navigateAfterDeletion: boolean = false): void => {
    $deleteSettingsDialog.set({
        ...structuredClone(initialState),
        open: true,
        expected,
        projectName,
        navigateAfterDeletion,
    });
};

export const closeDeleteSettingsDialog = (): void => {
    $deleteSettingsDialog.set(structuredClone(initialState));
};

export const executeDeleteSettingsDialogAction = (): void => {
    const {projectName, navigateAfterDeletion} = $deleteSettingsDialog.get();

    if (!projectName) return;

    markPendingDeletedProject(projectName, navigateAfterDeletion);

    new ProjectDeleteRequest(projectName).sendAndParse().then(() => {
        closeDeleteSettingsDialog();
        showFeedback(i18n('notify.settings.project.deleted', projectName));
    }).catch((error) => {
        clearPendingDeletedProject(projectName);
        DefaultErrorHandler.handle(error);
    });
};
