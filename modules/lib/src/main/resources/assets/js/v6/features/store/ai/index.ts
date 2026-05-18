// Side effect: subscribe to $config and wire AI listeners once enabled.
import './ai.events';

// Read: stores
export {
    $aiContext,
    $aiHasContentOperator,
    $aiHasTranslator,
    $aiReady,
    $aiTopicError,
    $aiTopicProcessing,
} from './ai.store';

// Write: signal commands
export {clearAiTopicError} from './ai.commands';

// Write: commands
export {
    renderContentOperator,
    renderTranslator,
    setAiCompareStatus,
    setAiContent,
    setAiContentHeader,
    setAiContentType,
    setAiCurrentData,
    setAiDataTree,
    setAiLanguage,
    setAiWizardBridge,
    notifyAiMixinsChanged,
    notifyAiPageChanged,
    updateAiInstructions,
    whenAiReady,
} from './ai.commands';

// Constants
export {AI_DATA_PREFIX, AI_TOPIC, AI_TOPIC_PATH} from './ai.types';
