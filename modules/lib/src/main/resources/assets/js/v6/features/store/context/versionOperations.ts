import {type ContentVersion} from '../../../../app/ContentVersion';

import {
    Archive,
    ArchiveRestore,
    ArrowDownNarrowWide,
    CaseSensitive,
    CircleCheckBig,
    CircleQuestionMark,
    CircleUserRound,
    Cloud,
    CloudOff,
    Copy,
    FilePenLine,
    FolderInput,
    Globe,
    Import,
    type LucideIcon,
    Pen,
    PenLine,
    SendToBack,
    SquarePen,
} from 'lucide-react';

//
// * Operation Types
//

export const ContentOperation = {
    CREATE: 'content.create',
    DUPLICATE: 'content.duplicate',
    UPDATE: 'content.update',
    PERMISSIONS: 'content.permissions',
    MOVE: 'content.move',
    SORT: 'content.sort',
    PATCH: 'content.patch',
    ARCHIVE: 'content.archive',
    RESTORE: 'content.restore',
    PUBLISH: 'content.publish',
    UNPUBLISH: 'content.unpublish',
    METADATA: 'content.updateMetadata',
    WORKFLOW: 'content.updateWorkflow',
    SYNC: 'content.sync',
    IMPORT: 'content.import',
} as const;

export type ContentOperation = typeof ContentOperation[keyof typeof ContentOperation];

const CONTENT_OPERATION_SET = new Set<string>(Object.values(ContentOperation));

export const isContentOperation = (value: string): value is ContentOperation =>
    CONTENT_OPERATION_SET.has(value);

export const VersionField = {
    DISPLAY_NAME: 'displayName',
    DATA: 'data',
    X: 'x',
    PAGE: 'components',
    OWNER: 'owner',
    LANGUAGE: 'language',
    PUBLISH: 'publish',
    WORKFLOW: 'workflow',
    VARIANT_OF: 'variantOf',
    ATTACHMENTS: 'attachments',
    NAME: 'name',
    PARENT_PATH: 'parentPath',
    MANUAL_ORDER: 'manualOrderValue',
    INHERIT: 'inherit',
} as const;

export const VersionOperationType = {
    ...ContentOperation,
    RENAME: 'content.rename',
    LOCALIZE: 'content.localize',
    SYNTHETIC_CREATE: 'content.syntheticCreate',
    EDITORIAL_PATCH: 'content.editorialPatch',
    UNKNOWN: 'content.unknown',
} as const;

export type VersionOperationType = typeof VersionOperationType[keyof typeof VersionOperationType];

export const EDITORIAL_PATCH_FIELDS: readonly string[] = [
    VersionField.DISPLAY_NAME,
    VersionField.DATA,
    VersionField.X,
    VersionField.PAGE,
    VersionField.NAME,
    VersionField.PARENT_PATH,
];

//
// * Synthetic version sentinel
//

export const SYNTHETIC_VERSION_ID = '__synthetic_create__';

export const isSyntheticVersion = (version: ContentVersion): boolean =>
    version.getId() === SYNTHETIC_VERSION_ID;

//
// * Matrix
//

export type VersionOperationConfig = {
    standardMode: boolean;
    fullMode: boolean;
    restorable: boolean;
    comparable: boolean;
    icon: LucideIcon;
    labelKey: string;
};

