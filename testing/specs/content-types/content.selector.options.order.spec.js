/**
 * Created on 09.07.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentSelectorForm = require('../../page_objects/wizardpanel/content.selector.form');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe('content.selector.options.order.spec:  tests for checking of order of selected options in content selector', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTENT_NAME = contentBuilder.generateRandomName("selector");
    const OPTION_1 = appConstant.TEST_FOLDER_WITH_IMAGES;//All Content types images
    const OPTION_2 = appConstant.TEST_FOLDER_2_DISPLAY_NAME;//folder for selenium tests
    const OPTION_3 = appConstant.TEST_FOLDER_WITH_IMAGES_2;//Images for simple page


    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard with 'content-selector'(2:8) is opened AND three options have been selected THEN expected options should be present in the form`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentSelectorForm = new ContentSelectorForm();
            //1. Wizard for Custom-Selector content is opened:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, "content-selector2_8");
            await contentWizard.typeDisplayName(CONTENT_NAME);
            //2. 3 options have been selected:
            await contentSelectorForm.selectOption(OPTION_1);
            await contentSelectorForm.selectOption(OPTION_2);
            await contentSelectorForm.selectOption(OPTION_3);
            await contentWizard.waitAndClickOnSave();
            //3. Verify that options are saved:
            let options = await contentSelectorForm.getSelectedOptions();
            studioUtils.saveScreenshot("content_selector_3_options");
            assert.equal(options[0], OPTION_1, "Expected option should be selected");
            assert.equal(options[1], OPTION_2, "Expected option should be selected");
            assert.equal(options[2], OPTION_3, "Expected option should be selected");
        });

    //Verifies https://github.com/enonic/lib-admin-ui/issues/920
    //Incorrect order of selected options in Content Selector #920
    it(`GIVEN options have been sorted alphabetically in descending order WHEN page has been saved and refreshed THEN order of selected options should not be changed`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentSelectorForm = new ContentSelectorForm();
            //1. Open existing content-selector:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            //2. Change the sorting -  they should be sorted alphabetically in descending order:
            await contentSelectorForm.swapOptions(OPTION_3, OPTION_1);
            await contentSelectorForm.swapOptions(OPTION_2, OPTION_1);
            //3. Save and refresh the page
            await contentWizard.waitAndClickOnSave();
            await contentWizard.refresh();
            await contentWizard.pause(2000);
            //4. Verify that order is not changed after refreshing the page :
            let options = await contentSelectorForm.getSelectedOptions();
            studioUtils.saveScreenshot("content_selector_swapped_options");
            assert.equal(options[0], OPTION_3, "Order of selected Options should not be changed");
            assert.equal(options[1], OPTION_2, "Order of selected Options should not be changed");
            assert.equal(options[2], OPTION_1, "Order of selected Options should not be changed");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
