/**
 * Created on 01.02.2018.  updated on 19.06.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const SiteFormPanel = require('../page_objects/wizardpanel/site.form.panel');
const SiteConfiguratorReqInputDialog = require('../page_objects/wizardpanel/site_configurator/site.configurator.req.input');
const appConst = require('../libs/app_const');

describe('site.configurator.required.input.spec: verifies wizard validation when the dialog contains required input', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const APP_WITH_REQ_TEXT_INPUT = appConst.TEST_APPS_NAME.TEST_ADFS_PROVIDER_APP;

    it(`GIVEN existing site is opened WHEN 'edit' button in the 'selected-option-view' has been clicked THEN 'site configurator dialog should appear'`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let siteConfiguratorDialog = new SiteConfiguratorReqInputDialog();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, null, [APP_WITH_REQ_TEXT_INPUT]);
            await studioUtils.doAddSite(SITE);
            // 1. Open the  site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on Edit icon and open Site Configurator Dialog:
            await siteFormPanel.openSiteConfiguratorDialog(APP_WITH_REQ_TEXT_INPUT);
            let message = await siteConfiguratorDialog.getValidationMessage();
            assert.equal(message, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, "This field is required - Validation message should be displayed");
            await studioUtils.saveScreenshot('site_configurator_1');

            // 3. Verify that this input is focused by default( issue#427)
            //let isElementFocused = await siteConfiguratorDialog.isFocused(`//input[contains(@name,'trackingId')]`);
            //assert.ok(isElementFocused, "Tracking ID input should be focused");
        });

    it(`GIVEN existing site with the configurator WHEN required input in the config is empty THEN The content should be marked with the red icon`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
            // Verify that red icon is displayed in Browse Panel:
            let isDisplayed = await contentBrowsePanel.isRedIconDisplayed(SITE.displayName);
            await studioUtils.saveScreenshot('site_conf_required_empty');
            assert.ok(isDisplayed, 'The content should be marked with a red icon!');
        });

    //https://github.com/enonic/app-contentstudio/issues/10892
    // Missing invalid icon when required Site Configurator fields are empty
    //TODO
    it.skip(`GIVEN existing site with the configurator WHEN required input in the config is empty THEN the selected application-configurator option-view should be red`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let contentWizard = new ContentWizard();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            let isInvalid = await siteFormPanel.isSiteConfiguratorViewInvalid(APP_WITH_REQ_TEXT_INPUT);
            assert.ok(isInvalid, 'Selected option view should be red colour because, the required input is empty');

            let isRedIconDisplayed = await contentWizard.isContentInvalid();
            await studioUtils.saveScreenshot('site_conf_required_empty_validation');
            assert.ok(isRedIconDisplayed, 'red icon should be present in the wizard-toolbar!');
        });

    it(`GIVEN site configurator with required input is opened WHEN required input has been filled in THEN the site gets valid`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let contentWizard = new ContentWizard();
            let siteConfiguratorReqInputDialog = new SiteConfiguratorReqInputDialog();
            // 1. Open the site and open Site Configurator Dialog:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await siteFormPanel.openSiteConfiguratorDialog(APP_WITH_REQ_TEXT_INPUT);
            // 2. Fill the required input:
            await siteConfiguratorReqInputDialog.clickInTrackingIdInput();
            await siteConfiguratorReqInputDialog.typeInTextInTrackingIdInput('test');
            // 3. Click on 'Apply' button and close the dialog:
            await siteConfiguratorReqInputDialog.clickOnApplyButton();
            // 4. Verify that SiteConfiguratorView gets valid:
            await siteFormPanel.waitUntilSiteConfiguratorViewValid(APP_WITH_REQ_TEXT_INPUT);
            await studioUtils.saveScreenshot('site_conf_gets_valid');
            // 5. Verify that red icon gets not visible:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "red icon should not be visible in the wizard toolbar");
        });

    it(`WHEN the required input is filled in in the configurator THEN the site should be valid in Browse Panel`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
            let isDisplayed = await contentBrowsePanel.isRedIconDisplayed(SITE.displayName);
            await studioUtils.saveScreenshot('site_conf_required_input_filled');
            assert.ok(isDisplayed === false, 'The content should not be marked with a red icon!');
        });

    // Verifies: Site/Provider configurator -Apply button should not submit invalid config form (#3097).
    it("GIVEN the site configurator is opened WHEN required text input has been cleared THEN 'Apply' button gets disabled in the modal dialog",
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let secondAppSiteConfiguratorDialog = new SiteConfiguratorReqInputDialog();
            // 1. Open the site and open Site Configurator Dialog:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await siteFormPanel.openSiteConfiguratorDialog(APP_WITH_REQ_TEXT_INPUT);
            // 2. Clear the required text input in the configurator dialog:
            await secondAppSiteConfiguratorDialog.clearTrackingIdInput();
            // 3. Verify that 'Apply' button gets disabled
            await secondAppSiteConfiguratorDialog.waitForApplyButtonDisabled();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
