/**
 * Created on 28.06.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const PageComponentView = require('../../page_objects/wizardpanel/liveform/page.components.view');
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');
const SiteForm = require('../../page_objects/wizardpanel/site.form.panel');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');

describe('template.config.spec: template config should be displayed in the Inspection Panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);

    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const DISPLAY_NAME = contentBuilder.generateRandomName('site');
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;

    // Verify issue - Page Component View modal dialog does not appear after selecting a controller #6466
    it(`GIVEN Live Edit frame is maximized WHEN controller has been selected THEN  Page Component View modal dialog should appear`,
        async () => {
            let contentWizardPanel = new ContentWizardPanel();
            let pageInspectionPanel = new PageInspectionPanel();
            let siteForm = new SiteForm();
            let pageComponentView = new PageComponentView();
            // 1. Open new site-wizard
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizardPanel.typeDisplayName(DISPLAY_NAME);
            await siteForm.addApplications([appConst.APP_CONTENT_TYPES]);
            // 2. Expand the Live Edit frame
            await contentWizardPanel.clickOnMinimizeLiveEditToggler();
            // 3. Select a page descriptor:
            await pageInspectionPanel.selectPageTemplateOrController(CONTROLLER_NAME);
            // 4. Verify that the modal dialog is loaded:
            await pageComponentView.waitForLoaded();
            let result = await pageComponentView.getPageComponentsDisplayName();
            assert.ok(result.includes('main region'), 'main region item should be displayed in the modal dialog');
            assert.ok(result.includes(appConst.LIVE_EDIT.REGION_MAIN_DISPLAY_NAME), 'Main item should be displayed in the modal dialog');
        });

    it(`GIVEN existing site has been opened WHEN 'Save as Template' menu item has been clicked THEN new template page with 'Page Component View' step should be loaded `,
        async () => {
            let contentWizardPanel = new ContentWizardPanel();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            // 1. Open new site-wizard
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            // 2. Verify that the wizard step is loaded:
            await pageComponentsWizardStepForm.waitForLoaded();
            // 3. Open the menu:
            await pageComponentsWizardStepForm.openMenu(CONTROLLER_NAME);
            // 4. Click on 'Save as Template' menu item
            await pageComponentsWizardStepForm.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_TEMPLATE);
            await contentWizardPanel.pause(500);
            // 5. switch to the next tab:
            await studioUtils.doSwitchToNextTab();
            // 6. Verify that 'Page Component wizard' step is present in the page-template wizard:
            await contentWizardPanel.waitForOpened();
            let result = await pageComponentsWizardStepForm.getPageComponentsDisplayName();
            assert.ok(result.includes('main region'), 'main region item should be displayed in the modal dialog');
            assert.ok(result.includes('Main'), 'Main item should be displayed in the modal dialog');
        });

    // Verify issue https://github.com/enonic/app-contentstudio/issues/6486
    // Page component dialog/step remains visible after reverting a site with template #6486
    it(`GIVEN existing site has been opened WHEN the previous version has been reverted THEN 'Page Component View' step should not be displayed`,
        async () => {
            let contentWizard = new ContentWizardPanel();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let detailsPanel = new WizardContextPanel();
            let versionsWidget = new WizardVersionsWidget();
            let pageComponentViewDialog = new PageComponentView();
            // 1. Open new site-wizard
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            // 2. Verify that the wizard step is loaded:
            await pageComponentsWizardStepForm.waitForLoaded();
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Open Context panel:
            await contentWizard.openContextWindow();
            // 4. Open versions widget:
            await detailsPanel.openVersionHistory();
            await versionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 1);
            // 5. Revert the version without a controller:
            await versionsWidget.clickOnRestoreButton();
            await versionsWidget.pause(1000);
            // 6. Verify that PCV is not visible now:
            await studioUtils.saveScreenshot('pcv_hidden_after_reverting');
            await pageComponentViewDialog.waitForNotDisplayed();
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await versionsWidget.pause(1000);
            await pageComponentsWizardStepForm.waitForNotDisplayed();
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
