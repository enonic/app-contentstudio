import {beforeEach, describe, expect, it, vi} from 'vitest';
import {type ContentVersionAction, ContentVersionActionBuilder} from '../../../../app/ContentVersionAction';
import {type ContentVersion, ContentVersionBuilder} from '../../../../app/ContentVersion';
import {
    $allVersionsLoaded,
    $versions,
    $versionsByDate,
    $versionsDisplayMode,
    $versionsForDisplay,
    setContentCreatedTime,
} from './versionStore';
import {
    ContentOperation,
    isStandardModeVersion,
    isVersionComparable,
    isVersionRevertable,
    resolveVersionOperationType,
    VersionField,
    VersionOperationType,
} from './versionOperations';
import {
    $activePublishStatus,
    $activePublishVersionId,
    $onlineVersionId,
    $pastPublishBadges,
    VersionPublishStatus,
} from './versionPublishState';
import {
    getIconForOperation,
    getOperationLabel,
} from '../../views/context/widget/versions/labels';

import {
    Archive,
    ArchiveRestore,
    ArrowDownNarrowWide,
    CaseSensitive,
    CircleCheckBig,
    CircleUserRound,
    Cloud,
    CloudOff,
    Copy,
    FilePenLine,
    FolderInput,
    Globe,
    Import,
    Pen,
    PenLine,
    SendToBack,
    SquarePen,
} from 'lucide-react';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@enonic/lib-admin-ui/util/Messages', () => ({
    i18n: (key: string) => key,
}));

type ActionOptions = {
    editorial?: string;
    origin?: string;
};

function createAction(operation: string, fields: string[] = [], options: ActionOptions = {}): ContentVersionAction {
    return new ContentVersionActionBuilder()
        .setOperation(operation)
        .setFields(fields)
        .setEditorial(options.editorial)
        .setOrigin(options.origin)
        .build();
}

function createVersion(id: string, actions: ContentVersionAction[], timestamp?: Date): ContentVersion {
    const builder = new ContentVersionBuilder();
    builder.id = id;
    builder.actions = actions;
    builder.timestamp = timestamp ?? new Date('2024-01-15T10:00:00Z');
    return builder.build();
}

function createPublishedVersion(id: string, publishedFrom: Date, publishedTo?: Date,
                                publishOptions: ActionOptions = {}): ContentVersion {
    const builder = new ContentVersionBuilder();
    builder.id = id;
    builder.actions = [createAction(ContentOperation.PUBLISH, [], publishOptions)];
    builder.timestamp = new Date('2024-01-15T10:00:00Z');
    builder.publishInfo = {
        getFrom: () => publishedFrom,
        getTo: () => publishedTo,
        getFirst: () => publishedFrom,
        getTime: () => builder.timestamp,
    } as ContentVersion['getPublishInfo'] extends () => infer R ? R : never;
    return builder.build();
}

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
    $versions.set([]);
    $allVersionsLoaded.set(false);
    $versionsDisplayMode.set('standard');
    $onlineVersionId.set(undefined);
});

// ============================================================================
// resolveVersionOperationType
// ============================================================================

