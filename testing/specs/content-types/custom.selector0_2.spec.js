/**
 * Created on 03.06.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const CustomSelectorForm = require('../../page_objects/wizardpanel/custom.selector.form');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('custom.selector.0_2.cke.spec:  tests for content with custom selctor (0:2)', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let CONTENT_NAME;
    let OPTION_1 = "Option number 1";
    let OPTION_2 = "Option number 2";
    let CUSTOM_SELECTOR = 'custom-selector0_2';

    it(`WHEN site with content types has been added THEN the site should be listed in the grid`,
        () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            return studioUtils.doAddSite(SITE).then(() => {
            }).then(() => {
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed => {
                assert.isTrue(isDisplayed, 'site should be listed in the grid');
            });
        });

    it(`GIVEN wizard with 'custom-selector' (0:2) is opened AND one option has been selected THEN option filter input should be displayed`,
        () => {
            let contentWizard = new ContentWizard();
            let customSelectorForm = new CustomSelectorForm();
            CONTENT_NAME = contentBuilder.generateRandomName("cselector");
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, CUSTOM_SELECTOR).then(() => {
                return contentWizard.typeDisplayName(CONTENT_NAME);
            }).then(() => {
                return customSelectorForm.selectOption(OPTION_1);
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                return customSelectorForm.isOptionFilterDisplayed();
            }).then(result => {
                assert.isTrue(result, "Option filter input should be displayed, because only one options is selected");
            }).then(() => {
                return customSelectorForm.getSelectedOptions();
            }).then(result => {
                studioUtils.saveScreenshot("custom_selector_swapped_options");
                assert.equal(result[0], OPTION_1, "Order of selected Options should be changed");
            });
        });

    it(`GIVEN existing content with 'custom-selector' (0:2) is opened WHEN second option has been selected THEN option filter input should not be displayed`,
        () => {
            let contentWizard = new ContentWizard();
            let customSelectorForm = new CustomSelectorForm();
            return studioUtils.openContentInWizard(CONTENT_NAME).then(() => {
                return customSelectorForm.selectOption(OPTION_2);
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                return customSelectorForm.isOptionFilterDisplayed();
            }).then(result => {
                assert.isFalse(result, "Option filter input should not be displayed, because 2 options are selected");
            }).then(() => {
                return customSelectorForm.getSelectedOptions();
            }).then(result => {
                studioUtils.saveScreenshot("custom_selector_swapped_options");
                assert.equal(result[0], OPTION_1, "Order of selected Options should be changed");
                assert.equal(result[1], OPTION_2, "Order of selected Options should be changed");
            });
        });


    it(`GIVEN wizard with 'custom-selector' is opened AND 2 options are selected WHEN options have been swapped THEN order of selected options should be changed`,
        () => {
            let customSelectorForm = new CustomSelectorForm();
            return studioUtils.openContentInWizard(CONTENT_NAME).then(() => {
                return customSelectorForm.swapOptions(OPTION_2, OPTION_1);
            }).then(() => {
                return customSelectorForm.getSelectedOptions()
            }).then(result => {
                studioUtils.saveScreenshot("custom_selector_swapped_options");
                assert.equal(result[0], OPTION_2, "Order of selected Options should be changed");
                assert.equal(result[1], OPTION_1, "Order of selected Options should be changed");
            });
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
