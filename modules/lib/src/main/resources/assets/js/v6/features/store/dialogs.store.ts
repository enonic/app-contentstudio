import {map} from 'nanostores';

type DialogsStore = {
    projectSelectionDialogOpen: boolean;
    publishDialogOpen: boolean;
};

export const $dialogs = map<DialogsStore>({
    projectSelectionDialogOpen: false,
    publishDialogOpen: false,
});

export const setProjectSelectionDialogOpen = (open: boolean) => {
    $dialogs.setKey('projectSelectionDialogOpen', open);
};

export const setPublishDialogOpen = (open: boolean) => {
    $dialogs.setKey('publishDialogOpen', open);
};
