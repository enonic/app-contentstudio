import {isSharedWorkerScope} from './utils';
import {initialize as initializeSharedWorker} from './worker';

if (!isSharedWorkerScope(self)) {
    // TODO: Initialize the WebSocket directly in the main thread
    throw new Error('Script is not executed in a SharedWorker.');
} else {
    initializeSharedWorker(self);
}
