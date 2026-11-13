import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { ContentSummaryAndCompareStatus } from '../../../../app/content/ContentSummaryAndCompareStatus';
import type { Site } from '../../../../app/content/Site';
import { EditContentEvent } from '../../../../app/event/EditContentEvent';
import { CreatePageTemplateRequest } from '../../../../app/wizard/CreatePageTemplateRequest';
import { PageState } from '../../../../app/wizard/page/PageState';
import { PageEventsManager } from '../../../../app/wizard/PageEventsManager';
import { handleError } from '../../../shared/notifications';

//
// * Wizard Page Template Commands
//
// Saves the page of the edited content as a page template of its site and opens
// the template for editing.
//

type TemplateSource = {
    content: ContentSummary;
    site: Site | null;
};

let source: TemplateSource | undefined;
let listening = false;

/** Sets the content whose page becomes the template; the page editor reports it with every new model. */
export function setWizardPageTemplateSource(content: ContentSummary, site: Site | null): void {
    source = { content, site };

    if (!listening) {
        listening = true;
        // The page editor's context menu asks for the template through this event.
        PageEventsManager.get().onPageSaveAsTemplate(saveWizardPageAsTemplate);
    }
}

export function saveWizardPageAsTemplate(): void {
    const page = PageState.getState();
    if (!source || !page) return;

    const { content, site } = source;

    new CreatePageTemplateRequest()
        .setController(page.getController())
        .setRegions(page.getRegions())
        .setConfig(page.getConfig())
        .setDisplayName(content.getDisplayName())
        .setSite(site ? site.getPath() : null)
        .setSupports(content.getType())
        .setName(content.getName())
        .sendAndParse()
        .then((template) => new EditContentEvent([ContentSummaryAndCompareStatus.fromContentSummary(template)]).fire())
        .catch(handleError);
}
