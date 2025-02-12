import {initialize as initializeSharedWorker} from './worker/init';

export function isSharedWorkerScope(scope: WindowOrWorkerGlobalScope): scope is SharedWorkerGlobalScope {
    return 'onconnect' in scope;
}

if (!isSharedWorkerScope(self)) {
    // TODO: Initialize the WebSocket directly in the main thread
    throw new Error('Script is not executed in a SharedWorker.');
} else {
    initializeSharedWorker(self);
}
