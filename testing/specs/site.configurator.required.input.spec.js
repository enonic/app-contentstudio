/**
 * Created on 01.02.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const SiteFormPanel = require('../page_objects/wizardpanel/site.form.panel');
const SiteConfiguratorDialog = require('../page_objects/wizardpanel/site.configurator.dialog');
const SecondAppSiteConfiguratorDialog = require('../page_objects/wizardpanel/site_configurator/second.app.site.configurator');
const appConst = require('../libs/app_const');

describe('site.configurator.required.input.spec: verifies wizard validation when the dialog contains required input', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;

    it(`GIVEN wizard for new site has been opened WHEN an application that does not have controllers has been selected THEN Save button remains enabled`,
        async () => {
            let contentWizard = new ContentWizard();
            let siteFormPanel = new SiteFormPanel();
            // 1. Open site-wizard
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeDisplayName(appConst.generateRandomName('site'));
            // 2. Select an application that does not have controllers:
            await siteFormPanel.filterOptionsAndSelectApplication(appConst.APP_WITH_CONFIGURATOR);
            await contentWizard.pause(1000);
            await studioUtils.saveScreenshot('site_app_has_no_controllers');
            // 3. Verify that Save button remains enabled after selecting this application:
            await contentWizard.waitForSaveButtonEnabled();
        });

    it(`GIVEN existing site is opened WHEN 'edit' button in the 'selected-option-view' has been clicked THEN 'site configurator dialog should appear'`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let siteConfiguratorDialog = new SiteConfiguratorDialog();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'test for site configurator', [appConst.APP_WITH_CONFIGURATOR]);
            await studioUtils.doAddSite(SITE, true);
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on Edit icon and open Site Configurator Dialog:
            await siteFormPanel.openSiteConfiguratorDialog(appConst.APP_WITH_CONFIGURATOR);
            await studioUtils.saveScreenshot('site_configurator_1');
            // 3. Verify that this input is focused by default( issue#427)
            let isElementFocused = await siteConfiguratorDialog.isFocused(`//input[contains(@name,'trackingId')]`);
            assert.ok(isElementFocused, "Tracking ID input should be focused");
        });

    it(`GIVEN existing site with the configurator WHEN required input in the config is empty THEN red icon should be displayed near the content`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
            // Verify that red icon is displayed in Browse Panel:
            let isDisplayed = await contentBrowsePanel.isRedIconDisplayed(SITE.displayName);
            await studioUtils.saveScreenshot('site_conf_required_empty');
            assert.ok(isDisplayed, 'red icon should be present near the content!');
        });

    it(`GIVEN existing site with the configurator WHEN required input in the config is empty THEN red icon should be displayed in the wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            let isRedIconDisplayed = await contentWizard.isContentInvalid();
            await studioUtils.saveScreenshot('site_conf_required_empty_validation');
            assert.ok(isRedIconDisplayed, 'red icon should be present in the wizard!');
        });

    it(`GIVEN existing site with the configurator WHEN required input in the config is empty THEN the selected application-configurator option-view should be red`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            let isInvalid = await siteFormPanel.isSiteConfiguratorViewInvalid(appConst.APP_WITH_CONFIGURATOR);
            assert.ok(isInvalid, 'Selected option view should be red colour because, the required input is empty');
        });

    it(`GIVEN existing site with red configurator is opened WHEN required input has been filled THEN the content gets valid`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let contentWizard = new ContentWizard();
            let secondAppSiteConfiguratorDialog = new SecondAppSiteConfiguratorDialog();
            // 1. Open the site and open Site Configurator Dialog:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await siteFormPanel.openSiteConfiguratorDialog(appConst.APP_WITH_CONFIGURATOR);
            // 2. Fill the required input:
            await secondAppSiteConfiguratorDialog.typeInTextInTrackingIdInput('test');
            // 3. Click on 'Apply' button and close the dialog:
            await secondAppSiteConfiguratorDialog.clickOnApplyButton();
            // 4. Verify that SiteConfiguratorView gets valid:
            await siteFormPanel.waitUntilSiteConfiguratorViewValid(appConst.APP_WITH_CONFIGURATOR);
            await studioUtils.saveScreenshot('site_conf_gets_valid');
            // 5. Verify that red icon gets not visible:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "red icon should be not visible");
        });

    // Verifies: Site/Provider configurator -Apply button should not submit invalid config form (#3097).
    it("GIVEN existing site with the configurator is opened WHEN required text input has been cleared THEN 'Apply' button gets disabled",
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let secondAppSiteConfiguratorDialog = new SecondAppSiteConfiguratorDialog();
            // 1. Open the site and open Site Configurator Dialog:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await siteFormPanel.openSiteConfiguratorDialog(appConst.APP_WITH_CONFIGURATOR);
            // 2. Clear the required text input:
            await secondAppSiteConfiguratorDialog.typeInTextInTrackingIdInput("");
            // 3. Verify that 'Apply' button gets disabled
            await secondAppSiteConfiguratorDialog.waitForApplyButtonDisabled();
        });

    it(`GIVEN existing site with the configurator WHEN the required input is filled in  THEN the site should be valid in Browse Panel`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
            let isDisplayed = await contentBrowsePanel.isRedIconDisplayed(SITE.displayName);
            await studioUtils.saveScreenshot('site_conf_required_input_filled');
            assert.ok(isDisplayed === false, 'red icon should not be present near the content!');
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
