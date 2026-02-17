import {batched, map} from 'nanostores';
import {type OutMessage as CollaborationOutMessage, IN_BASE, MessageType} from './data/collaboration';
import {type OutMessage as ServerOutMessage} from './data/server';
import {type ReceivedWorkerMessage} from './data/worker';
import {$isReady, sendJoin, sendLeave, subscribeToOperation, subscribe as subscribeToWorker, unsubscribeFromOperation} from './worker';

type Callback = (collaborators: Set<string>) => void;

type CollaborationStore = Record<string, {
    project: string;
    listeners: Set<Callback>;
    collaborators: Set<string>;
}>;

const $collaboration = map<CollaborationStore>({});

$collaboration.listen((store, oldStore, changedKey) => {
    notifyListeners(store, oldStore, changedKey);
});

function notifyListeners(
    store: Readonly<CollaborationStore>,
    oldStore: Readonly<CollaborationStore>,
    changedKey?: string
): void {
    for (const key in store) {
        if (changedKey != null && key !== changedKey) {
            continue;
        }

        const {listeners, collaborators} = store[key];
        const oldCollaborators = oldStore[key]?.collaborators;

        if (oldCollaborators && areSetsEqual(oldCollaborators, collaborators)) {
            continue;
        }

        listeners.forEach(listener => listener(collaborators));
    }
}

//
//* Listeners
//

export function subscribe(
    contentId: string,
    project: string,
    callback: Callback
): () => void {
    if (contentId in $collaboration.get()) {
        const current = $collaboration.get()[contentId];
        const listeners = new Set(current.listeners);
        listeners.add(callback);

        $collaboration.setKey(contentId, {
            ...current,
            listeners,
        });
    } else {
        $collaboration.setKey(contentId, {
            project,
            collaborators: new Set(),
            listeners: new Set([callback])
        });
    }

    const {collaborators} = $collaboration.get()[contentId];
    callback(collaborators);

    return () => unsubscribe(contentId, callback);
}

function unsubscribe(contentId: string, callback: Callback): void {
    const current = $collaboration.get()[contentId];
    if (!current) {
        return;
    }

    const listeners = new Set(current.listeners);
    listeners.delete(callback);

    if (listeners.size === 0) {
        const store = {...$collaboration.get()};
        delete store[contentId];
        $collaboration.set(store);
    } else {
        $collaboration.setKey(contentId, {
            ...current,
            listeners,
        });
    }
}

//
//* Worker
//

const OPERATION = `${IN_BASE}.*`;

const $activeIdAndProjectPairs = batched($collaboration, (collaboration): [string, string][] => {
    return Object.entries(collaboration).map(([id, {project}]) => [id, project]);
});

$isReady.subscribe(isReady => {
    if (isReady) {
        subscribeToOperation(OPERATION);

        $activeIdAndProjectPairs.subscribe((idsAndProjects, oldIdsAndProjects) => {
            const addedIds = pairsDifference(idsAndProjects, oldIdsAndProjects);
            addedIds.forEach(([id, project]) => sendJoin(id, project));

            const removedIds = pairsDifference(oldIdsAndProjects, idsAndProjects);
            removedIds.forEach(([id, project]) => sendLeave(id, project));
        });
    } else {
        unsubscribeFromOperation(OPERATION);

        $activeIdAndProjectPairs.off();
    }
});

const unsubscribeFromWorker = subscribeToWorker(handleWorkerMessage);

window.addEventListener('beforeunload', () => {
    unsubscribeFromOperation(OPERATION);
    $activeIdAndProjectPairs.get().forEach(([id, project]) => sendLeave(id, project));
    unsubscribeFromWorker?.();
});

function handleWorkerMessage(message: ReceivedWorkerMessage): void {
    switch (message.type) {
        case 'received':
            handleReceivedMessage(message.payload);
            break;
    }
}

function handleReceivedMessage(message: CollaborationOutMessage | ServerOutMessage): void {
    const {type, payload} = message;

    switch (type) {
        case MessageType.UPDATED:
            updateCollaborators(payload.contentId, new Set(payload.collaborators));
            break;
    }
}

//
//* Utils
//

function updateCollaborators(contentId: string, collaborators: Set<string>): void {
    const current = $collaboration.get()[contentId];

    if (current) {
        $collaboration.setKey(contentId, {
            ...current,
            collaborators,
        });
    }
}

function areSetsEqual<T>(setA: Set<T>, setB: Set<T>): boolean {
    if (setA.size !== setB.size) {
        return false
    }
    for (const item of setA) {
        if (!setB.has(item)) {
            return false;
        }
    }
    return true;
}

function pairsDifference(arrayA: readonly [string, string][] = [], arrayB: readonly [string, string][] = []): [string, string][] {
    return arrayA.filter(itemA => !arrayB.some(itemB => itemA[0] === itemB[0] && itemA[1] === itemB[1]));
}
