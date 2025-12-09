import {computed, map} from 'nanostores';
import {clampProgress} from '../../utils/cms/content/progress';

type ProgressState = {
    value: number;
    active: boolean;
};

const initialState: ProgressState = {
    value: 0,
    active: false,
};

export const $progress = map<ProgressState>(initialState);

export const $progressValue = computed($progress, (state) => clampProgress(state.value));

// export const startProgress = (): void => {
//     $progress.set({value: 0, active: true});
// };

export const startProgress = (initialValue = 0): void => {
    $progress.set({value: clampProgress(initialValue), active: true});
};

export const updateProgress = (value: number): void => {
    $progress.set({value: clampProgress(value), active: true});
};

export const completeProgress = (): void => {
    $progress.set({value: 100, active: false});
};

export const resetProgress = (): void => {
    $progress.set(initialState);
};