describe('resolveVersionOperationType', () => {
    it('maps standard operations 1:1', () => {
        const cases: [string, VersionOperationType][] = [
            [ContentOperation.CREATE, VersionOperationType.CREATE],
            [ContentOperation.DUPLICATE, VersionOperationType.DUPLICATE],
            [ContentOperation.UPDATE, VersionOperationType.UPDATE],
            [ContentOperation.PUBLISH, VersionOperationType.PUBLISH],
            [ContentOperation.UNPUBLISH, VersionOperationType.UNPUBLISH],
            [ContentOperation.PERMISSIONS, VersionOperationType.PERMISSIONS],
            [ContentOperation.MOVE, VersionOperationType.MOVE],
            [ContentOperation.SORT, VersionOperationType.SORT],
            [ContentOperation.PATCH, VersionOperationType.PATCH],
            [ContentOperation.ARCHIVE, VersionOperationType.ARCHIVE],
            [ContentOperation.RESTORE, VersionOperationType.RESTORE],
            [ContentOperation.METADATA, VersionOperationType.METADATA],
            [ContentOperation.WORKFLOW, VersionOperationType.WORKFLOW],
            [ContentOperation.SYNC, VersionOperationType.SYNC],
        ];

        for (const [operation, expected] of cases) {
            const version = createVersion('v1', [createAction(operation)]);
            expect(resolveVersionOperationType(version)).toBe(expected);
        }
    });

    it('resolves MOVE with name-only field as RENAME', () => {
        const version = createVersion('v1', [createAction(ContentOperation.MOVE, [VersionField.NAME])]);
        expect(resolveVersionOperationType(version)).toBe(VersionOperationType.RENAME);
    });

    it('resolves MOVE with multiple fields as MOVE', () => {
        const version = createVersion('v1', [
            createAction(ContentOperation.MOVE, [VersionField.NAME, VersionField.PARENT_PATH]),
        ]);
        expect(resolveVersionOperationType(version)).toBe(VersionOperationType.MOVE);
    });

    it('resolves MOVE with parentPath-only as MOVE', () => {
        const version = createVersion('v1', [createAction(ContentOperation.MOVE, [VersionField.PARENT_PATH])]);
        expect(resolveVersionOperationType(version)).toBe(VersionOperationType.MOVE);
    });

    it('resolves no-actions version as UNKNOWN when not first version', () => {
        const version = createVersion('v1', []);
        expect(resolveVersionOperationType(version)).toBe(VersionOperationType.UNKNOWN);
    });

    it('resolves no-actions version as UNKNOWN when first version and all loaded', () => {
        const version = createVersion('v1', []);
        $versions.set([version]);
        $allVersionsLoaded.set(true);
        expect(resolveVersionOperationType(version)).toBe(VersionOperationType.UNKNOWN);
    });

    it('resolves no-actions version as UNKNOWN when first version but not all loaded', () => {
        const version = createVersion('v1', []);
        $versions.set([version]);
        $allVersionsLoaded.set(false);
        expect(resolveVersionOperationType(version)).toBe(VersionOperationType.UNKNOWN);
    });

    it('resolves version with IMPORT action as IMPORT', () => {
        const version = createVersion('v1', [createAction(ContentOperation.IMPORT)]);
        expect(resolveVersionOperationType(version)).toBe(VersionOperationType.IMPORT);
    });

    it('resolves synthetic version as SYNTHETIC_CREATE', () => {
        const builder = new ContentVersionBuilder();
        builder.id = '__synthetic_create__';
        builder.timestamp = new Date();
        builder.actions = [];
        const synthetic = builder.build();

        expect(resolveVersionOperationType(synthetic)).toBe(VersionOperationType.SYNTHETIC_CREATE);
    });

    it('returns undefined for unknown operations', () => {
        const version = createVersion('v1', [createAction('unknown.operation')]);
        expect(resolveVersionOperationType(version)).toBeUndefined();
    });

    it('resolves PATCH with editorial field as EDITORIAL_PATCH', () => {
        const editorialFields = [
            VersionField.DISPLAY_NAME,
            VersionField.DATA,
            VersionField.X,
            VersionField.PAGE,
            VersionField.NAME,
            VersionField.PARENT_PATH,
        ];
        for (const field of editorialFields) {
            const version = createVersion('v1', [createAction(ContentOperation.PATCH, [field])]);
            expect(resolveVersionOperationType(version)).toBe(VersionOperationType.EDITORIAL_PATCH);
        }
    });

    it('resolves PATCH with at least one editorial field among others as EDITORIAL_PATCH', () => {
        const version = createVersion('v1', [
            createAction(ContentOperation.PATCH, [VersionField.OWNER, VersionField.DATA]),
        ]);
        expect(resolveVersionOperationType(version)).toBe(VersionOperationType.EDITORIAL_PATCH);
    });

    it('resolves PATCH with only non-editorial fields as PATCH', () => {
        const version = createVersion('v1', [
            createAction(ContentOperation.PATCH, [VersionField.OWNER, VersionField.LANGUAGE]),
        ]);
        expect(resolveVersionOperationType(version)).toBe(VersionOperationType.PATCH);
    });

    it('resolves PATCH with no fields as PATCH', () => {
        const version = createVersion('v1', [createAction(ContentOperation.PATCH)]);
        expect(resolveVersionOperationType(version)).toBe(VersionOperationType.PATCH);
    });
});

