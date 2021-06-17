/**
 * Created on 01.02.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const SiteFormPanel = require('../page_objects/wizardpanel/site.form.panel');
const SiteConfiguratorDialog = require('../page_objects/wizardpanel/site.configurator.dialog');

describe('site.configurator.required.input.spec: verifies wizard validation when the dialog contains required input', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    it(`GIVEN existing site is opened WHEN 'edit' button in the 'selected-option-view' has been clicked THEN 'site configurator dialog should appear'`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let siteConfiguratorDialog = new SiteConfiguratorDialog();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'test for site configurator', [appConstant.APP_WITH_CONFIGURATOR]);
            await studioUtils.doAddSite(SITE, true);
            //1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            //2. Click on Edit icon and open Site Configurator Dialog:
            await siteFormPanel.openSiteConfiguratorDialog(appConstant.APP_WITH_CONFIGURATOR);
            studioUtils.saveScreenshot('site_configurator_1');
            //3. Verify that this input is focused by default( issue#427)
            let isElementFocused = await siteConfiguratorDialog.isFocused(`//input[contains(@name,'trackingId')]`);
            assert.isTrue(isElementFocused, "Tracking ID input should be focused");
        });

    it(`GIVEN existing site with the configurator WHEN required input in the config is empty THEN red icon should be displayed near the content`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
            //Verify that red icon is displayed in Browse Panel:
            let isDisplayed = await contentBrowsePanel.isRedIconDisplayed(SITE.displayName);
            studioUtils.saveScreenshot('site_conf_required_empty');
            assert.isTrue(isDisplayed, 'red icon should be present near the content!');
        });

    it(`GIVEN existing site with the configurator WHEN required input in the config is empty THEN red icon should be displayed in the wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            let isRedIconDisplayed = await contentWizard.isContentInvalid();
            studioUtils.saveScreenshot('site_conf_required_empty_validation');
            assert.isTrue(isRedIconDisplayed, 'red icon should be present in the wizard!');
        });

    it(`GIVEN existing site with the configurator WHEN required input in the config is empty THEN the selected application-configurator option-view should be red`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            let isInvalid = await siteFormPanel.isSiteConfiguratorViewInvalid(appConstant.APP_WITH_CONFIGURATOR);
            assert.isTrue(isInvalid, 'Selected option view should be red colour because, the required input is empty');
        });

    it(`GIVEN existing site with the configurator is opened WHEN required input has been filled THEN the content is getting valid`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let contentWizard = new ContentWizard();
            let siteConfiguratorDialog = new SiteConfiguratorDialog();
            //1. Open the site and open Site Configurator Dialog:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await siteFormPanel.openSiteConfiguratorDialog(appConstant.APP_WITH_CONFIGURATOR);
            //2. Fill the required input:
            await siteConfiguratorDialog.typeInTextInput('test');
            //3. Click on 'Apply' button and close the dialog:
            await siteConfiguratorDialog.clickOnApplyButton();
            //4. Verify that SiteConfiguratorView gets valid:
            await siteFormPanel.waitUntilSiteConfiguratorViewValid(appConstant.APP_WITH_CONFIGURATOR);
            studioUtils.saveScreenshot('site_conf_gets_valid');
            //5. Verify that red icon gets not visible:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isFalse(isInvalid, "red icon should be not visible");
        });

    //Verifies: Site/Provider configurator -Apply button should not submit invalid config form (#3097).
    it("GIVEN existing site with the configurator is opened WHEN required text input has been cleared THEN 'Apply' button gets disabled",
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let siteConfiguratorDialog = new SiteConfiguratorDialog();
            //1. Open the site and open Site Configurator Dialog:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await siteFormPanel.openSiteConfiguratorDialog(appConstant.APP_WITH_CONFIGURATOR);
            //2. Clear the required text input:
            await siteConfiguratorDialog.typeInTextInput("");
            //3. Verify that 'Apply' button gets disabled
            await siteConfiguratorDialog.waitForApplyButtonDisabled();
        });

    it(`GIVEN existing site with the configurator WHEN required input in the config is filled THEN the site should be valid in Browse Panel`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
            let isDisplayed = await contentBrowsePanel.isRedIconDisplayed(SITE.displayName);
            studioUtils.saveScreenshot('site_conf_required_input_filled');
            assert.isFalse(isDisplayed, 'red icon should be present near the content!');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
