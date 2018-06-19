/**
 * Created on 01.02.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const contentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const imageSelectorForm = require('../page_objects/wizardpanel/imageselector.form.panel');
const siteFormPanel = require('../page_objects/wizardpanel/site.form.panel');
const siteConfiguratorDialog = require('../page_objects/wizardpanel/site.configurator.dialog');


describe('site.configurator.required.input.spec: verifies the wizard-validation when the dialog contains required input', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    it(`GIVEN existing site is opened WHEN 'edit' button on the 'selected-option-view' has been clicked THEN 'site configurator dialog should appear'`,
        () => {
            //this.bail(1);
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'test for site configurator', [appConstant.APP_WITH_CONFIGURATOR]);
            return studioUtils.doAddSite(SITE).then(()=> {
            }).then(()=> {
                studioUtils.saveScreenshot('site_with_configurator');
                return studioUtils.selectContentAndOpenWizard(SITE.displayName);
            }).then(()=> {
                return siteFormPanel.openSiteConfiguratorDialog(appConstant.APP_WITH_CONFIGURATOR);
            }).then(isDisplayed=> {
                studioUtils.saveScreenshot('site_config1');
                assert.isTrue(isDisplayed, '`site-configurator` dialog should be visible');
            });
        });

    it(`GIVEN existing site with the configurator WHEN required input in the config is empty THEN red icon should be displayed near the content`,
        () => {
            return studioUtils.findAndSelectItem(SITE.displayName).then(()=> {
                return contentBrowsePanel.isRedIconDisplayed(SITE.displayName);
            }).then(isDisplayed=> {
                studioUtils.saveScreenshot('site_conf_required_empty');
                assert.isTrue(isDisplayed, 'red icon should be present near the content!');
            });
        });

    it(`GIVEN existing site with the configurator WHEN required input in the config is empty THEN red icon should be displayed in the wizard`,
        () => {
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(()=> {
                return contentWizard.isContentInvalid();
            }).then(isRedIconDisplayed=> {
                studioUtils.saveScreenshot('site_conf_required_empty_validation');
                assert.isTrue(isRedIconDisplayed, 'red icon should be present in the wizard!');
            });
        });

    it(`GIVEN existing site with the configurator WHEN required input in the config is empty THEN the selected site-configurator option-view should be red`,
        () => {
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(()=> {
                return siteFormPanel.isSiteConfiguratorViewInvalid(appConstant.APP_WITH_CONFIGURATOR);
            }).then(isInvalid=> {
                assert.isTrue(isInvalid, 'Selected option view should be red colour because, the required input is empty');
            });
        });

    it(`GIVEN existing site with the configurator is opened WHEN required input has been filled THEN the content is getting valid`,
        () => {
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(()=> {
                return siteFormPanel.openSiteConfiguratorDialog(appConstant.APP_WITH_CONFIGURATOR);
            }).then(()=> {
                return siteConfiguratorDialog.typeInTextInput('test');
            }).then(()=> {
                return siteConfiguratorDialog.clickOnApplyButton();
            }).then(()=> {
                return siteFormPanel.waitUntilSiteConfiguratorViewValid(appConstant.APP_WITH_CONFIGURATOR);
            }).then(isValid=> {
                studioUtils.saveScreenshot('site_conf_is_getting_valid');
                assert.isTrue(isValid, 'Selected option view should be valid because, the required input is not empty');
            }).then(()=> {
                assert.eventually.isFalse(contentWizard.isContentInvalid(), 'the site is getting valid, red icon is getting not visible');
            })
        });
    it(`GIVEN existing site with the configurator WHEN required input in the config is filled THEN the site should be valid in the grid`,
        () => {
            return studioUtils.findAndSelectItem(SITE.displayName).then(()=> {
                return contentBrowsePanel.isRedIconDisplayed(SITE.displayName);
            }).then(isDisplayed=> {
                studioUtils.saveScreenshot('site_conf_required_input_filled');
                assert.isFalse(isDisplayed, 'red icon should be present near the content!');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(()=> {
        return console.log('specification is starting: ' + this.title);
    });
});