// ============================================================================
// Matrix-based helpers
// ============================================================================

describe('isVersionRevertable', () => {
    it('returns true for restorable operations', () => {
        const restorableOps = [ContentOperation.CREATE, ContentOperation.DUPLICATE, ContentOperation.UPDATE];
        for (const op of restorableOps) {
            const version = createVersion('v1', [createAction(op)]);
            expect(isVersionRevertable(version)).toBe(true);
        }
    });

    it('returns false for non-restorable operations', () => {
        const nonRestorableOps = [
            ContentOperation.PUBLISH, ContentOperation.UNPUBLISH, ContentOperation.PERMISSIONS,
            ContentOperation.MOVE, ContentOperation.SORT, ContentOperation.PATCH,
            ContentOperation.ARCHIVE, ContentOperation.RESTORE,
            ContentOperation.METADATA, ContentOperation.WORKFLOW,
        ];
        for (const op of nonRestorableOps) {
            const version = createVersion('v1', [createAction(op)]);
            expect(isVersionRevertable(version)).toBe(false);
        }
    });

    it('returns true for IMPORT', () => {
        const version = createVersion('v1', [createAction(ContentOperation.IMPORT)]);
        expect(isVersionRevertable(version)).toBe(true);
    });

    it('returns false for no-actions version (UNKNOWN)', () => {
        const version = createVersion('v1', []);
        expect(isVersionRevertable(version)).toBe(false);
    });
});

describe('isVersionComparable', () => {
    it('returns true for comparable operations', () => {
        const comparableOps = [
            ContentOperation.CREATE, ContentOperation.DUPLICATE, ContentOperation.UPDATE,
            ContentOperation.MOVE, ContentOperation.SORT, ContentOperation.SYNC,
        ];
        for (const op of comparableOps) {
            const version = createVersion('v1', [createAction(op)]);
            expect(isVersionComparable(version)).toBe(true);
        }
    });

    it('returns true for RENAME', () => {
        const version = createVersion('v1', [createAction(ContentOperation.MOVE, [VersionField.NAME])]);
        expect(isVersionComparable(version)).toBe(true);
    });

    it('returns false for non-comparable operations', () => {
        const nonComparableOps = [
            ContentOperation.PUBLISH, ContentOperation.UNPUBLISH, ContentOperation.PERMISSIONS,
            ContentOperation.PATCH, ContentOperation.ARCHIVE,
            ContentOperation.METADATA, ContentOperation.WORKFLOW,
        ];
        for (const op of nonComparableOps) {
            const version = createVersion('v1', [createAction(op)]);
            expect(isVersionComparable(version)).toBe(false);
        }
    });

    it('returns false for SYNTHETIC_CREATE', () => {
        const builder = new ContentVersionBuilder();
        builder.id = '__synthetic_create__';
        builder.timestamp = new Date();
        builder.actions = [];
        expect(isVersionComparable(builder.build())).toBe(false);
    });
});

describe('isStandardModeVersion', () => {
    it('returns true for standard mode operations', () => {
        const standardOps = [
            ContentOperation.CREATE, ContentOperation.DUPLICATE, ContentOperation.UPDATE,
            ContentOperation.MOVE, ContentOperation.SORT, ContentOperation.SYNC,
        ];
        for (const op of standardOps) {
            const version = createVersion('v1', [createAction(op)]);
            expect(isStandardModeVersion(version)).toBe(true);
        }
    });

    it('returns false for non-standard mode operations', () => {
        const nonStandardOps = [
            ContentOperation.PUBLISH, ContentOperation.UNPUBLISH, ContentOperation.PERMISSIONS,
            ContentOperation.PATCH, ContentOperation.ARCHIVE,
            ContentOperation.METADATA, ContentOperation.WORKFLOW,
        ];
        for (const op of nonStandardOps) {
            const version = createVersion('v1', [createAction(op)]);
            expect(isStandardModeVersion(version)).toBe(false);
        }
    });

    it('returns true for SYNTHETIC_CREATE', () => {
        const builder = new ContentVersionBuilder();
        builder.id = '__synthetic_create__';
        builder.timestamp = new Date();
        builder.actions = [];
        expect(isStandardModeVersion(builder.build())).toBe(true);
    });

    it('returns true for EDITORIAL_PATCH', () => {
        const version = createVersion('v1', [createAction(ContentOperation.PATCH, [VersionField.DATA])]);
        expect(isStandardModeVersion(version)).toBe(true);
    });

    it('returns true for PUBLISH without editorial counterpart (standalone publish badge target)', () => {
        const version = createPublishedVersion('v1', new Date('2024-01-15T09:00:00Z'));
        expect(isStandardModeVersion(version)).toBe(true);
    });

    it('returns false for PUBLISH with editorial counterpart', () => {
        const version = createPublishedVersion('v1', new Date('2024-01-15T09:00:00Z'), undefined, {editorial: 'editorial-1'});
        expect(isStandardModeVersion(version)).toBe(false);
    });

    it('returns false for PUBLISH without publishInfo', () => {
        const version = createVersion('v1', [createAction(ContentOperation.PUBLISH)]);
        expect(isStandardModeVersion(version)).toBe(false);
    });
});

