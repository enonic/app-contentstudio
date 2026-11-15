import type { CompareStatus } from '../../../../app/content/CompareStatus';
import type { Content } from '../../../../app/content/Content';
import type { ContentId } from '../../../../app/content/ContentId';
import type { ContentSummaryAndCompareStatus } from '../../../../app/content/ContentSummaryAndCompareStatus';
import type { PageTemplate } from '../../../../app/content/PageTemplate';
import type { Site } from '../../../../app/content/Site';
import type { ContentType } from '../../../../app/inputtype/schema/ContentType';
import { GetPageTemplateByKeyRequest } from '../../../../app/resource/GetPageTemplateByKeyRequest';
import { SiteModel } from '../../../../app/site/SiteModel';
import { ContentHelper } from '../../../../app/util/ContentHelper';
import type { DefaultModels } from '../../../../app/wizard/page/DefaultModels';
import { PageState } from '../../../../app/wizard/page/PageState';
import { LiveEditModel } from '../../../../page-editor/LiveEditModel';
import { getActiveProject } from '../../../entities/project';
import { updateAiAppConfigs } from '../../../features/ai';
import { fromLegacyApplicationConfig } from '../../../shared/lib/cms/application/applicationConfig';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';
import { handleError } from '../../../shared/notifications';
import { isFrameRenderable, whenPreviewSettled } from '../../../widgets/preview-panel/model/previewResolution.store';
import { openWizardLiveEdit } from './wizardLayout.service';
import { loadDefaultModels, loadNearestSite } from './wizardLoad.service';

//
// * Wizard Page Editor Service
//
// Owns the model the page editor works with (the nearest site, the default page
// templates and the live edit model built from them) and decides when the editor
// reloads: after a save, and when a template, the parent site or a content the
// page shows changes on the server. The editor itself (iframe, toolbar, mask) is
// the view; it is attached once the wizard renders.
//
// ! Loaded only with the wizard panel. The wizard shell loads with the application
// ! and must not import this file: see `wizardStartupImports.test.ts`.
//

export type WizardPageEditorHost = {
    getPersistedContent: () => Content | undefined;
    getCompareStatus: () => CompareStatus | undefined;
    getContentType: () => ContentType | null | undefined;
    /** The wizard was opened to create a site. */
    createsSite: boolean;
};

export type WizardPageEditorView = {
    /** Resolves with whether the page can be rendered. */
    loadPage: () => Promise<boolean>;
    unloadPage: () => void;
    setModel: (model: LiveEditModel) => void;
    skipNextReloadConfirmation: (skip: boolean) => void;
};

export type WizardPageModelSource = {
    site: Site | null | undefined;
    defaultModels: DefaultModels | null | undefined;
};

const RELOAD_DELAY = 200;

let host: WizardPageEditorHost | undefined;
let view: WizardPageEditorView | undefined;
let site: Site | null | undefined;
let siteModel: SiteModel | undefined;
let defaultModels: DefaultModels | null | undefined;
let liveEditModel: LiveEditModel | undefined;

//
// * Model
//

function syncAiAppConfigs(): void {
    updateAiAppConfigs(
        site?.getSiteConfigs().map(fromLegacyApplicationConfig),
        getActiveProject().getSiteConfigs().map(fromLegacyApplicationConfig),
    );
}

function updateSite(next: Site): void {
    siteModel?.update(next);
    site = next;
    syncAiAppConfigs();
}

function initOrUpdateSiteModel(next: Site | null | undefined): void {
    if (!next) return;

    if (siteModel) {
        updateSite(next);
    } else {
        siteModel = new SiteModel(next);
    }
}

function defaultTemplateId(models: DefaultModels | null | undefined): string | null {
    return models?.getDefaultPageTemplate()?.getId() ?? null;
}

/** Sets what the model is built from, once the wizard data is loaded. */
export function initWizardPageModel(source: WizardPageModelSource): void {
    site = source.site;
    defaultModels = source.defaultModels;
    syncAiAppConfigs();
}

