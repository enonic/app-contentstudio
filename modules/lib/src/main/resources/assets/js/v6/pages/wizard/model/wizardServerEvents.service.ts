import type Q from 'q';
import type { MovedContentItem } from '../../../../app/browse/MovedContentItem';
import type { Content } from '../../../../app/content/Content';
import type { ContentId } from '../../../../app/content/ContentId';
import type { ContentPath } from '../../../../app/content/ContentPath';
import type { ContentSummaryAndCompareStatus } from '../../../../app/content/ContentSummaryAndCompareStatus';
import type { ContentServerChangeItem } from '../../../../app/event/ContentServerChangeItem';
import { ContentServerEventsHandler } from '../../../../app/event/ContentServerEventsHandler';
import { RepositoryId } from '../../../../app/repository/RepositoryId';
import { ContentsExistRequest } from '../../../../app/resource/ContentsExistRequest';
import { ContentSummaryAndCompareStatusFetcher } from '../../../../app/resource/ContentSummaryAndCompareStatusFetcher';
import { ProjectDeletedEvent } from '../../../../app/settings/event/ProjectDeletedEvent';
import { getActiveProject, getActiveProjectName } from '../../../entities/project';
import { isDeletedTemplateForContent } from '../../../shared/lib/page/templateEvent';
import { handleError } from '../../../shared/notifications';

//
// * Wizard Server Events Service
//
// Decides what a content server event means for the edited content: its own
// summary changed, it is gone, or another content the wizard depends on changed.
// What follows from that still lives in the legacy wizard panel, behind the host.
//

export type WizardServerEventsHost = {
    getPersistedContent: () => Content | undefined;
    /** The wizard is saving, so the events are echoes of its own requests. */
    isSaving: () => boolean;
    /** The summary or the publish status of the edited content changed. */
    applySummary: (summary: ContentSummaryAndCompareStatus) => void;
    /** The edited content was sorted: only the actions and the context follow. */
    applySorted: (summary: ContentSummaryAndCompareStatus) => void;
    /** Another content changed; the page editor may show it. */
    otherContentUpdated: (summary: ContentSummaryAndCompareStatus) => void;
    /** Page templates under the root of the edited content were deleted. */
    templatesDeleted: (ids: ContentId[]) => void;
    /** A descendant was published or unpublished without the edited content. */
    descendantsPublishChanged: () => void;
    /** Runs after every publish or unpublish event. */
    publishStateChanged: () => void;
    setExistsInParentProject: (exists: boolean) => void;
    /** The edited content or its project was deleted or archived. */
    closeDeleted: () => void;
};

export type WizardServerEventHandlers = {
    updated: (contents: ContentSummaryAndCompareStatus[]) => void;
    moved: (items: MovedContentItem[]) => void;
    sorted: (contents: ContentSummaryAndCompareStatus[]) => void;
    renamed: (contents: ContentSummaryAndCompareStatus[], oldPaths: ContentPath[]) => void;
    publishChanged: (contents: ContentSummaryAndCompareStatus[]) => void;
    permissionsUpdated: (ids: ContentId[]) => void;
    deleted: (items: ContentServerChangeItem[]) => void;
    archived: (items: ContentServerChangeItem[]) => void;
    deletedInOtherRepos: (items: ContentServerChangeItem[]) => void;
    projectDeleted: (projectName: string) => void;
};

type Fetcher = Pick<ContentSummaryAndCompareStatusFetcher, 'fetch' | 'fetchByContent'>;

