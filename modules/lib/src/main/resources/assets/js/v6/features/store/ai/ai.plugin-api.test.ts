import {beforeEach, describe, expect, it} from 'vitest';
import {createPluginApi} from './ai.plugin-api';
import {$aiPluginDialogOpen} from './ai.store';

describe('createPluginApi', () => {
    beforeEach(() => {
        $aiPluginDialogOpen.set({'ai.translator': false, 'ai.contentOperator': false});
    });

    describe('setDialogState', () => {
        it('flips only the calling plugin dialog state to true', () => {
            createPluginApi('ai.contentOperator').api.setDialogState(true);

            expect($aiPluginDialogOpen.get()['ai.contentOperator']).toBe(true);
            expect($aiPluginDialogOpen.get()['ai.translator']).toBe(false);
        });

        it('flips only the calling plugin dialog state to false', () => {
            $aiPluginDialogOpen.set({'ai.translator': false, 'ai.contentOperator': true});

            createPluginApi('ai.contentOperator').api.setDialogState(false);

            expect($aiPluginDialogOpen.get()['ai.contentOperator']).toBe(false);
            expect($aiPluginDialogOpen.get()['ai.translator']).toBe(false);
        });
    });
});