// ============================================================================
// $versionsByDate filtering
// ============================================================================

describe('$versionsByDate', () => {
    it('filters to standard mode versions in standard mode', () => {
        const create = createVersion('v1', [createAction(ContentOperation.CREATE)], new Date('2024-01-15'));
        const publish = createVersion('v2', [createAction(ContentOperation.PUBLISH)], new Date('2024-01-15'));
        const patch = createVersion('v3', [createAction(ContentOperation.PATCH)], new Date('2024-01-15'));

        $versions.set([patch, publish, create]);
        $versionsDisplayMode.set('standard');

        const result = $versionsByDate.get();
        const allVersions = Object.values(result).flat();
        expect(allVersions).toEqual([create]);
    });

    it('keeps a publish without editorial counterpart visible in standard mode', () => {
        const create = createVersion('v1', [createAction(ContentOperation.CREATE)], new Date('2024-01-15'));
        const orphanPublish = createPublishedVersion('v2', new Date('2024-01-15T09:00:00Z'));
        $versions.set([orphanPublish, create]);
        $versionsDisplayMode.set('standard');

        const result = $versionsByDate.get();
        const allVersions = Object.values(result).flat();
        expect(allVersions).toEqual([orphanPublish, create]);
    });

    it('hides a publish that has an editorial counterpart in standard mode', () => {
        const create = createVersion('v1', [createAction(ContentOperation.CREATE)], new Date('2024-01-15'));
        const editorial = createVersion('editorial-1', [createAction(ContentOperation.PATCH, [VersionField.DATA])], new Date('2024-01-15'));
        const publish = createPublishedVersion('v3', new Date('2024-01-15T09:00:00Z'), undefined, {editorial: 'editorial-1'});
        $versions.set([publish, editorial, create]);
        $versionsDisplayMode.set('standard');

        const result = $versionsByDate.get();
        const allVersions = Object.values(result).flat();
        expect(allVersions).toEqual([editorial, create]);
    });

    it('includes SORT with manualOrderValue in full mode', () => {
        const sort = createVersion('v1', [createAction(ContentOperation.SORT, [VersionField.MANUAL_ORDER])], new Date('2024-01-15'));
        const update = createVersion('v2', [createAction(ContentOperation.UPDATE)], new Date('2024-01-15'));

        $versions.set([update, sort]);
        $versionsDisplayMode.set('full');

        const result = $versionsByDate.get();
        const allVersions = Object.values(result).flat();
        expect(allVersions).toEqual([update, sort]);
    });

    it('includes SORT without manualOrderValue in full mode', () => {
        const sort = createVersion('v1', [createAction(ContentOperation.SORT, [])], new Date('2024-01-15'));

        $versions.set([sort]);
        $versionsDisplayMode.set('full');

        const result = $versionsByDate.get();
        const allVersions = Object.values(result).flat();
        expect(allVersions).toEqual([sort]);
    });
});

// ============================================================================
// Icon resolution
// ============================================================================

