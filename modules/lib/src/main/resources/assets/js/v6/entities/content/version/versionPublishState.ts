import { atom, computed } from 'nanostores';
import { type ContentVersion } from '../../../../app/ContentVersion';
import { type ContentVersionAction } from '../../../../app/ContentVersionAction';
import { ContentOperation, EDITORIAL_PATCH_FIELDS, getVersionOperationTime } from './versionOperations';
import { $versions } from './versionStore';

//
// * Types
//

export const VersionPublishStatus = {
    PUBLISHED: 'published',
    OFFLINE: 'offline',
    SCHEDULED: 'scheduled',
    EXPIRED: 'expired',
    UNPUBLISHED: 'unpublished',
} as const;

export type VersionPublishStatus = (typeof VersionPublishStatus)[keyof typeof VersionPublishStatus];

export type PublishBadge = {
    versionId: string;
    publishStatus: VersionPublishStatus;
    publishedFrom: Date;
    publishedTo: Date | undefined;
    unpublishedAt: Date | undefined;
};

export type ItemPublishBadge = {
    status: VersionPublishStatus;
    publishedFrom: Date;
    publishedTo: Date | undefined;
    unpublishedAt: Date | undefined;
    isOnline: boolean;
};

//
// * Stores
//

export const $onlineVersionId = atom<string | undefined>(undefined);

export const setOnlineVersionId = (versionId: string | undefined): void => {
    $onlineVersionId.set(versionId);
};

//
// * Status helpers
//

export const getVersionPublishStatus = (version: ContentVersion): VersionPublishStatus => {
    const publishInfo = version.getPublishInfo();

    if (publishInfo) {
        const now = new Date();
        const publishedFrom = publishInfo.getFrom();
        const publishedTo = publishInfo.getTo();

        if (publishedFrom && publishedFrom > now) {
            return VersionPublishStatus.SCHEDULED;
        }

        if (publishedTo && publishedTo < now) {
            return VersionPublishStatus.EXPIRED;
        }

        const actions = version.getActions();

        if (actions.some((a) => a.getOperation() === ContentOperation.PUBLISH)) {
            return VersionPublishStatus.PUBLISHED;
        }

        return VersionPublishStatus.UNPUBLISHED;
    }

    return VersionPublishStatus.OFFLINE;
};

//
// * Badge derivation
//

const getPublishAction = (version: ContentVersion) =>
    version.getActions().find((a) => a.getOperation() === ContentOperation.PUBLISH);

const isUnpublishEvent = (version: ContentVersion): boolean =>
    version.getActions().some((a) => a.getOperation() === ContentOperation.UNPUBLISH);

// Master editorial patches mutate the master branch directly, so they count as
// "online" events alongside publishes. Backend may set `onlineVersionId`
// to the patch version too.
const getOnlineEventAction = (version: ContentVersion): ContentVersionAction | undefined => {
    const publishAction = getPublishAction(version);
    if (publishAction) {
        return publishAction;
    }

    const first = version.getActions()[0];
    if (!first || first.getOperation() !== ContentOperation.PATCH) {
        return undefined;
    }
    if (first.getOrigin() !== 'master') {
        return undefined;
    }
    if (!first.getFields().some((f) => EDITORIAL_PATCH_FIELDS.includes(f))) {
        return undefined;
    }
    return first;
};

const findUnpublishDate = (versions: ContentVersion[], publishIndex: number): Date | undefined => {
    for (let i = publishIndex - 1; i >= 0; i--) {
        if (isUnpublishEvent(versions[i])) {
            return getVersionOperationTime(versions[i]);
        }
        if (getOnlineEventAction(versions[i])) {
            return undefined;
        }
    }
    return undefined;
};

const $allPublishBadges = computed($versions, (versions): PublishBadge[] => {
    const badges: PublishBadge[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < versions.length; i++) {
        const v = versions[i];
        const action = getOnlineEventAction(v);
        if (!action) {
            continue;
        }

        const isPublish = action.getOperation() === ContentOperation.PUBLISH;
        if (isPublish && !v.getPublishInfo()) {
            continue;
        }

        const targetId = action.getEditorial() ?? v.getId();
        if (seen.has(targetId)) {
            continue;
        }

        const unpublishedAt = findUnpublishDate(versions, i);
        const publishInfo = v.getPublishInfo();

        // Scheduled, then unpublished before its publish-from date: the item never went
        // online, so it should not get a badge on its editorial version.
        const scheduledFrom = publishInfo?.getFrom();
        if (unpublishedAt && scheduledFrom && unpublishedAt < scheduledFrom) {
            continue;
        }

        seen.add(targetId);
        badges.push({
            versionId: targetId,
            publishStatus: isPublish ? getVersionPublishStatus(v) : VersionPublishStatus.PUBLISHED,
            // Online start date (when content goes/went live), not the publish operation time.
            publishedFrom: publishInfo?.getFrom() ?? getVersionOperationTime(v),
            // Scheduled expiry (when content goes/went offline).
            publishedTo: publishInfo?.getTo(),
            unpublishedAt,
        });
    }

    return badges;
});

const $activePublishBadge = computed(
    [$allPublishBadges, $onlineVersionId],
    (badges, onlineVersionId): PublishBadge | undefined => (onlineVersionId ? badges[0] : undefined),
);

export const $activePublishVersionId = computed($activePublishBadge, (badge) => badge?.versionId);

export const $activePublishStatus = computed($activePublishBadge, (badge) => badge?.publishStatus);

export const $activePublishedFrom = computed($activePublishBadge, (badge) => badge?.publishedFrom);

export const $activePublishedTo = computed($activePublishBadge, (badge) => badge?.publishedTo);

export const $pastPublishBadges = computed(
    [$allPublishBadges, $onlineVersionId],
    (badges, onlineVersionId): ReadonlyMap<string, PublishBadge> => {
        const pastBadges = onlineVersionId ? badges.slice(1) : badges;
        return new Map(pastBadges.map((b) => [b.versionId, b]));
    },
);

/**
 * Per-version publish badge map. Single subscription point for list items.
 * Returns badge information for any version that has had a publish-like event,
 * marking only one of them as `isOnline`.
 */
export const $publishBadgeByVersionId = computed(
    [$allPublishBadges, $onlineVersionId],
    (badges, onlineVersionId): ReadonlyMap<string, ItemPublishBadge> => {
        const map = new Map<string, ItemPublishBadge>();
        const onlineBadgeId = onlineVersionId != null ? badges[0]?.versionId : undefined;
        for (const badge of badges) {
            map.set(badge.versionId, {
                status: badge.publishStatus,
                publishedFrom: badge.publishedFrom,
                publishedTo: badge.publishedTo,
                unpublishedAt: badge.unpublishedAt,
                isOnline: onlineBadgeId != null && badge.versionId === onlineBadgeId,
            });
        }
        return map;
    },
);
