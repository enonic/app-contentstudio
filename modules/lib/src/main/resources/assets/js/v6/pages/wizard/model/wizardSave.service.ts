import { ObjectHelper } from '@enonic/lib-admin-ui/ObjectHelper';
import type { ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import type { Content } from '../../../../app/content/Content';
import type { ContentPath } from '../../../../app/content/ContentPath';
import { WorkflowState } from '../../../../app/content/WorkflowState';
import type { Page } from '../../../../app/page/Page';
import type { PageCUDRequest } from '../../../../app/resource/PageCUDRequest';
import { UpdateContentRequest } from '../../../../app/resource/UpdateContentRequest';
import { UpdatePageRequest } from '../../../../app/resource/UpdatePageRequest';
import { UpdateWorkflowRequest } from '../../../../app/resource/UpdateWorkflowRequest';
import { ContentDiffHelper } from '../../../../app/util/ContentDiffHelper';
import { ContentHelper } from '../../../../app/util/ContentHelper';
import { PageHelper } from '../../../../app/util/PageHelper';
import { CreatePageRequest } from '../../../../app/wizard/CreatePageRequest';
import { DeletePageRequest } from '../../../../app/wizard/DeletePageRequest';
import { i18n } from '../../../shared/i18n';
import { $wizardDraftWorkflowState } from './wizardContent.store';
import { buildViewedContent } from './wizardViewedContent.utils';

//
// * Wizard Save Service
//
// Sends what differs between the persisted content and the drafts: the content
// itself, its page and the workflow state. The legacy wizard panel decides when
// to save and what to do with the result.
//

export type WizardSaveResult = {
    content: Content;
    dataUpdated: boolean;
    pageUpdated: boolean;
    workflowUpdated: boolean;
};

export type WizardSavedMessageContext = {
    wasInherited: boolean;
    renamed: boolean;
};

function hasNamesChanged(persisted: Content, viewed: Content): boolean {
    return persisted.getDisplayName() !== viewed.getDisplayName() || !persisted.getName().equals(viewed.getName());
}

function hasContentChanged(persisted: Content, viewed: Content): boolean {
    return (
        !ContentDiffHelper.dataEquals(persisted.getContentData(), viewed.getContentData()) ||
        !ContentDiffHelper.extraDataEquals(persisted.getMixins(), viewed.getMixins()) ||
        !ObjectHelper.dateEquals(persisted.getPublishFromTime(), viewed.getPublishFromTime()) ||
        !ObjectHelper.dateEquals(persisted.getPublishToTime(), viewed.getPublishToTime()) ||
        !persisted.getPermissions().equals(viewed.getPermissions())
    );
}

function hasPageChanged(persisted: Content, viewed: Content): boolean {
    const persistedPage: Page | null = persisted.getPage();
    const viewedPage: Page | null = viewed.getPage();

    return persistedPage ? !persistedPage.equals(viewedPage) : !!viewedPage;
}

function createPageRequest(persisted: Content, viewed: Content): PageCUDRequest | undefined {
    const contentId = persisted.getContentId();

    if (!viewed.isPage()) {
        return persisted.isPage() ? new DeletePageRequest(contentId) : undefined;
    }

    const page = viewed.getPage();
    const request = persisted.isPage() ? new UpdatePageRequest(contentId) : new CreatePageRequest(contentId);

    return request
        .setController(page.getController())
        .setPageTemplateKey(page.getTemplate())
        .setConfig(page.getConfig())
        .setRegions(page.getRegions())
        .setFragment(page.getFragment());
}

/** Sends the page of the viewed content; `persisted` is the content as the server has it now. */
export async function saveWizardPage(persisted: Content, viewed: Content): Promise<Content | undefined> {
    await PageHelper.normalizeConfigValueTypes(viewed.getPage());

    return await createPageRequest(persisted, viewed)?.sendAndParse();
}

export async function updateWizardContent(persisted: Content): Promise<WizardSaveResult> {
    const viewed = buildViewedContent(persisted);
    const result: WizardSaveResult = {
        content: persisted,
        dataUpdated: false,
        pageUpdated: false,
        workflowUpdated: false,
    };

    const pageChanged = hasPageChanged(persisted, viewed);
    const contentChanged = hasContentChanged(persisted, viewed);

    if (contentChanged || hasNamesChanged(persisted, viewed)) {
        result.content = await UpdateContentRequest.create(viewed).sendAndParse();
        // The page may use any of the changed data, so it counts as updated too.
        result.pageUpdated = true;
        result.dataUpdated = contentChanged;
    }

    if (pageChanged) {
        const content = await saveWizardPage(result.content, viewed);

        if (content) {
            result.content = content;
            result.pageUpdated = true;
        }
    }

    if ($wizardDraftWorkflowState.get() === WorkflowState.READY) {
        result.content = await new UpdateWorkflowRequest(viewed.getContentId(), WorkflowState.READY).sendAndParse();
        result.workflowUpdated = true;
    }

    return result;
}

/** Creates the unnamed, empty content a new wizard starts from. */
export async function createWizardContent(type: ContentTypeName, parentPath: ContentPath): Promise<Content> {
    return await ContentHelper.makeNewContentRequest(type).setParent(parentPath).sendAndParse();
}

export function resolveSavedMessage(content: Content, { wasInherited, renamed }: WizardSavedMessageContext): string {
    const name = content.getName();

    if (wasInherited) return i18n('notify.content.localized');
    if (name.isUnnamed()) return i18n('notify.item.savedUnnamed');
    if (renamed) return i18n('notify.wizard.contentRenamed', name.toString());
    if (content.isReady()) return i18n('notify.item.markedAsReady', name.toString());

    return i18n('notify.item.saved', name.toString());
}
