/**
 * Created on 02.02.2024
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const SiteFormPanel = require('../page_objects/wizardpanel/site.form.panel');
const appConst = require('../libs/app_const');
const PageComponentsWizardStepForm = require('../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');

describe('remove_app.in.site.with.descriptor.spec: replace an application and check the selected controller', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const APP_1 = appConst.TEST_APPS_NAME.SIMPLE_SITE_APP;
    const APP_2 = appConst.TEST_APPS_NAME.MY_FIRST_APP
    const CONTROLLER_APP_1 = 'default';
    const CONTROLLER_APP_2 = 'Country List'

    it("Precondition: new site with a page controller should be added",
        async () => {
            let applications = [APP_1];
            let displayName = appConst.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'test site1', applications, CONTROLLER_APP_1);
            await studioUtils.doAddSite(SITE);
        });

    it(`WHEN the selected application has been replaced with another application THEN controller from the first application remains visible in PCV AND we can reset the controller`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let contentWizard = new ContentWizard();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            // 1. Existing site is opened:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. remove the application in app-selector:
            await siteFormPanel.removeApplication(APP_1);
            // 3. Select another application:
            await siteFormPanel.filterOptionsAndSelectApplication(APP_2);
            // 4. the site should be automatically saved after removing the selected options:
            await contentWizard.waitForNotificationMessage();
            await contentWizard.waitForSaveButtonDisabled();
            // 5. Verify that another application is selected in applications selector-dropdown:
            let apps = await siteFormPanel.getSelectedAppDisplayNames();
            assert.equal(apps[0], APP_2, 'application should be updated in the form');
            // 6. Verify that the controller from the previous application remains visible in PCV:
            await pageComponentsWizardStepForm.openMenu(CONTROLLER_APP_1);
            await pageComponentsWizardStepForm.selectMenuItem(['Reset']);
            await studioUtils.saveScreenshot('app_replaced_in_site_wizard');
            // 7. Verify that 'Controller Options Filter' input gets visible in the wizard-page:
            await contentWizard.waitForControllerOptionFilterInputVisible();
            // 8 Verify that PCV gets not visible after the resetting:
            await pageComponentsWizardStepForm.waitForNotDisplayed();
            // 9. 'Save' button should be disabled after the resetting:
            await contentWizard.waitForSaveButtonDisabled();
            // 10 'Preview' button gets hidden:
            await contentWizard.waitForPreviewButtonNotDisplayed();
            // 11. Select the page descriptor from the new selected application
            await contentWizard.selectPageDescriptor(CONTROLLER_APP_2);
            // 12. Verify that Preview button gets displayed again:
            await contentWizard.waitForPreviewButtonDisplayed();
            // 13. PCV gets visible and contains items from the second application:
            await pageComponentsWizardStepForm.waitForComponentItemDisplayed(CONTROLLER_APP_2);
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/7390
    // Site Wizard - PCV overlaps applications dropdown list #7390
    it(`GIVEN app selector has been expanded WHEN checkbox for the selected app has been unchecked THEN the selected option should not be displayed in the form`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            // 1. Existing site is opened:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. click on dropdown handle in app-selector:
            await siteFormPanel.clickOnDropdownHandle()
            // 3. unselect the checkbox in dropdown-list another application:
            await siteFormPanel.clickOnCheckboxInDropdownByDisplayName(APP_2);
            // 4. Verify that OK(apply selection) gets visible
            await siteFormPanel.waitForApplyAppSelectionButtonDisplayed();
            // 5. Click on the OK button
            await siteFormPanel.clickOnApplySelectionButtonInApplications();
            // 6. Verify that the selected option is removed in the form:
            let selectedApps = await siteFormPanel.getSelectedAppDisplayNames();
            assert.equal(selectedApps.length, 0, "App selected options view should be empty");
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