export function createWizardServerEventHandlers(
    host: WizardServerEventsHost,
    fetcher: Fetcher = new ContentSummaryAndCompareStatusFetcher(),
): WizardServerEventHandlers {
    const isCurrent = (id: ContentId | null | undefined): boolean => {
        const persisted = host.getPersistedContent();
        return persisted != null && id != null && persisted.getContentId().equals(id);
    };

    const route = (updated: ContentSummaryAndCompareStatus): void => {
        if (isCurrent(updated.getContentId())) {
            host.applySummary(updated);
        } else {
            host.otherContentUpdated(updated);
        }
    };

    const refetch = (fetch: Q.Promise<ContentSummaryAndCompareStatus>, skipUnchanged = false): void => {
        fetch
            .then((summary) => {
                if (skipUnchanged && summary.equals(host.getPersistedContent())) return;
                host.applySummary(summary);
            })
            .catch(handleError);
    };

    return {
        updated: (contents) => {
            if (host.isSaving()) return;
            contents.forEach(route);
        },

        moved: (items) => {
            const persistedPath = host.getPersistedContent()?.getPath();
            const wasMoved = items.some(
                ({ item, oldPath }) =>
                    isCurrent(item.getContentId()) ||
                    (persistedPath != null && (persistedPath.isDescendantOf(oldPath) || persistedPath.equals(oldPath))),
            );

            // ? The first moved item stands for the whole event, as before.
            if (wasMoved) route(items[0].item);
        },

        sorted: (contents) => {
            const current = contents.find((content) => isCurrent(content.getContentId()));
            if (current) host.applySorted(current);
        },

        renamed: (contents, oldPaths) => {
            contents.forEach((renamed, index) => {
                const persisted = host.getPersistedContent();

                if (isCurrent(renamed.getContentId())) {
                    host.applySummary(renamed);
                } else if (persisted?.getPath().isDescendantOf(oldPaths[index])) {
                    refetch(fetcher.fetchByContent(persisted));
                }
            });
        },

        publishChanged: (contents) => {
            const persistedPath = host.getPersistedContent()?.getPath();
            let currentUpdated = false;
            let descendantChanged = false;

            contents.forEach((content) => {
                if (isCurrent(content.getContentId())) {
                    host.applySummary(content);
                    currentUpdated = true;
                } else if (persistedPath && content.getPath().isDescendantOf(persistedPath)) {
                    descendantChanged = true;
                }
            });

            // A descendant may be (un)published without the edited content in the event,
            // e.g. publishing the tree of a site that is already online.
            if (!currentUpdated && descendantChanged) host.descendantsPublishChanged();

            host.publishStateChanged();
        },

        permissionsUpdated: (ids) => {
            const persisted = host.getPersistedContent();
            if (host.isSaving() || !persisted) return;

            const contentId = persisted.getContentId();
            if (ids.some((id) => id.equals(contentId))) refetch(fetcher.fetch(contentId), true);
        },

        deleted: (items) => {
            const persisted = host.getPersistedContent();
            const templateIds: ContentId[] = [];

            for (const item of items) {
                if (isCurrent(item.getContentId())) {
                    host.closeDeleted();
                    return;
                }

                if (persisted && isDeletedTemplateForContent(item.getPath(), persisted)) {
                    templateIds.push(item.getContentId());
                }
            }

            if (templateIds.length > 0) host.templatesDeleted(templateIds);
        },

        archived: (items) => {
            if (items.some((item) => isCurrent(item.getContentId()))) host.closeDeleted();
        },

        deletedInOtherRepos: (items) => {
            const persisted = host.getPersistedContent();
            const project = getActiveProject();
            if (!persisted?.isInherited() || !project.hasParents()) return;

            const contentId = persisted.getContentId();
            const parent = project.getParents().find((name) => {
                const repo = RepositoryId.fromProjectName(name).toString();
                return items.some((item) => item.getContentId().equals(contentId) && item.getRepo() === repo);
            });
            if (!parent) return;

            const id = contentId.toString();

            new ContentsExistRequest([id])
                .setRequestProjectName(parent)
                .sendAndParse()
                .then((result) => host.setExistsInParentProject(!!result.getContentsExistMap().get(id)))
                .catch(handleError);
        },

        projectDeleted: (projectName) => {
            if (projectName === getActiveProjectName()) host.closeDeleted();
        },
    };
}

/** Starts routing the server events to the host; the returned function stops it. */
export function startWizardServerEvents(host: WizardServerEventsHost): () => void {
    const handlers = createWizardServerEventHandlers(host);
    const events = ContentServerEventsHandler.getInstance();
    const projectDeleted = (event: ProjectDeletedEvent): void => handlers.projectDeleted(event.getProjectName());

    events.onContentMoved(handlers.moved);
    events.onContentSorted(handlers.sorted);
    events.onContentUpdated(handlers.updated);
    events.onContentPermissionsUpdated(handlers.permissionsUpdated);
    events.onContentPublished(handlers.publishChanged);
    events.onContentUnpublished(handlers.publishChanged);
    events.onContentRenamed(handlers.renamed);
    events.onContentDeletedInOtherRepos(handlers.deletedInOtherRepos);
    events.onContentArchived(handlers.archived);
    events.onContentDeleted(handlers.deleted);
    ProjectDeletedEvent.on(projectDeleted);

    return () => {
        events.unContentMoved(handlers.moved);
        events.unContentSorted(handlers.sorted);
        events.unContentUpdated(handlers.updated);
        events.unContentPermissionsUpdated(handlers.permissionsUpdated);
        events.unContentPublished(handlers.publishChanged);
        events.unContentUnpublished(handlers.publishChanged);
        events.unContentRenamed(handlers.renamed);
        events.unContentDeletedInOtherRepos(handlers.deletedInOtherRepos);
        events.unContentArchived(handlers.archived);
        events.unContentDeleted(handlers.deleted);
        ProjectDeletedEvent.un(projectDeleted);
    };
}