/** Rebuilds the live edit model for the content and hands it to the editor, when there is one. */
export function updateWizardPageModel(content: Content): void {
    initOrUpdateSiteModel(content.isSite() ? (content as Site) : site);

    liveEditModel = LiveEditModel.create()
        .setContent(content)
        .setCompareStatus(host?.getCompareStatus())
        .setSiteModel(siteModel)
        .setDefaultTemplate(defaultModels)
        .build();

    view?.setModel(liveEditModel);
}

export function getWizardLiveEditModel(): LiveEditModel | undefined {
    return liveEditModel;
}

/** The content got its name, so its path changed and the nearest site may be another one. */
export function handleWizardContentNamed(content: Content): void {
    if (content.isSite()) {
        site = content as Site;
        return;
    }

    loadNearestSite(content.getContentId())
        .then((nearest) => {
            site = nearest;
        })
        .catch(handleError);
}

/** The template Customize starts from: the one the page uses, or the default one. */
export async function getWizardTemplateForCustomize(): Promise<PageTemplate | null> {
    const page = PageState.getState();

    // A page with its own controller is already detached from any template.
    if (page?.hasController()) return null;

    const templateKey = page?.getTemplate();
    const defaultTemplate = defaultModels?.getDefaultPageTemplate() ?? null;

    if (templateKey && !templateKey.equals(defaultTemplate?.getKey())) {
        return await new GetPageTemplateByKeyRequest(templateKey).sendAndParse();
    }

    return defaultTemplate;
}

//
// * Reload
//

async function isRenderable(): Promise<boolean> {
    // nothing is rendered before the editor exists
    if (!view) return false;

    return isFrameRenderable(await whenPreviewSettled());
}

function isWithinSite(persisted: Content): boolean {
    const contentType = host?.getContentType();
    const typeName = contentType ? contentType.getContentTypeName() : persisted.getType();

    return !!site || host?.createsSite === true || typeName.isPageTemplate();
}

// After a load: a page that renders, or has its own page, gets a fresh model; anything else is unloaded.
async function refresh(content: Content): Promise<void> {
    const persisted = host?.getPersistedContent();
    if (!persisted) return;

    const renderable = await isRenderable();
    const hasPage = !!persisted.getPage();

    if (hasPage || (renderable && isWithinSite(persisted))) {
        updateWizardPageModel(content);
    } else if (!renderable) {
        view?.unloadPage();
    }
}

/**
 * Reloads the editor after a save and refreshes its model. The wizard awaits it
 * inside the save, while it still ignores the server events of its own requests.
 */
export async function reloadWizardPageEditorAfterSave(content: Content): Promise<void> {
    if (!view) return;

    await view.loadPage();
    await refresh(content);
}

async function reload(toggleLiveEdit: boolean, skipConfirmation: boolean | undefined): Promise<void> {
    const persisted = host?.getPersistedContent();
    if (!view || !persisted) return;

    const wasRenderable = await isRenderable();

    view.skipNextReloadConfirmation(skipConfirmation as boolean);

    if (wasRenderable !== (await view.loadPage())) {
        await refresh(persisted);
    }

    if (toggleLiveEdit) openWizardLiveEdit();
}

const debouncedReload = createDebounce((toggleLiveEdit: unknown, skipConfirmation: unknown) => {
    reload(toggleLiveEdit === true, skipConfirmation as boolean | undefined).catch(handleError);
}, RELOAD_DELAY);

/**
 * Asks for a reload of the editor. Requests within 200 ms become one, with the
 * options of the last. `toggleLiveEdit` brings the editor back into view after it.
 */
export function requestWizardPageEditorReload(toggleLiveEdit?: boolean, skipConfirmation?: boolean): void {
    debouncedReload(toggleLiveEdit, skipConfirmation);
}

//
// * Server events
//

function isCurrentTemplate(persisted: Content, id: ContentId): boolean {
    return persisted.getPage()?.getTemplate()?.toString() === id.toString();
}

