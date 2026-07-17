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
import {
    $contentCreated,
    $contentDeleted,
    $contentPermissionsUpdated,
    $contentUpdated,
    type ContentEvent,
} from '../../../shared/socket/socket.store';
import { isDeletedTemplateForContent, isTemplateEventForContent } from '../../../shared/lib/page/templateEvent';
import { ContentServerChangeItem } from '../../../../app/event/ContentServerChangeItem';

const $detailsContentRefreshSignal = atom(0);

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
// * Initialization
//

onMount($detailsContentRefreshSignal, () => {
    const refresh = (): void => $detailsContentRefreshSignal.set(Date.now());

    const onPermissionsUpdated = (event: Readonly<ContentEvent<ContentId[]>> | null) => {
        if (!event?.data) return;
        const contextContent = $contextContent.get();
        if (!contextContent) return;

        const contentId = contextContent.getContentId();
        if (event.data.some((id) => id.equals(contentId))) refresh();
    }

    const onTemplateCreatedOrUpdated = (event: Readonly<ContentEvent<ContentSummary[]>> | null): void => {
        if (!event?.data) return;
        const contextContent = $contextContent.get();
        if (!contextContent) return;

        if (event.data.some((summary) => isTemplateEventForContent(summary, contextContent))) refresh();
    };

    const onTemplateDeleted = (event: Readonly<ContentEvent<ContentServerChangeItem[]>> | null) => {
        if (!event?.data) return;
        const contextContent = $contextContent.get();
        if (!contextContent) return;

        if (event.data.some((item) => isDeletedTemplateForContent(item.getPath(), contextContent))) refresh();
    }

    const unsubPermissionsUpdated = $contentPermissionsUpdated.subscribe(onPermissionsUpdated);
    const unsubCreated = $contentCreated.subscribe(onTemplateCreatedOrUpdated);
    const unsubUpdated = $contentUpdated.subscribe(onTemplateCreatedOrUpdated);
    const unsubDeleted = $contentDeleted.subscribe(onTemplateDeleted);

    return () => {
        unsubPermissionsUpdated();
        unsubCreated();
        unsubUpdated();
        unsubDeleted();
    };
});

//
// * Actions
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
