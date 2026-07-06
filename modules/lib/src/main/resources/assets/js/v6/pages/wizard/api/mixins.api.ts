import { type ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { type ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { ResultAsync } from 'neverthrow';
import { type ContentId } from '../../../../app/content/ContentId';
import { MixinDescriptor } from '../../../../app/content/MixinDescriptor';
import { type MixinDescriptorListJson } from '../../../../app/resource/json/MixinDescriptorListJson';
import { requestJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsProjectUrl } from '../../../shared/lib/url/cms';

/**
 * Load the mixins an application contributes for a given content type.
 * Used by: pages/wizard/model/wizardMixins.service.
 */
export function fetchApplicationMixins(
    contentTypeName: ContentTypeName,
    applicationKey: ApplicationKey,
): ResultAsync<MixinDescriptor[], AppError> {
    const query = new URLSearchParams();
    query.append('contentTypeName', contentTypeName.toString());
    query.append('applicationKey', applicationKey.toString());

    const url = `${getCmsProjectUrl('content/schema/mixins/getApplicationMixinsForContentType')}?${query.toString()}`;

    return requestJson<MixinDescriptorListJson>(url).map((json) => json.mixins.map(MixinDescriptor.fromJson));
}

/**
 * Load the mixins currently attached to a persisted content.
 * Used by: pages/wizard/model/wizardMixins.service.
 */
export function fetchContentMixins(contentId: ContentId): ResultAsync<MixinDescriptor[], AppError> {
    const query = new URLSearchParams();
    query.append('contentId', contentId.toString());

    const url = `${getCmsProjectUrl('content/schema/mixins/getContentMixins')}?${query.toString()}`;

    return requestJson<MixinDescriptorListJson>(url).map((json) => json.mixins.map(MixinDescriptor.fromJson));
}