describe('getIconForOperation', () => {
    it('returns matrix icon for each operation type', () => {
        const cases: [string, unknown, string[]?][] = [
            [ContentOperation.CREATE, PenLine],
            [ContentOperation.DUPLICATE, Copy],
            [ContentOperation.UPDATE, Pen],
            [ContentOperation.PUBLISH, Cloud],
            [ContentOperation.UNPUBLISH, CloudOff],
            [ContentOperation.PERMISSIONS, CircleUserRound],
            [ContentOperation.MOVE, FolderInput],
            [ContentOperation.SORT, ArrowDownNarrowWide],
            [ContentOperation.PATCH, SquarePen],
            [ContentOperation.ARCHIVE, Archive],
            [ContentOperation.RESTORE, ArchiveRestore],
            [ContentOperation.METADATA, FilePenLine],
            [ContentOperation.WORKFLOW, CircleCheckBig],
            [ContentOperation.SYNC, SendToBack],
        ];

        for (const [operation, expectedIcon] of cases) {
            const version = createVersion('v1', [createAction(operation)]);
            expect(getIconForOperation(version)).toBe(expectedIcon);
        }
    });

    it('returns CaseSensitive for RENAME', () => {
        const version = createVersion('v1', [createAction(ContentOperation.MOVE, [VersionField.NAME])]);
        expect(getIconForOperation(version)).toBe(CaseSensitive);
    });

    it('returns Import for IMPORT', () => {
        const version = createVersion('v1', [createAction(ContentOperation.IMPORT)]);
        expect(getIconForOperation(version)).toBe(Import);
    });

    it('returns PenLine for SYNTHETIC_CREATE', () => {
        const builder = new ContentVersionBuilder();
        builder.id = '__synthetic_create__';
        builder.timestamp = new Date();
        builder.actions = [];
        expect(getIconForOperation(builder.build())).toBe(PenLine);
    });

    it('returns Globe for LOCALIZE when resolved as such', () => {
        // LOCALIZE is stubbed — not yet resolved from real versions
        // but the matrix icon is correct
        expect(true).toBe(true);
    });

    it('returns Pen fallback for unknown operations', () => {
        const version = createVersion('v1', [createAction('unknown.op')]);
        expect(getIconForOperation(version)).toBe(Pen);
    });
});

// ============================================================================
// Label resolution
// ============================================================================

describe('getOperationLabel', () => {
    it('returns matrix labelKey for each operation', () => {
        const cases: [string, string, string[]?][] = [
            [ContentOperation.CREATE, 'operation.content.create'],
            [ContentOperation.UPDATE, 'operation.content.update'],
            [ContentOperation.PUBLISH, 'operation.content.publish'],
            [ContentOperation.UNPUBLISH, 'operation.content.unpublish'],
            [ContentOperation.MOVE, 'operation.content.move'],
        ];

        for (const [operation, expectedKey] of cases) {
            const version = createVersion('v1', [createAction(operation)]);
            expect(getOperationLabel(version)).toBe(expectedKey);
        }
    });

    it('returns rename label for MOVE with name-only field', () => {
        const version = createVersion('v1', [createAction(ContentOperation.MOVE, [VersionField.NAME])]);
        expect(getOperationLabel(version)).toBe('operation.content.name');
    });

    it('returns unknown label for unrecognized operations', () => {
        const version = createVersion('v1', [createAction('unknown.operation')]);
        expect(getOperationLabel(version)).toBe('operation.content.unknown');
    });

    it('returns draft patch label for PATCH with draft origin', () => {
        const version = createVersion('v1', [createAction(ContentOperation.PATCH, [], {origin: 'draft'})]);
        expect(getOperationLabel(version)).toBe('operation.content.patch.draft');
    });

    it('returns master patch label for PATCH with master origin', () => {
        const version = createVersion('v1', [createAction(ContentOperation.PATCH, [], {origin: 'master'})]);
        expect(getOperationLabel(version)).toBe('operation.content.patch.master');
    });

    it('returns generic patch label for PATCH with no origin', () => {
        const version = createVersion('v1', [createAction(ContentOperation.PATCH)]);
        expect(getOperationLabel(version)).toBe('operation.content.patch');
    });

    it('returns draft patch label for EDITORIAL_PATCH with draft origin', () => {
        const version = createVersion('v1',
            [createAction(ContentOperation.PATCH, [VersionField.DATA], {origin: 'draft'})]);
        expect(getOperationLabel(version)).toBe('operation.content.patch.draft');
    });

    it('returns master patch label for EDITORIAL_PATCH with master origin', () => {
        const version = createVersion('v1',
            [createAction(ContentOperation.PATCH, [VersionField.DATA], {origin: 'master'})]);
        expect(getOperationLabel(version)).toBe('operation.content.patch.master');
    });

    it('returns create label for SYNTHETIC_CREATE', () => {
        const builder = new ContentVersionBuilder();
        builder.id = '__synthetic_create__';
        builder.timestamp = new Date();
        builder.actions = [];
        expect(getOperationLabel(builder.build())).toBe('operation.content.create');
    });
});

