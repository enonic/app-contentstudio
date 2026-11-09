import { AppError } from '@enonic/ui-utils';
import { requestJson } from '@enonic/ui-utils/request';
import { Result, type ResultAsync } from 'neverthrow';
import { type Content, ContentBuilder } from '../../../../app/content/Content';
import { type ContentJson } from '../../../../app/content/ContentJson';
import { ContentPath } from '../../../../app/content/ContentPath';
import { ContentUnnamed } from '../../../../app/content/ContentUnnamed';
import { type ContentTypeName } from '../../../shared/lib/cms/schema/contentTypeName';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

export type CreateContentParams = {
    contentType: ContentTypeName;
    /** Project to create in; defaults to the active project. */
    projectName?: string;
};

/**
 * Creates an empty, unnamed content of the type in the project root, as the wizard does before its
 * first save. Used by: features/shared/form/input-types/content-selector.
 */
export function createContent({ contentType, projectName }: CreateContentParams): ResultAsync<Content, AppError> {
    return requestJson<ContentJson>(getCmsApiUrl('create', projectName), {
        method: 'POST',
        body: {
            valid: false,
            requireValid: false,
            name: ContentUnnamed.UNNAMED_PREFIX,
            parent: ContentPath.getRoot().toString(),
            contentType,
            data: [],
            meta: [],
            displayName: '',
            workflow: { state: 'IN_PROGRESS', checks: {} },
        },
    }).andThen(buildContent);
}

/** Build the domain content, keeping a builder throw as a parse failure. */
function buildContent(json: ContentJson): Result<Content, AppError> {
    return Result.fromThrowable(
        () => new ContentBuilder().fromContentJson(json).build(),
        () => new AppError('Failed to parse the created content'),
    )();
}
