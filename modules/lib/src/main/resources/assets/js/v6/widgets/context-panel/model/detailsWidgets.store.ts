import { atom, computed, onMount, task } from 'nanostores';
import { $contextContent } from './contextContent.store';
import { type Content } from '../../../../app/content/Content';
import { type EffectivePermission } from '../../../../app/security/EffectivePermission';
import { type Attachments } from '../../../../app/attachment/Attachments';
import { type ContentSummary } from '../../../../app/content/ContentSummary';
import { type ContentId } from '../../../../app/content/ContentId';
import { fetchContentAttachments, fetchContentById, fetchEffectivePermissions } from '../../../entities/content';
import { type Access } from '../../../../app/security/Access';
import { AccessControlEntryView } from '../../../../app/view/AccessControlEntryView';
import { RoleKeys } from '@enonic/lib-admin-ui/security/RoleKeys';
import { AuthContext } from '@enonic/lib-admin-ui/auth/AuthContext';
import { type Principal } from '@enonic/lib-admin-ui/security/Principal';
import { $contentPermissionsUpdated } from '../../../shared/socket/socket.store';

const $detailsContentRefreshSignal = atom(0);

onMount($detailsContentRefreshSignal, () =>
    $contentPermissionsUpdated.subscribe((event) => {
        if (!event?.data) return;
        const contextContent = $contextContent.get();
        if (!contextContent) return;

        const contentId = contextContent.getContentId();
        if (event.data.some((id) => id.equals(contentId))) {
            $detailsContentRefreshSignal.set(Date.now());
        }
    }),
);

export const $detailsWidgetContent = computed(
    [$contextContent, $detailsContentRefreshSignal],
    (contentSummary, _refresh) =>
        task(async () => {
            if (!contentSummary) return undefined;

            try {
                return await loadContent(contentSummary);
            } catch (error) {
                console.error(error);
                return undefined;
            }
        }),
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
    }),
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
    }),
);

export const $detailsWidgetEffectivePermissions = computed(
    [$detailsWidgetContent, $detailsWidgetPermissions],
    (content, permissions) => {
        if (!content || !permissions) return [];
        return filterEffectivePermissions(content, permissions);
    },
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
            item.getAccess() !== getEveryoneAccess(content) && item.getPermissionAccess().getCount() > 0,
    );
}

async function loadContent(contentSummary: Readonly<ContentSummary>): Promise<Content | undefined> {
    const result = await fetchContentById(contentSummary.getContentId().toString());

    return result.match(
        (content) => content,
        (error) => {
            console.error(error);

            return undefined;
        },
    );
}

async function loadAttachments(contentId: ContentId): Promise<Attachments | undefined> {
    const result = await fetchContentAttachments(contentId);

    return result.match(
        (attachments) => attachments,
        (error) => {
            console.error(error);

            return undefined;
        },
    );
}

async function loadPermissions(contentId: ContentId): Promise<EffectivePermission[] | undefined> {
    const result = await fetchEffectivePermissions(contentId);

    return result.match(
        (permissions) => permissions,
        (error) => {
            console.error(error);

            return undefined;
        },
    );
}
