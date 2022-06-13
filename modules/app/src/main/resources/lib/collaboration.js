/* global __ */

const sharedMemoryLib = require('/lib/xp/grid');
const eventLib = require('/lib/xp/event');

const TTL_SECONDS = 2 * 60 * 1000;

const SHARED_MAP = sharedMemoryLib.getMap('contentstudio.collaboration.contents');

function required(params, name) {
    const value = params[name];
    if (typeof value === 'undefined' || value === null) {
        throw `Parameter "${name}" is required`;
    }
}

function CollaboratorsModifier(params) {
    this.collaboratorKey = `${params.sessionId}=${params.userKey}`;
    this.contentId = params.contentId;
    this.collaborators = [];

    this.removeExpired = function (timeAt) {
        const self = this;
        const originalSize = this.collaborators.length;
        this.collaborators = this.collaborators.filter(collaborator => {
            const lastJoin = self.extractLastJoin(collaborator);
            return timeAt - lastJoin < TTL_SECONDS;
        });
        return originalSize > this.collaborators.length;
    };

    this.removeCurrent = function () {
        const originalSize = this.collaborators.length;
        const collaboratorKey = this.collaboratorKey;
        this.collaborators = this.collaborators.filter(collaborator => !collaborator.startsWith(collaboratorKey));
        return originalSize > this.collaborators.length;
    };

    this.getUniqueCollaborators = function () {
        const uniqueCollaborators = new Set();
        this.collaborators.forEach(collaborator => uniqueCollaborators.add(collaborator));

        const collaborators = [];
        uniqueCollaborators.forEach(collaborator => collaborators.push(collaborator));
        this.collaborators = collaborators;

        return this.collaborators;
    };

    this.publishEvent = function () {
        const self = this;
        const userKeys = this.getUniqueCollaborators().map(collaboratorId => self.extractUserKey(collaboratorId));
        const contentId = this.contentId;

        eventLib.send({
            type: 'edit.content.collaborators.update',
            distributed: true,
            data: {
                contentId: contentId,
                collaborators: userKeys
            }
        });
    };

    this.extractLastJoin = function (collaboratorId) {
        const idParts = collaboratorId.split("=", -1);
        return parseInt(idParts[2]);
    };

    this.extractUserKey = function (collaboratorId) {
        return collaboratorId.split("=", -1)[1];
    };

    this.getStoredCollaborators = function (storedCollaborators, isJoin) {
        if (typeof storedCollaborators === 'undefined' || storedCollaborators === null) {
            return isJoin ? [] : null;
        }
        return storedCollaborators;
    };

    this.modify = function (oldCollaborators, isJoin) {
        this.collaborators = this.getStoredCollaborators(oldCollaborators, isJoin);

        if (!isJoin && !this.collaborators) {
            return null;
        }

        const now = new Date().getTime();
        const removedExpired = this.removeExpired(now);
        const removedExisting = this.removeCurrent();

        if (isJoin) {
            this.collaborators.push(`${this.collaboratorKey}=${now}`);
        }

        const shouldPublishEvent = isJoin || removedExpired ? !removedExisting : removedExisting;
        if (shouldPublishEvent) {
            this.publishEvent();
        }

        if (!isJoin && this.collaborators.length === 0) {
            return null;
        }

        return this.getUniqueCollaborators();
    };
}

function doJoinOrLeave(params, isJoin) {
    required(params, 'contentId');
    required(params, 'sessionId');
    required(params, 'userKey');

    return SHARED_MAP.modify({
        key: params.contentId,
        func: function (collaborators) {
            return new CollaboratorsModifier(params).modify(collaborators, isJoin);
        },
        ttlSeconds: TTL_SECONDS
    });
}

exports.join = function (params) {
    return doJoinOrLeave(params, true);
}

exports.leave = function (params) {
    return doJoinOrLeave(params, false);
}

exports.heartbeat = function (params) {
    return exports.join(params);
}