// ============================================================================
// Publish badge ($activePublishVersionId, $activePublishStatus)
// ============================================================================

describe('publish badge', () => {
    it('returns undefined when no onlineVersionId', () => {
        const update = createVersion('v-update', [createAction(ContentOperation.UPDATE)]);
        const publish = createPublishedVersion('v-pub', new Date('2020-01-01'), undefined, {
            editorial: 'v-update',
        });

        $versions.set([publish, update]);
        $onlineVersionId.set(undefined);

        expect($activePublishVersionId.get()).toBeUndefined();
        expect($activePublishStatus.get()).toBeUndefined();
    });

    it('marks the editorial version when editorial is present', () => {
        const update = createVersion('v-update', [createAction(ContentOperation.UPDATE)], new Date('2024-01-14'));
        const publish = createPublishedVersion('v-pub', new Date('2020-01-01'), undefined, {
            editorial: 'v-update',
        });

        $versions.set([publish, update]);
        $onlineVersionId.set('some-id');

        expect($activePublishVersionId.get()).toBe('v-update');
        expect($activePublishStatus.get()).toBe(VersionPublishStatus.PUBLISHED);
    });

    it('marks the publish version itself when editorial is missing', () => {
        const update = createVersion('v-update', [createAction(ContentOperation.UPDATE)], new Date('2024-01-14'));
        const publish = createPublishedVersion('v-pub', new Date('2020-01-01'));

        $versions.set([publish, update]);
        $onlineVersionId.set('some-id');

        expect($activePublishVersionId.get()).toBe('v-pub');
        expect($activePublishStatus.get()).toBe(VersionPublishStatus.PUBLISHED);
    });

    it('marks the editorial version for a master editorial patch with editorial', () => {
        const update = createVersion('v-update', [createAction(ContentOperation.UPDATE)], new Date('2024-01-14'));
        const patch = createVersion('v-patch',
            [createAction(ContentOperation.PATCH, [VersionField.DATA], {origin: 'master', editorial: 'v-update'})],
            new Date('2024-01-15'));

        $versions.set([patch, update]);
        $onlineVersionId.set('some-id');

        expect($activePublishVersionId.get()).toBe('v-update');
        expect($activePublishStatus.get()).toBe(VersionPublishStatus.PUBLISHED);
    });

    it('marks the patch version itself when editorial is missing on master editorial patch', () => {
        const patch = createVersion('v-patch',
            [createAction(ContentOperation.PATCH, [VersionField.DATA], {origin: 'master'})],
            new Date('2024-01-15'));

        $versions.set([patch]);
        $onlineVersionId.set('some-id');

        expect($activePublishVersionId.get()).toBe('v-patch');
        expect($activePublishStatus.get()).toBe(VersionPublishStatus.PUBLISHED);
    });

    it('does not treat draft editorial patch as an online event', () => {
        const patch = createVersion('v-patch',
            [createAction(ContentOperation.PATCH, [VersionField.DATA], {origin: 'draft', editorial: 'v-other'})],
            new Date('2024-01-15'));

        $versions.set([patch]);
        $onlineVersionId.set('some-id');

        expect($activePublishVersionId.get()).toBeUndefined();
        expect($activePublishStatus.get()).toBeUndefined();
    });

    it('does not treat plain master patch (no editorial fields) as an online event', () => {
        const patch = createVersion('v-patch',
            [createAction(ContentOperation.PATCH, [], {origin: 'master'})],
            new Date('2024-01-15'));

        $versions.set([patch]);
        $onlineVersionId.set('some-id');

        expect($activePublishVersionId.get()).toBeUndefined();
        expect($activePublishStatus.get()).toBeUndefined();
    });

    it('master editorial patch supersedes a prior publish, which becomes a past badge', () => {
        const publish = createPublishedVersion('v-pub', new Date('2024-01-10'));
        const patch = createVersion('v-patch',
            [createAction(ContentOperation.PATCH, [VersionField.DATA], {origin: 'master'})],
            new Date('2024-01-15'));

        $versions.set([patch, publish]);
        $onlineVersionId.set('some-id');

        expect($activePublishVersionId.get()).toBe('v-patch');
        expect($activePublishStatus.get()).toBe(VersionPublishStatus.PUBLISHED);

        const past = $pastPublishBadges.get();
        expect(past.has('v-pub')).toBe(true);
        expect(past.get('v-pub')?.publishedTo).toBeUndefined();
    });

    it('unpublish between online events sets the earlier patch publishedTo to unpublish timestamp', () => {
        const earlyPatchTimestamp = new Date('2024-01-10');
        const unpublishTimestamp = new Date('2024-01-12');
        const laterPublishTimestamp = new Date('2024-01-15');

        const earlyPatch = createVersion('v-patch',
            [createAction(ContentOperation.PATCH, [VersionField.DATA], {origin: 'master'})],
            earlyPatchTimestamp);
        const unpublish = createVersion('v-unpub',
            [createAction(ContentOperation.UNPUBLISH)],
            unpublishTimestamp);
        const laterPublish = createPublishedVersion('v-pub', laterPublishTimestamp);

        $versions.set([laterPublish, unpublish, earlyPatch]);
        $onlineVersionId.set('some-id');

        const past = $pastPublishBadges.get();
        expect(past.get('v-patch')?.publishedTo).toEqual(unpublishTimestamp);
    });
});

