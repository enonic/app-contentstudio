import {initialize as initializeFallback} from './fallback/init';
import {initialize as initializeSharedWorker} from './worker/init';

function isSharedWorkerScope(scope: WindowOrWorkerGlobalScope): scope is SharedWorkerGlobalScope {
    return self !== undefined && 'onconnect' in scope;
}

function isSharedWorkerSupported(): boolean {
    return typeof SharedWorker !== 'undefined';
}

if (isSharedWorkerScope(self)) {
    initializeSharedWorker(self);
} else if (!isSharedWorkerSupported()) {
    initializeFallback();
} else {
    throw new Error('Script must be executed in a SharedWorker.');
}
