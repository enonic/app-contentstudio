/**
 * Created on 03.06.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const CustomSelectorForm = require('../../page_objects/wizardpanel/custom.selector.form');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('custom.selector0_2.spec:  tests for content with custom selector (0:2)', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let CONTENT_NAME;
    const CONTENT_NAME_2 = appConst.generateRandomName('cselector');
    const OPTION_1 = 'Option number 1';
    const OPTION_2 = 'Option number 2';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    // Verifies Custom Selector incorrectly loads options #3407
    // https://github.com/enonic/app-contentstudio/issues/3407
    it(`GIVEN wizard with 'custom-selector' (0:2) is opened WHEN non existing option has been typed THEN 'No matching items' should be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let customSelectorForm = new CustomSelectorForm();
            CONTENT_NAME = contentBuilder.generateRandomName('cselector');
            // 1. Wizard for Custom-Selector content is opened
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CUSTOM_SELECTOR_0_2);
            await contentWizard.typeDisplayName(CONTENT_NAME);
            // 2. non-existing option has been typed in the Options Filter Input
            await customSelectorForm.typeTextInOptionsFilterInput('test');
            // 3. Verify that 'No matching items' is displayed
            await customSelectorForm.waitForEmptyOptionsMessage();
            await studioUtils.saveScreenshot('custom_sel_empty');
            // 4. Press Backspace button and clear the input
            await studioUtils.doPressBackspace();
            await studioUtils.doPressBackspace();
            await studioUtils.doPressBackspace();
            await studioUtils.doPressBackspace();
            await customSelectorForm.pause(500);
            // 5. Verify that 2 options are loaded after clearing the input:
            await studioUtils.saveScreenshot('custom_sel_empty');
            let results = await customSelectorForm.getDropDownListOptions();
            assert.equal(results.length, 2, "Two options should be present in the options list");
        });

    it(`GIVEN wizard with 'custom-selector' (0:2) is opened WHEN one option has been selected THEN option filter input should be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let customSelectorForm = new CustomSelectorForm();
            CONTENT_NAME = contentBuilder.generateRandomName('cselector');
            // 1. Wizard for Custom-Selector content is opened
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CUSTOM_SELECTOR_0_2);
            await contentWizard.typeDisplayName(CONTENT_NAME);
            // 2. One option has been selected:
            await customSelectorForm.selectOption(OPTION_1);
            await contentWizard.waitAndClickOnSave();
            let isDisplayed = await customSelectorForm.isOptionFilterDisplayed();
            assert.ok(isDisplayed, 'Option filter input should be displayed, because just one options is selected');
            let options = await customSelectorForm.getSelectedOptions();
            await studioUtils.saveScreenshot('custom_selector_1_option');
            assert.equal(options[0], OPTION_1, 'Expected option should be selected');
        });

    it("GIVEN existing content with 'custom-selector' (0:2) is opened WHEN second option has been selected THEN option filter input gets not visible",
        async () => {
            let contentWizard = new ContentWizard();
            let customSelectorForm = new CustomSelectorForm();
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 1. Select the second option:
            await customSelectorForm.selectOption(OPTION_2);
            await contentWizard.waitAndClickOnSave();
            // 2. option filter input gets not visible:
            let isDisplayed = await customSelectorForm.isOptionFilterDisplayed();
            assert.ok(isDisplayed === false, 'Option filter input gets not visible, because 2 options are selected');
            let selectedOptions = await customSelectorForm.getSelectedOptions();
            await studioUtils.saveScreenshot('custom_selector_2_options');
            assert.equal(selectedOptions[0], OPTION_1, 'expected option should be selected');
            assert.equal(selectedOptions[1], OPTION_2, 'expected option should be selected');
        });

    // verifies "Drag'n'Drop of selected options in Custom selector is not working #440"
    it(`GIVEN wizard with 'custom-selector' is opened AND 2 options are selected WHEN options have been swapped THEN order of selected options should be changed`,
        async () => {
            let customSelectorForm = new CustomSelectorForm();
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // Open the content and swap options:
            await customSelectorForm.swapOptions(OPTION_2, OPTION_1);
            let options = await customSelectorForm.getSelectedOptions();
            await studioUtils.saveScreenshot('custom_selector_swapped_options');
            assert.equal(options[0], OPTION_2, 'Order of selected Options should be changed');
            assert.equal(options[1], OPTION_1, 'Order of selected Options should be changed');
        });

    it(`GIVEN wizard with 'custom-selector'(1:1) is opened WHEN display name has been typed THEN the content should be invalid`,
        async () => {
            let customSelectorForm = new CustomSelectorForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CUSTOM_SELECTOR_1_1);
            // 1. Fill in the name input:
            await contentWizard.typeDisplayName(CONTENT_NAME_2);
            await studioUtils.saveScreenshot('custom_selector_1_1');
            // 2. Verify that the content invalid
            let result = await contentWizard.isContentInvalid();
            assert.ok(result, 'The content should be invalid');
            // 3. Click on save button
            await contentWizard.waitAndClickOnSave();
            // 4. validation message should appear after clicking on Save button
            let actualMessage = await customSelectorForm.getSelectorValidationMessage();
            assert.equal(actualMessage, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, "'This field is required' should appear");
        });

    it("GIVEN existing content with 2 selected options(not required) is opened WHEN one selected option has been removed THEN option filter input gets visible",
        async () => {
            let customSelectorForm = new CustomSelectorForm();
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 1. Select the second option:
            await customSelectorForm.removeSelectedOption(OPTION_2);
            // 2. option filter input gets visible again:
            let isDisplayed = await customSelectorForm.isOptionFilterDisplayed();
            assert.ok(isDisplayed, 'Option filter input gets visible');
            let selectedOptions = await customSelectorForm.getSelectedOptions();
            await studioUtils.saveScreenshot('custom_selector_option_removed');
            assert.equal(selectedOptions[0], OPTION_1, 'expected option should be selected');
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
