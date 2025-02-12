export function isSharedWorkerScope(scope: WindowOrWorkerGlobalScope): scope is SharedWorkerGlobalScope {
    return 'onconnect' in scope;
}