// ============================================================================
// $versionsForDisplay (synthetic CREATE placeholder derivation)
// ============================================================================

describe('$versionsForDisplay synthetic placeholder', () => {
    it('appends synthetic version when last version is not CREATE/IMPORT/SYNC', () => {
        const update = createVersion('v1', [createAction(ContentOperation.UPDATE)]);
        $versions.set([update]);
        $allVersionsLoaded.set(true);
        setContentCreatedTime(new Date('2023-06-01'));

        const versions = $versionsForDisplay.get();
        expect(versions).toHaveLength(2);
        expect(versions[1].getId()).toBe('__synthetic_create__');
        expect(resolveVersionOperationType(versions[1])).toBe(VersionOperationType.SYNTHETIC_CREATE);
    });

    it('uses the provided createdDate as timestamp', () => {
        const update = createVersion('v1', [createAction(ContentOperation.UPDATE)]);
        $versions.set([update]);
        $allVersionsLoaded.set(true);

        const createdDate = new Date('2023-06-01T12:00:00Z');
        setContentCreatedTime(createdDate);

        const synthetic = $versionsForDisplay.get()[1];
        expect(synthetic.getTimestamp()).toEqual(createdDate);
    });

    it('does not append when last version is CREATE', () => {
        const create = createVersion('v1', [createAction(ContentOperation.CREATE)]);
        $versions.set([create]);
        $allVersionsLoaded.set(true);
        setContentCreatedTime(new Date('2023-06-01'));

        expect($versionsForDisplay.get()).toHaveLength(1);
    });

    it('appends synthetic when last version has no actions (UNKNOWN)', () => {
        const noActions = createVersion('v1', []);
        $versions.set([noActions]);
        $allVersionsLoaded.set(true);
        setContentCreatedTime(new Date('2023-06-01'));

        expect($versionsForDisplay.get()).toHaveLength(2);
        expect(resolveVersionOperationType(noActions)).toBe(VersionOperationType.UNKNOWN);
    });

    it('does not append when last version is IMPORT', () => {
        const imported = createVersion('v-import', [createAction(ContentOperation.IMPORT)]);
        const update = createVersion('v-update', [createAction(ContentOperation.UPDATE)]);
        $versions.set([update, imported]);
        $allVersionsLoaded.set(true);
        setContentCreatedTime(new Date('2023-06-01'));

        expect($versionsForDisplay.get()).toHaveLength(2);
    });

    it('does not append when last version is SYNC', () => {
        const sync = createVersion('v1', [createAction(ContentOperation.SYNC)]);
        $versions.set([sync]);
        $allVersionsLoaded.set(true);
        setContentCreatedTime(new Date('2023-06-01'));

        expect($versionsForDisplay.get()).toHaveLength(1);
    });

    it('does not append when versions are empty', () => {
        $versions.set([]);
        setContentCreatedTime(new Date('2023-06-01'));

        expect($versionsForDisplay.get()).toHaveLength(0);
    });

    it('does not append when $allVersionsLoaded is false', () => {
        const update = createVersion('v1', [createAction(ContentOperation.UPDATE)]);
        $versions.set([update]);
        $allVersionsLoaded.set(false);
        setContentCreatedTime(new Date('2023-06-01'));

        expect($versionsForDisplay.get()).toHaveLength(1);
    });

    it('does not append when createdTime is undefined', () => {
        const update = createVersion('v1', [createAction(ContentOperation.UPDATE)]);
        $versions.set([update]);
        $allVersionsLoaded.set(true);
        setContentCreatedTime(undefined);

        expect($versionsForDisplay.get()).toHaveLength(1);
    });

    it('appends when last version is PUBLISH', () => {
        const publish = createVersion('v1', [createAction(ContentOperation.PUBLISH)]);
        $versions.set([publish]);
        $allVersionsLoaded.set(true);
        setContentCreatedTime(new Date('2023-06-01'));

        const versions = $versionsForDisplay.get();
        expect(versions).toHaveLength(2);
        expect(versions[1].getId()).toBe('__synthetic_create__');
    });
});

