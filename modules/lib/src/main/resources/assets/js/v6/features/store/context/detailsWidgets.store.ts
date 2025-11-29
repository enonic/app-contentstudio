import {computed, task} from 'nanostores';
import {$contextContent} from './contextContent.store';
import {Content} from '../../../../app/content/Content';
import {EffectivePermission} from '../../../../app/security/EffectivePermission';
import {Attachments} from '../../../../app/attachment/Attachments';
import {ContentPath} from '../../../../app/content/ContentPath';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {GetContentByIdRequest} from '../../../../app/resource/GetContentByIdRequest';
import {GetContentAttachmentsRequest} from '../../../../app/resource/GetContentAttachmentsRequest';
import {GetEffectivePermissionsRequest} from '../../../../app/resource/GetEffectivePermissionsRequest';
import {ContentId} from '../../../../app/content/ContentId';
import {Access} from '../../../../app/security/Access';
import {AccessControlEntryView} from '../../../../app/view/AccessControlEntryView';
import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';

export const $detailsWidgetContent = computed($contextContent, (contentSummary) =>
    task(async () => {
        if (!contentSummary) return undefined;

        try {
            return await loadContent(contentSummary);
        } catch (error) {
            console.error(error);
            return undefined;
        }
    })
);

export const $detailsWidgetPermissions = computed($detailsWidgetContent, (content) =>
    task(async () => {
        if (!content) return undefined;

        try {
            return await loadPermissions(content.getContentId());
        } catch (error) {
            console.error(error);
            return undefined;
        }
    })
);

export const $detailsWidgetAttachments = computed($detailsWidgetContent, (content) =>
    task(async () => {
        if (!content) return undefined;

        try {
            return await loadAttachments(content.getContentId());
        } catch (error) {
            console.error(error);
            return undefined;
        }
    })
);

export const $detailsWidgetEffectivePermissions = computed(
    [$detailsWidgetContent, $detailsWidgetPermissions],
    (content, permissions) => {
        if (!content || !permissions) return [];
        return filterEffectivePermissions(content, permissions);
    }
);

//
// * Utilities
//

export function getEveryoneAccess(content: Content): Access {
    const entry = content.getPermissions().getEntry(RoleKeys.EVERYONE);

    return entry ? AccessControlEntryView.getAccessValueFromEntry(entry) : null;
}

export function sortPrincipals(principals: Principal[]): Principal[] {
    const currentUser = AuthContext.get().getUser();

    return principals.sort((a, _) => {
        if (currentUser && currentUser.getKey().equals(a.getKey())) {
            return -1;
        }
        return 1;
    });
}

//
// * Internal
//

function filterEffectivePermissions(content: Content, permissions: EffectivePermission[]): EffectivePermission[] {
    return permissions.filter(
        (item: EffectivePermission) =>
            item.getAccess() !== getEveryoneAccess(content) && item.getPermissionAccess().getCount() > 0
    );
}

async function loadContent(contentSummary: Readonly<ContentSummaryAndCompareStatus>): Promise<Content | undefined> {
    try {
        const request = new GetContentByIdRequest(contentSummary.getContentId());

        const content = await request.sendAndParse();

        return content;
    } catch (error) {
        console.error(error);

        return undefined;
    }
}

async function loadAttachments(contentId: ContentId): Promise<Attachments | undefined> {
    try {
        const request = new GetContentAttachmentsRequest(contentId).setContentRootPath(ContentPath.CONTENT_ROOT);

        const attachments = await request.sendAndParse();

        return attachments;
    } catch (error) {
        console.error(error);

        return undefined;
    }
}

async function loadPermissions(contentId: ContentId): Promise<EffectivePermission[] | undefined> {
    try {
        const request = new GetEffectivePermissionsRequest(contentId);

        const permissions = await request.sendAndParse();

        return permissions;
    } catch (error) {
        console.error(error);

        return undefined;
    }
}
