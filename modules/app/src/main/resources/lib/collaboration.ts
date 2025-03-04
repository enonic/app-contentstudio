import * as eventLib from '/lib/xp/event';
import type {SharedMap} from '/lib/xp/grid';
import * as gridLib from '/lib/xp/grid';

type CollaboratorsMap = Record<`${string}:${string}`, CollaboratorId[]>;

const SHARED_MAP: SharedMap<CollaboratorsMap> = gridLib.getMap('contentstudio.collaboration.contents');
const TTL_SECONDS = 120;

type ClientIdAndUserKeyPart = `${string}=${string}`;
// clientId=userKey=timestamp
type CollaboratorId = `${ClientIdAndUserKeyPart}=${number}`;

type CollaboratorData = {
    clientId: string;
    userKey: string;
    timestamp: number;
}

type ModifyCollaboratorsResult = {
    updated: CollaboratorId[];
    hasChanged: boolean;
}

type JoinOrLeaveParams = {
    contentId: string;
    project: string;
    clientId: string;
    userKey: string;
}

function extractFromCollaborator(collaboratorId: CollaboratorId): CollaboratorData {
    const parts = collaboratorId.split('=');
    return {
        clientId: parts[0],
        userKey: parts[1],
        timestamp: parseInt(parts[2], 10)
    };
}

function removeExpired(collaborators: CollaboratorId[], now: number): ModifyCollaboratorsResult {
    const originalLength = collaborators.length;
    const filtered = collaborators.filter(function (collaborator) {
        return now - extractFromCollaborator(collaborator).timestamp < TTL_SECONDS * 1000;
    });

    return {
        updated: filtered,
        hasChanged: filtered.length < originalLength
    };
}

function removeCurrent(collaborators: CollaboratorId[], collaboratorKey: string): ModifyCollaboratorsResult {
    const originalLength = collaborators.length;
    const filtered = collaborators.filter(function (collaborator) {
        return !collaborator.startsWith(collaboratorKey);
    });

    return {
        updated: filtered,
        hasChanged: filtered.length < originalLength
    };
}

function uniqueCollaborators(collaborators: CollaboratorId[]): CollaboratorId[] {
    return collaborators.filter(function (collaborator, index, self) {
        return self.indexOf(collaborator) === index;
    });
}

function publishEvent(params: Record<string, unknown>, collaborators: CollaboratorId[]): void {
    const userKeys = uniqueCollaborators(collaborators).map(function (c) {
        return extractFromCollaborator(c).userKey;
    });

    eventLib.send({
        type: 'com.enonic.app.contentstudio.collaboration.out.updated',
        distributed: true,
        data: {
            type: 'com.enonic.app.contentstudio.collaboration.out.updated',
            payload: {
                contentId: params.contentId,
                project: params.project,
                collaborators: userKeys
            }
        }
    });
}

function getStoredCollaborators(stored: Optional<CollaboratorId[]>, isJoin: boolean): Optional<CollaboratorId[]> {
    return (stored == null) ? (isJoin ? [] : null) : stored;
}

function modifyCollaborators(oldCollaborators: Optional<CollaboratorId[]>, params: Record<string, unknown>, isJoin: boolean): Optional<CollaboratorId[]> {
    let collaborators = getStoredCollaborators(oldCollaborators, isJoin);
    if (!isJoin && !collaborators) {
        return null;
    }

    const now = new Date().getTime();
    const collaboratorKey: ClientIdAndUserKeyPart = `${params.clientId}=${params.userKey}`;

    const expiredResult = removeExpired(collaborators ?? [], now);
    collaborators = expiredResult.updated;

    const currentResult = removeCurrent(collaborators ?? [], collaboratorKey);
    collaborators = currentResult.updated;

    if (isJoin) {
        const collaboratorId: CollaboratorId = `${collaboratorKey}=${now}`;
        collaborators = collaborators.concat(collaboratorId);
    }

    // Decide if we should publish an event.
    // If joining or expired items were removed, then publish only if no current removal occurred;
    // otherwise, publish if the current user entry was removed.
    const shouldPublishEvent = (isJoin || expiredResult.hasChanged) ? !currentResult.hasChanged : currentResult.hasChanged;

    if (shouldPublishEvent) {
        publishEvent(params, collaborators);
    }

    if (!isJoin && collaborators.length === 0) {
        return null;
    }

    return uniqueCollaborators(collaborators);
}

function doJoinOrLeave(params: JoinOrLeaveParams, isJoin: boolean) {
    return SHARED_MAP.modify({
        key: `${params.contentId}:${params.project}`,
        func: function (collaborators: Optional<CollaboratorId[]>): CollaboratorId[] {
            // modify func does not support null return value
            return modifyCollaborators(collaborators, params, isJoin) ?? [];
        },
        ttlSeconds: TTL_SECONDS
    });
}

export function join(params: JoinOrLeaveParams) {
    return doJoinOrLeave(params, true);
};

export function leave(params: JoinOrLeaveParams) {
    return doJoinOrLeave(params, false);
};
