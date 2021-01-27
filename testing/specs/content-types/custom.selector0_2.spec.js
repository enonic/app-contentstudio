/**
 * Created on 03.06.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const CustomSelectorForm = require('../../page_objects/wizardpanel/custom.selector.form');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('custom.selector.0_2.spec:  tests for content with custom selector (0:2)', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let CONTENT_NAME;
    let OPTION_1 = "Option number 1";
    let OPTION_2 = "Option number 2";
    let CUSTOM_SELECTOR = 'custom-selector0_2';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard with 'custom-selector' (0:2) is opened AND one option has been selected THEN option filter input should be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let customSelectorForm = new CustomSelectorForm();
            CONTENT_NAME = contentBuilder.generateRandomName("cselector");
            //1. Wizard for Custom-Selector content is opened
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, CUSTOM_SELECTOR);
            await contentWizard.typeDisplayName(CONTENT_NAME);
            //2. One option has been selected:
            await customSelectorForm.selectOption(OPTION_1);
            await contentWizard.waitAndClickOnSave();
            let isDisplayed = await customSelectorForm.isOptionFilterDisplayed();
            assert.isTrue(isDisplayed, "Option filter input should be displayed, because just one options is selected");
            let options = await customSelectorForm.getSelectedOptions();
            studioUtils.saveScreenshot("custom_selector_1_option");
            assert.equal(options[0], OPTION_1, "Expected option should be selected");
        });

    it("GIVEN existing content with 'custom-selector' (0:2) is opened WHEN second option has been selected THEN option filter input gets not visible",
        async () => {
            let contentWizard = new ContentWizard();
            let customSelectorForm = new CustomSelectorForm();
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            //1. Select the second option:
            await customSelectorForm.selectOption(OPTION_2);
            await contentWizard.waitAndClickOnSave();
            //2. option filter input gets not visible:
            let isDisplayed = await customSelectorForm.isOptionFilterDisplayed();
            assert.isFalse(isDisplayed, "Option filter input gets not visible, because 2 options are selected");
            let selectedOptions = await customSelectorForm.getSelectedOptions();
            studioUtils.saveScreenshot("custom_selector_2_options");
            assert.equal(selectedOptions[0], OPTION_1, "expected option should be selected");
            assert.equal(selectedOptions[1], OPTION_2, "expected option should be selected");
        });

    //verifies "Drag'n'Drop of selected options in Custom selector is not working #440"
    it(`GIVEN wizard with 'custom-selector' is opened AND 2 options are selected WHEN options have been swapped THEN order of selected options should be changed`,
        async () => {
            let customSelectorForm = new CustomSelectorForm();
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            //Open the content and swap options:
            await customSelectorForm.swapOptions(OPTION_2, OPTION_1);
            let options = await customSelectorForm.getSelectedOptions();
            studioUtils.saveScreenshot("custom_selector_swapped_options");
            assert.equal(options[0], OPTION_2, "Order of selected Options should be changed");
            assert.equal(options[1], OPTION_1, "Order of selected Options should be changed");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
