/**
 * Created on 14.02.2023
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const LiveFormPanel = require('../../page_objects/wizardpanel/liveform/live.form.panel');
const appConst = require('../../libs/app_const');
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');

describe('page.component.view.layout.items.spec - tests for page component view items', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let CONTROLLER_NAME = 'main region';
    const LAYOUT_NAME = "3-col";

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN 3-column layout has been inserted in new site WHEN text has been inserted in left and center layout's regions THEN expected items should be displayed in the Page Component View`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let liveFormPanel = new LiveFormPanel();
            let textComponentCke = new TextComponentCke();
            // 1. reopen the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Maximize the Live Edit:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert the Layout component (3-column):
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Layout']);
            await liveFormPanel.selectLayoutByDisplayName(LAYOUT_NAME);
            await contentWizard.waitForNotificationMessage();
            // 4. Insert text component in the left layout's region
            await pageComponentView.openMenu('left');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.typeTextInCkeEditor('text left');
            // 5. Save the site: (layout get collapsed after the saving )
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('page_component_updated_1');
            // 6. Do not need to expand the layouts items, because the text component is selected in Live Edit now:
            // 7. Insert 'text component' in the left layout's region
            await pageComponentView.openMenu('center');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.typeTextInCkeEditor('text center');
            // 8. Save the site:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('page_component_updated_2');
            // 10. Verify that 'right region' item is displayed in Page Component View
            // TODO (uncomment it) workaround - expand the collapsed row with the layout component:
            // await pageComponentView.waitForItemDisplayed('right');
        });

    // Verify issue - Page Components view and step remain visible after reverting versions #6468
    it(`GIVEN existing site has been opened WHEN 'Created' version has been reverted THEN 'Page Component View' step should not be displayed`,
        async () => {
            let contentWizard = new ContentWizardPanel();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let detailsPanel = new WizardDetailsPanel();
            let versionsWidget = new WizardVersionsWidget();
            let pageComponentViewDialog = new PageComponentView();
            // 1. Open new site-wizard
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Verify that the wizard step is loaded:
            await pageComponentsWizardStepForm.waitForLoaded();
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Open details panel:
            await contentWizard.openDetailsPanel();
            // 4. Open versions widget:
            await detailsPanel.openVersionHistory();
            await versionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED);
            // 5. Revert the 'Created' version:
            await versionsWidget.clickOnRevertButton();
            await versionsWidget.pause(2000);
            await studioUtils.saveScreenshot('components_view_site_reverted');
            await pageComponentsWizardStepForm.waitForNotDisplayed();
            await pageComponentViewDialog.waitForNotDisplayed();
            await contentWizard.clickOnPageEditorToggler();
            // 6. Verify the note in  Live Form panel
            let message = await contentWizard.getMessageInLiveFormPanel();
            assert.equal(message, 'No page controllers found', 'Expected message should be displayed in the live form panel');
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
