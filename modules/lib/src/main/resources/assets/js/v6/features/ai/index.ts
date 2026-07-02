import { computed } from 'nanostores';
import {
    $aiContext as $aiContextAtom,
    $aiTopicError as $aiTopicErrorAtom,
    $aiTopicHighlight as $aiTopicHighlightAtom,
    $aiTopicProcessing as $aiTopicProcessingAtom,
} from './ai.store';

// Read: stores
export { $aiPluginDialogOpen, $aiReady, $aiRegisteredPlugins } from './ai.store';

// Write: signal commands
export { clearAiTopicError } from './ai.commands';

// Bootstrap: AI plugin host
export { initAiHost } from './ai.host';

// Write: AI plugin host commands
export { closePluginDialog, openPluginDialog, sendPluginContext } from './ai.host';

// Write: commands
export {
    setAiCompareStatus,
    setAiContent,
    setAiContentHeader,
    setAiContentType,
    setAiCurrentData,
    setAiDataTree,
    setAiLanguage,
    setAiWizardBridge,
    updateAiInstructions,
    whenAiReady,
} from './ai.commands';

// Constants
export { AI_TOPIC_PATH } from './ai.types';

//
// * Read-only views
//
// Atoms stay private to the slice; writes go through commands.
//

export const $aiContext = computed($aiContextAtom, (value) => value);
export const $aiTopicError = computed($aiTopicErrorAtom, (value) => value);
export const $aiTopicHighlight = computed($aiTopicHighlightAtom, (value) => value);
export const $aiTopicProcessing = computed($aiTopicProcessingAtom, (value) => value);
