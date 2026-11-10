import { atom } from 'nanostores';

export const $keyBindingsShelved = atom(false);

export const setKeyBindingsShelved = (shelved: boolean): void => {
    $keyBindingsShelved.set(shelved);
};
