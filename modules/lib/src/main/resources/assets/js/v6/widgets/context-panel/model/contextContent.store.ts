import { atom, computed } from 'nanostores';
import type { CompareResult } from '../../../entities/content';

export { $contextContent, setWizardContent } from '../../../entities/content';

//
// * Compare Status State
//

// Written by contextContent.service.ts, which verifies the compare status.
export const $contextCompareResult = atom<CompareResult | undefined>(undefined);
export const $contextCompareLoading = atom<boolean>(false);

export const $contextContentCompareResult = computed($contextCompareResult, (result) => result);
export const $isContextCompareLoading = computed($contextCompareLoading, (loading) => loading);
