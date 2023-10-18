/* global __ */

import {getMap} from '/lib/xp/grid';
import {send} from '/lib/xp/event';


interface CollaboratorsModifierParams {
    contentId: string
    sessionId: string
    userKey: string
}

interface CollaboratorsModifier {
    collaboratorKey: string
    collaborators: string[]
    contentId: string
    extractLastJoin(collaboratorId: string): number
    extractUserKey(collaboratorId: string): string
    getStoredCollaborators(storedCollaborators: string[], isJoin: boolean): string[]
    getUniqueCollaborators(): string[]
    modify(oldCollaborators: string[], isJoin: boolean): string[]
    publishEvent(): void
    removeExpired(timeAt: number): boolean
    removeCurrent(): boolean
}

const TTL_SECONDS = 2 * 60 * 1000;

const SHARED_MAP = getMap('contentstudio.collaboration.contents');


function required(params: Record<string, string>|CollaboratorsModifierParams, name: string) {
    const value = params[name];
    if (typeof value === 'undefined' || value === null) {
        throw `Parameter "${name}" is required`;
    }
}

function CollaboratorsModifier(params: CollaboratorsModifierParams) {
    const that: CollaboratorsModifier = this;
    that.collaboratorKey = `${params.sessionId}=${params.userKey}`;
    that.contentId = params.contentId;
    that.collaborators = [];

    that.removeExpired = function (timeAt: number): boolean {
        const self = that;
        const originalSize = that.collaborators.length;
        that.collaborators = that.collaborators.filter(collaborator => {
            const lastJoin = self.extractLastJoin(collaborator);
            return timeAt - lastJoin < TTL_SECONDS;
        });
        return originalSize > that.collaborators.length;
    };

    that.removeCurrent = function (): boolean {
        const originalSize = that.collaborators.length;
        const collaboratorKey = that.collaboratorKey;
        that.collaborators = that.collaborators.filter(collaborator => !collaborator.startsWith(collaboratorKey));
        return originalSize > that.collaborators.length;
    };

    that.getUniqueCollaborators = function (): string[] {
        const uniqueCollaborators = new Set();
        that.collaborators.forEach(collaborator => uniqueCollaborators.add(collaborator));

        const collaborators = [];
        uniqueCollaborators.forEach(collaborator => collaborators.push(collaborator));
        that.collaborators = collaborators;

        return that.collaborators;
    };

    that.publishEvent = function (): void {
        const self = that;
        const userKeys = that.getUniqueCollaborators().map(collaboratorId => self.extractUserKey(collaboratorId));
        const contentId = that.contentId;

        send({
            type: 'edit.content.collaborators.update',
            distributed: true,
            data: {
                contentId: contentId,
                collaborators: userKeys
            }
        });
    };

    that.extractLastJoin = function (collaboratorId: string): number {
        const idParts = collaboratorId.split("=", -1);
        return parseInt(idParts[2]);
    };

    that.extractUserKey = function (collaboratorId: string): string {
        return collaboratorId.split("=", -1)[1];
    };

    that.getStoredCollaborators = function (storedCollaborators: string[], isJoin: boolean): string[] {
        if (typeof storedCollaborators === 'undefined' || storedCollaborators === null) {
            return isJoin ? [] : null;
        }
        return storedCollaborators;
    };

    that.modify = function (oldCollaborators: string[], isJoin: boolean): string[] {
        that.collaborators = that.getStoredCollaborators(oldCollaborators, isJoin);

        if (!isJoin && !that.collaborators) {
            return null;
        }

        const now = new Date().getTime();
        const removedExpired = that.removeExpired(now);
        const removedExisting = that.removeCurrent();

        if (isJoin) {
            that.collaborators.push(`${that.collaboratorKey}=${now}`);
        }

        const shouldPublishEvent = isJoin || removedExpired ? !removedExisting : removedExisting;
        if (shouldPublishEvent) {
            that.publishEvent();
        }

        if (!isJoin && that.collaborators.length === 0) {
            return null;
        }

        return that.getUniqueCollaborators();
    };
}

function doJoinOrLeave(params: CollaboratorsModifierParams, isJoin: boolean) {
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

export const join = (params: CollaboratorsModifierParams) => doJoinOrLeave(params, true);


export const leave = (params: CollaboratorsModifierParams) => doJoinOrLeave(params, false);


export const heartbeat = join;