const VERSION_OPERATION_MATRIX: Record<VersionOperationType, VersionOperationConfig> = {
    [VersionOperationType.CREATE]: {standardMode: true, fullMode: true, restorable: true, comparable: true, icon: PenLine, labelKey: 'operation.content.create'},
    [VersionOperationType.DUPLICATE]: {standardMode: true, fullMode: true, restorable: true, comparable: true, icon: Copy, labelKey: 'operation.content.duplicate'},
    [VersionOperationType.UPDATE]: {standardMode: true, fullMode: true, restorable: true, comparable: true, icon: Pen, labelKey: 'operation.content.update'},
    [VersionOperationType.PUBLISH]: {standardMode: false, fullMode: true, restorable: false, comparable: false, icon: Cloud, labelKey: 'operation.content.publish'},
    [VersionOperationType.UNPUBLISH]: {standardMode: false, fullMode: true, restorable: false, comparable: false, icon: CloudOff, labelKey: 'operation.content.unpublish'},
    [VersionOperationType.PERMISSIONS]: {standardMode: false, fullMode: true, restorable: false, comparable: false, icon: CircleUserRound, labelKey: 'operation.content.permissions'},
    [VersionOperationType.MOVE]: {standardMode: true, fullMode: true, restorable: false, comparable: true, icon: FolderInput, labelKey: 'operation.content.move'},
    [VersionOperationType.RENAME]: {standardMode: true, fullMode: true, restorable: false, comparable: true, icon: CaseSensitive, labelKey: 'operation.content.name'},
    [VersionOperationType.SORT]: {standardMode: true, fullMode: true, restorable: false, comparable: true, icon: ArrowDownNarrowWide, labelKey: 'operation.content.sort'},
    [VersionOperationType.PATCH]: {standardMode: false, fullMode: true, restorable: false, comparable: false, icon: SquarePen, labelKey: 'operation.content.patch'},
    [VersionOperationType.EDITORIAL_PATCH]: {standardMode: true, fullMode: true, restorable: false, comparable: true, icon: SquarePen, labelKey: 'operation.content.patch'},
    [VersionOperationType.ARCHIVE]: {standardMode: false, fullMode: true, restorable: false, comparable: false, icon: Archive, labelKey: 'operation.content.archive'},
    [VersionOperationType.RESTORE]: {standardMode: false, fullMode: true, restorable: false, comparable: false, icon: ArchiveRestore, labelKey: 'operation.content.restore'},
    [VersionOperationType.METADATA]: {standardMode: false, fullMode: true, restorable: false, comparable: false, icon: FilePenLine, labelKey: 'operation.content.updateMetadata'},
    [VersionOperationType.WORKFLOW]: {standardMode: false, fullMode: true, restorable: false, comparable: false, icon: CircleCheckBig, labelKey: 'operation.content.updateWorkflow'},
    [VersionOperationType.SYNC]: {standardMode: true, fullMode: true, restorable: true, comparable: true, icon: SendToBack, labelKey: 'operation.content.sync'},
    [VersionOperationType.IMPORT]: {standardMode: true, fullMode: true, restorable: true, comparable: true, icon: Import, labelKey: 'operation.content.import'},
    [VersionOperationType.LOCALIZE]: {standardMode: true, fullMode: true, restorable: true, comparable: true, icon: Globe, labelKey: 'operation.content.localize'},
    [VersionOperationType.SYNTHETIC_CREATE]: {standardMode: true, fullMode: true, restorable: false, comparable: false, icon: PenLine, labelKey: 'operation.content.create'},
    [VersionOperationType.UNKNOWN]: {standardMode: false, fullMode: true, restorable: false, comparable: false, icon: CircleQuestionMark, labelKey: 'operation.content.unknown'},
};

//
// * Resolution + predicates
//

const getFirstAction = (version: ContentVersion) => version.getActions()[0];

export const resolveVersionOperationType = (version: ContentVersion): VersionOperationType | undefined => {
    if (isSyntheticVersion(version)) {
        return VersionOperationType.SYNTHETIC_CREATE;
    }

    const action = getFirstAction(version);

    if (!action) {
        return VersionOperationType.UNKNOWN;
    }

    const operation = action.getOperation();

    if (operation === ContentOperation.MOVE) {
        const fields = action.getFields();
        if (fields.length === 1 && fields[0] === VersionField.NAME) {
            return VersionOperationType.RENAME;
        }
    }

    if (operation === ContentOperation.UPDATE || operation === ContentOperation.METADATA) {
        const fields = action.getFields();
        if (fields.some(f => f === VersionField.INHERIT)) {
            return VersionOperationType.LOCALIZE;
        }
    }

    if (operation === ContentOperation.PATCH) {
        const fields = action.getFields();
        if (fields.some(f => EDITORIAL_PATCH_FIELDS.includes(f))) {
            return VersionOperationType.EDITORIAL_PATCH;
        }
    }

    return isContentOperation(operation) ? operation : undefined;
};

export const getVersionConfig = (version: ContentVersion): VersionOperationConfig | undefined => {
    const type = resolveVersionOperationType(version);
    return type ? VERSION_OPERATION_MATRIX[type] : undefined;
};

export const isVersionRevertable = (version: ContentVersion): boolean =>
    getVersionConfig(version)?.restorable ?? false;

export const isVersionComparable = (version: ContentVersion): boolean =>
    getVersionConfig(version)?.comparable ?? false;

// Publish with no editorial ref becomes its own badge target (see
// `$allPublishBadges`) and must stay visible in default mode.
const isStandalonePublishBadgeTarget = (version: ContentVersion): boolean => {
    if (!version.getPublishInfo()) return false;
    const publishAction = version.getActions().find(a => a.getOperation() === ContentOperation.PUBLISH);
    return publishAction != null && publishAction.getEditorial() == null;
};

export const isStandardModeVersion = (version: ContentVersion): boolean =>
    (getVersionConfig(version)?.standardMode ?? false) || isStandalonePublishBadgeTarget(version);

export const isVersionToBeDisplayedInFullMode = (version: ContentVersion): boolean =>
    getVersionConfig(version)?.fullMode ?? true;

//
// * Date formatting
//

// Single source of truth for "when the version's operation happened". Uses the
// first action's opTime (consistent with `resolveVersionOperationType` and the
// modifier, which both read `getActions()[0]`), falling back to the version
// timestamp when there are no actions or opTime is absent.
export const getVersionOperationTime = (version: ContentVersion): Date =>
    version.getActions()[0]?.getOpTime() ?? version.getTimestamp();

/** Formats version operation date as YYYY-MM-DD. */
export const getFormattedVersionDate = (version: ContentVersion): string => {
    const time = getVersionOperationTime(version);
    const year = time.getFullYear();
    const month = (time.getMonth() + 1).toString().padStart(2, '0');
    const day = time.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};