function handleTemplateUpdated(persisted: Content, template: ContentSummaryAndCompareStatus): void {
    if (isCurrentTemplate(persisted, template.getContentId())) {
        requestWizardPageEditorReload(true, true);
        return;
    }

    const rendersAutomatically = !persisted.getPage();
    const hasSameRoot = template.getPath().getRootElement() === persisted.getPath().getRootElement();
    if (!rendersAutomatically || !hasSameRoot) return;

    // The updated template may be, or become, the one that renders the page.
    loadDefaultModels(site ?? null, persisted.getType())
        .then((models) => {
            const templateId = template.getId();
            const affectsPage =
                defaultTemplateId(defaultModels) === templateId || defaultTemplateId(models) === templateId;
            defaultModels = models;

            // the default models are part of the live edit model
            const current = host?.getPersistedContent();
            if (liveEditModel && current) updateWizardPageModel(current);

            if (affectsPage) requestWizardPageEditorReload(true, true);
        })
        .catch(handleError);
}

/** Another content changed: a page template, the parent site, or a content the page may show. */
export function handleWizardOtherContentUpdated(updated: ContentSummaryAndCompareStatus): void {
    const persisted = host?.getPersistedContent();
    if (!persisted) return;

    const contentId = updated.getContentId();

    if (updated.getType().isPageTemplate()) {
        handleTemplateUpdated(persisted, updated);
    } else if (updated.getType().isSite() && persisted.getPath().isDescendantOf(updated.getPath())) {
        requestWizardPageEditorReload(true, false);
    } else {
        const form = host?.getContentType()?.getForm();

        if (form) {
            ContentHelper.doContentComponentsContainId(persisted, form, contentId)
                .then((containsId) => {
                    if (containsId) requestWizardPageEditorReload();
                })
                .catch(handleError);
        }
    }

    const isParentSite = !!site && !!siteModel && site.getContentId().equals(contentId);

    if (isParentSite && !persisted.getContentId().equals(contentId)) {
        loadNearestSite(contentId)
            .then((nearest) => {
                if (nearest) updateSite(nearest);
            })
            .catch(handleError);
    }
}

/**
 * Page templates under the root of the edited content were deleted. One of them
 * may be the selected one, or the one an automatically rendered page resolves to,
 * so the default models are loaded again and the editor follows when either is hit.
 */
export function handleWizardTemplatesDeleted(deletedIds: ContentId[]): void {
    const persisted = host?.getPersistedContent();
    if (!persisted) return;

    const usesDeleted = deletedIds.some((id) => isCurrentTemplate(persisted, id));
    const previousTemplateId = defaultTemplateId(defaultModels);

    loadDefaultModels(site ?? null, persisted.getType())
        .then((models) => {
            const templateId = defaultTemplateId(models);
            const hasDefaultChanged = templateId !== previousTemplateId;

            if (hasDefaultChanged) {
                defaultModels = models;

                // the default models are part of the live edit model
                const current = host?.getPersistedContent();
                const isModelStale = defaultTemplateId(liveEditModel?.getDefaultModels()) !== templateId;
                if (liveEditModel && isModelStale && current) updateWizardPageModel(current);
            }

            if (usesDeleted || hasDefaultChanged) requestWizardPageEditorReload(true, true);
        })
        .catch((error: Error) => {
            if (usesDeleted) requestWizardPageEditorReload(true, true);

            handleError(error);
        });
}

//
// * Lifecycle
//

/** The editor exists: from now on the service drives it. */
export function attachWizardPageEditorView(next: WizardPageEditorView): void {
    view = next;
}

/** Starts the service for a wizard; the returned function stops it and drops the model. */
export function startWizardPageEditor(nextHost: WizardPageEditorHost): () => void {
    host = nextHost;
    view = undefined;
    site = undefined;
    siteModel = undefined;
    defaultModels = undefined;
    liveEditModel = undefined;

    return () => {
        debouncedReload.cancel();

        if (host === nextHost) {
            host = undefined;
            view = undefined;
        }
    };
}
