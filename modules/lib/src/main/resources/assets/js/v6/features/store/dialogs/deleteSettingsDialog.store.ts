import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {map} from 'nanostores';
import {ProjectDeleteRequest} from '../../../../app/settings/resource/ProjectDeleteRequest';

type DeleteSettingsDialogStore = {
    open: boolean;
    expected: string;
    projectName: string;
};

const initialState: DeleteSettingsDialogStore = {
    open: false,
    expected: '',
    projectName: '',
};

export const $deleteSettingsDialog = map<DeleteSettingsDialogStore>(structuredClone(initialState));

export const openDeleteSettingsDialog = (expected: string, projectName: string): void => {
    $deleteSettingsDialog.set({
        ...structuredClone(initialState),
        open: true,
        expected,
        projectName,
    });
};

export const closeDeleteSettingsDialog = (): void => {
    $deleteSettingsDialog.set(structuredClone(initialState));
};

export const executeDeleteSettingsDialogAction = (): void => {
    const {projectName} = $deleteSettingsDialog.get();

    if (!projectName) return;

    new ProjectDeleteRequest(projectName).sendAndParse().then(() => {
        closeDeleteSettingsDialog();
        showFeedback(i18n('notify.settings.project.deleted', projectName));
    }).catch(DefaultErrorHandler.handle);
};
