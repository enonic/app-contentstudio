import {type ResultAsync} from 'neverthrow';
import {type ContentId} from '../../../../../../../app/content/ContentId';
import {type ContentJson} from '../../../../../../../app/content/ContentJson';
import {type ContentVersionsLoadResult} from '../../../../../utils/widget/versions/versionsCache';

export type VersionsServices = {
    loadVersions: (contentId: ContentId, cursor?: string) => Promise<ContentVersionsLoadResult>;
    fetchVersion: (contentId: string, versionId: string) => ResultAsync<ContentJson, Error>;
    revert?: (contentId: ContentId, versionId: string) => ResultAsync<string, Error>;
    subscribeContentInvalidation?: (handler: (contentId: string) => void) => () => void;
};

export type VersionsNotifier = {
    showSuccess: (message: string) => void;
};

export type VersionsConfig = {
    services: VersionsServices;
    notify?: VersionsNotifier;
    handleError?: (err: Error) => void;
};
