/**
 * Created on 01.02.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const SiteFormPanel = require('../page_objects/wizardpanel/site.form.panel');
const SiteConfiguratorDialog = require('../page_objects/wizardpanel/site.configurator.dialog');

describe('site.configurator.required.input.spec: verifies the wizard-validation when the dialog contains required input', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    it(`GIVEN existing site is opened WHEN 'edit' button on the 'selected-option-view' has been clicked THEN 'site configurator dialog should appear'`,
        () => {
            let siteFormPanel = new SiteFormPanel();
            let siteConfiguratorDialog = new SiteConfiguratorDialog();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'test for site configurator', [appConstant.APP_WITH_CONFIGURATOR]);
            return studioUtils.doAddSite(SITE).then(() => {
            }).then(() => {
                studioUtils.saveScreenshot('site_with_configurator');
                return studioUtils.selectContentAndOpenWizard(SITE.displayName);
            }).then(() => {
                return siteFormPanel.openSiteConfiguratorDialog(appConstant.APP_WITH_CONFIGURATOR);
            }).then(isDisplayed => {
                studioUtils.saveScreenshot('site_config1');
                assert.isTrue(isDisplayed, '`site-configurator` dialog should be visible');
            }).then(() => {
                //verifies issue#427
                return assert.eventually.isTrue(siteConfiguratorDialog.isFocused(`//input[contains(@name,'trackingId')]`));
            });
        });

    it(`GIVEN existing site with the configurator WHEN required input in the config is empty THEN red icon should be displayed near the content`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
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
        () => {
            let siteFormPanel = new SiteFormPanel();
            let contentWizard = new ContentWizard();
            let siteConfiguratorDialog = new SiteConfiguratorDialog();
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                return siteFormPanel.openSiteConfiguratorDialog(appConstant.APP_WITH_CONFIGURATOR);
            }).then(() => {
                return siteConfiguratorDialog.typeInTextInput('test');
            }).then(() => {
                return siteConfiguratorDialog.clickOnApplyButton();
            }).then(() => {
                return siteFormPanel.waitUntilSiteConfiguratorViewValid(appConstant.APP_WITH_CONFIGURATOR);
            }).then(isValid => {
                studioUtils.saveScreenshot('site_conf_is_getting_valid');
                assert.isTrue(isValid, 'Selected option view should be valid because, the required input is not empty');
            }).then(() => {
                return assert.eventually.isFalse(contentWizard.isContentInvalid(),
                    'the site is getting valid, red icon is getting not visible');
            })
        });

    it(`GIVEN existing site with the configurator WHEN required input in the config is filled THEN the site should be valid in the grid`,
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
