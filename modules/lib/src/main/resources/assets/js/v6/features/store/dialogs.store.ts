import {map} from 'nanostores';

type DialogsStore = {
    projectSelectionDialogOpen: boolean;
};

export const $dialogs = map<DialogsStore>({
    projectSelectionDialogOpen: false,
});

export const setProjectSelectionDialogOpen = (open: boolean) => {
    $dialogs.setKey('projectSelectionDialogOpen', open);
};
