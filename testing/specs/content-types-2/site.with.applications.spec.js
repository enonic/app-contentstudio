/**
 * Created on 10.01.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const appConst = require('../../libs/app_const');

describe('site.with.applications.spec: swaps applications in the site-form', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    it(`GIVEN wizard for new site is opened WHEN show help texts button has been pressed THEN help text for app-selector gets visible`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let contentWizard = new ContentWizard();
            // 1. Open new site-wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            // 2. Verify that the help text for Applications selector is not visible by default:
            await siteFormPanel.waitForHelpTextInApplicationsSelectorNotDisplayed();
            // 3. Click on show/hide Help Texts toggler in the wizard toolbar:
            await contentWizard.clickOnHelpTextsToggler();
            // 4. Verify that expected help text gets visible in the site form:
            let actualHelpText = await siteFormPanel.getHelpTextsInApplicationsSelector();
            assert.equal(actualHelpText[0], "Configure applications used by this site", "Expected help message should be displayed");
        });

    it(`GIVEN wizard for new site is opened AND two applications have been selected WHEN the applications have been swapped THEN new order of applications should be displayed`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let contentWizard = new ContentWizard();
            let applications = [appConst.TEST_APPS_NAME.FIRST_SELENIUM_APP, appConst.MY_FIRST_APP];
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'test site', applications);
            // 1. New site-wizard is opened:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeDisplayName(SITE.displayName);
            // 2. two applications have been selected:
            await siteFormPanel.addApplications(applications);
            // 3. the site should be automatically saved:
            await contentWizard.waitForSaveButtonDisabled();
            await contentWizard.pause(2000);
            let apps = await siteFormPanel.getSelectedAppDisplayNames();
            assert.equal(apps[0], appConst.TEST_APPS_NAME.FIRST_SELENIUM_APP, 'Expected application be first from the top');
            // 4. two applications have been selected
            await siteFormPanel.swapApplications(appConst.TEST_APPS_NAME.FIRST_SELENIUM_APP, appConst.MY_FIRST_APP);
            // 5. Verify that the applications are swapped
            apps = await siteFormPanel.getSelectedAppDisplayNames();
            assert.equal(apps[0], appConst.MY_FIRST_APP, 'Applications should be swapped');
            // 6. Verify that 'Save' button gets enabled:
            await contentWizard.waitAndClickOnSave();
        });

    it(`GIVEN existing site with 2 apps is opened WHEN one application has been removed THEN single application remains in the form`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let contentWizard = new ContentWizard();
            // 1. Existing site is opened:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. One application has been removed:
            await siteFormPanel.removeApplication(appConst.TEST_APPS_NAME.FIRST_SELENIUM_APP);
            // 3. the site should be automatically saved after removing the selected options:
            await contentWizard.waitForNotificationMessage();
            await contentWizard.waitForSaveButtonDisabled();
            // 4. Verify the selected option in applications selector:
            let apps = await siteFormPanel.getSelectedAppDisplayNames();
            assert.equal(apps[0], appConst.MY_FIRST_APP, 'Expected application should be displayed in the form');
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
