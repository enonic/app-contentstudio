import {atom} from 'nanostores';

export const $mode = atom<'wizard' | 'browser' | null>(null);

export const setMode = (mode: 'wizard' | 'browser') => {
    $mode.set(mode);
};

export const getMode = () => $mode.get();
