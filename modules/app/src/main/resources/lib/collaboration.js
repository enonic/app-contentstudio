const gridLib = require('/lib/xp/grid');
const eventLib = require('/lib/xp/event');

const SHARED_MAP = gridLib.getMap('contentstudio.collaboration.contents');
const TTL_SECONDS = 120;

/**
 * Extract session, user and timestamp from a collaborator string.
 * @param {string} collaboratorId - Format: "clientId=userKey=timestamp"
 * @returns {{clientId: string, userKey: string, timestamp: number}}
 */
function extractFromCollaborator(collaboratorId) {
    const parts = collaboratorId.split('=');
    return {
        clientId: parts[0],
        userKey: parts[1],
        timestamp: parseInt(parts[2], 10)
    };
}

/**
 * Remove collaborators that have expired.
 * @param {Array} collaborators
 * @param {number} now - Current time (ms)
 * @returns {{ updated: Array<string>, hasChanged: boolean }}
 */
function removeExpired(collaborators, now) {
    const originalLength = collaborators.length;
    const filtered = collaborators.filter(function (collaborator) {
        return now - extractFromCollaborator(collaborator).timestamp < TTL_SECONDS;
    });

    return {
        updated: filtered,
        hasChanged: filtered.length < originalLength
    };
}

/**
 * Remove any collaborator entries for the current session/user.
 * @param {Array} collaborators
 * @param {string} collaboratorKey - Form "clientId=userKey"
 * @returns {{ updated: Array<string>, hasChanged: boolean }}
 */
function removeCurrent(collaborators, collaboratorKey) {
    const originalLength = collaborators.length;
    const filtered = collaborators.filter(function (collaborator) {
        return !collaborator.startsWith(collaboratorKey);
    });

    return {
        updated: filtered,
        hasChanged: filtered.length < originalLength
    };
}

/**
 * Remove duplicate collaborator entries.
 * @param {Array<string>} collaborators
 * @returns {Array<string>}
 */
function uniqueCollaborators(collaborators) {
    return collaborators.filter(function (collaborator, index, self) {
        return self.indexOf(collaborator) === index;
    });
}

/**
 * Publish an event with the current collaborators.
 * @param {Object} params
 * @param {Array<string>} collaborators
 */
function publishEvent(params, collaborators) {
    const userKeys = uniqueCollaborators(collaborators).map(function (c) {
        return extractFromCollaborator(c).userKey;
    });

    eventLib.send({
        type: 'com.enonic.app.contentstudio.collaboration.out.updated',
        distributed: true,
        data: {
            contentId: params.contentId,
            project: params.project,
            collaborators: userKeys
        }
    });
}

/**
 * Return stored collaborators, or an appropriate default.
 * @param {Array<string>|null|undefined} stored
 * @param {boolean} isJoin
 * @returns {Array<string>|null}
 */
function getStoredCollaborators(stored, isJoin) {
    return (stored == null) ? (isJoin ? [] : null) : stored;
}

/**
 * Modify the collaborators array based on a join/leave action.
 * @param {Array<string>|null} oldCollaborators
 * @param {Object} params
 * @param {boolean} isJoin
 * @returns {Array<string>|null}
 */
function modifyCollaborators(oldCollaborators, params, isJoin) {
    let collaborators = getStoredCollaborators(oldCollaborators, isJoin);
    if (!isJoin && !collaborators) {
        return null;
    }

    const now = new Date().getTime();
    const collaboratorKey = params.clientId + '=' + params.userKey;

    const expiredResult = removeExpired(collaborators, now);
    collaborators = expiredResult.updated;
    const currentResult = removeCurrent(collaborators, collaboratorKey);
    collaborators = currentResult.updated;

    if (isJoin) {
        collaborators = collaborators.concat(collaboratorKey + '=' + now);
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

/**
 * Perform join or leave modification on the shared map.
 * @param {{contentId: string, project: string, clientId: string, userKey: string}} params - Must include contentId, project, clientId, userKey.
 * @param {boolean} isJoin
 */
function doJoinOrLeave(params, isJoin) {
    return SHARED_MAP.modify({
        key: params.contentId + ':' + params.project,
        func: function (collaborators) {
            return modifyCollaborators(collaborators, params, isJoin);
        },
        ttlSeconds: TTL_SECONDS
    });
}

/**
 * Perform join modification on the shared map.
 * @param {{contentId: string, project: string, clientId: string, userKey: string}} params - Must include contentId, project, clientId, userKey.
 */
exports.join = function (params) {
    return doJoinOrLeave(params, true);
};

/**
 * Perform leave modification on the shared map.
 * @param {{contentId: string, project: string, clientId: string, userKey: string}} params - Must include contentId, project, clientId, userKey.
 */
exports.leave = function (params) {
    return doJoinOrLeave(params, false);
};