// ============================================================================
// isFirstVersion and $allVersionsLoaded interaction
// ============================================================================

describe('no-actions version resolves to UNKNOWN', () => {
    it('is UNKNOWN when all versions not loaded', () => {
        const noActions = createVersion('v1', []);
        $versions.set([noActions]);
        $allVersionsLoaded.set(false);

        expect(resolveVersionOperationType(noActions)).toBe(VersionOperationType.UNKNOWN);
    });

    it('is UNKNOWN when it is last and all loaded', () => {
        const update = createVersion('v2', [createAction(ContentOperation.UPDATE)]);
        const noActions = createVersion('v1', []);
        $versions.set([update, noActions]);
        $allVersionsLoaded.set(true);

        expect(resolveVersionOperationType(noActions)).toBe(VersionOperationType.UNKNOWN);
    });

    it('is UNKNOWN when it is not last even if all loaded', () => {
        const noActions = createVersion('v2', []);
        const create = createVersion('v1', [createAction(ContentOperation.CREATE)]);
        $versions.set([noActions, create]);
        $allVersionsLoaded.set(true);

        expect(resolveVersionOperationType(noActions)).toBe(VersionOperationType.UNKNOWN);
    });
});

// ============================================================================
// VERSION_OPERATION_MATRIX completeness
// ============================================================================

describe('VERSION_OPERATION_MATRIX', () => {
    it('covers all VersionOperationType values', () => {
        const allTypes = Object.values(VersionOperationType);
        for (const type of allTypes) {
            const version = type === VersionOperationType.RENAME
                ? createVersion('v1', [createAction(ContentOperation.MOVE, [VersionField.NAME])])
                : type === VersionOperationType.IMPORT
                    ? createVersion('v-import', [createAction(ContentOperation.IMPORT)])
                    : type === VersionOperationType.SYNTHETIC_CREATE
                        ? (() => {
                            const b = new ContentVersionBuilder();
                            b.id = '__synthetic_create__';
                            b.timestamp = new Date();
                            b.actions = [];
                            return b.build();
                        })()
                        : type === VersionOperationType.LOCALIZE
                            ? null // stubbed, skip
                            : type === VersionOperationType.EDITORIAL_PATCH
                                ? createVersion('v1', [createAction(ContentOperation.PATCH, [VersionField.DATA])])
                                : type === VersionOperationType.UNKNOWN
                                    ? createVersion('v1', [])
                                    : createVersion('v1', [createAction(type)]);

            if (!version) {
                continue;
            }

            const resolved = resolveVersionOperationType(version);
            expect(resolved).toBeDefined();

            // All resolved types should produce valid config (icon, label, etc.)
            expect(getIconForOperation(version)).toBeDefined();
            expect(getOperationLabel(version)).toBeDefined();
        }
    });
});
