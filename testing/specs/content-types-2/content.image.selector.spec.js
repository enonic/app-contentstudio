/**
 * Created on 15.12.2017.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ImageSelectorForm = require('../../page_objects/wizardpanel/imageselector.form.panel');

describe('content.image.selector: Image content specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let FOLDER_WITH_FILES = 'selenium-tests-folder';

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for image-selector is opened WHEN 'zzzzzz' typed in the filter input THEN 'No matching items' should appear`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            //1. Open wizard with Image Selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_2_4);
            //2. Type a not existing name:
            await imageSelectorForm.doFilterOptions('zzzzzz');
            //3. Wait for the message:
            let isDisplayed = await imageSelectorForm.waitForEmptyOptionsMessage();
            await studioUtils.saveScreenshot('img_empty_options1');
            assert.isTrue(isDisplayed, "No matching items - this message should appear");
        });

    it(`GIVEN wizard for image-selector is opened and actual name is typed in filter input WHEN 'zzzzzz' string has been typed in the filter input THEN 'No matching items' should appears`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            //1. Open wizard with Image Selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_2_4);
            //2. Type an existing folder-name
            await imageSelectorForm.doFilterOptions(appConstant.TEST_IMAGES.SPUMANS);
            //3. Type a not existing name:
            await imageSelectorForm.doFilterOptions('zzzzzz');
            let isDisplayed = await imageSelectorForm.waitForEmptyOptionsMessage();
            await studioUtils.saveScreenshot('img_empty_options2');
            assert.isTrue(isDisplayed, "No matching items - this message should appear");
        });

    it(`GIVEN wizard for image-selector is opened WHEN 'mode toggler' button has been pressed THEN mode should be switched to 'Tree' and expected folder with images should be present in the options`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            //1. Open wizard with Image Selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_2_4);
            //2. Switch the selector to Tree-mode:
            await imageSelectorForm.clickOnModeTogglerButton();
            let options = await imageSelectorForm.getTreeModeOptionDisplayNames();
            await studioUtils.saveScreenshot('img_sel_tree_mode');
            assert.strictEqual(options[0], appConstant.TEST_FOLDER_WITH_IMAGES);
        });

    it(`GIVEN wizard for image-selector is opened WHEN options have been expanded in tree mode THEN image status should be displayed in options`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            //1. Open wizard with Image Selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_2_4);
            //2. Switch the selector to Tree-mode and expand the test folder:
            await imageSelectorForm.clickOnModeTogglerButton();
            //3. Expand a folder with images:
            await imageSelectorForm.expandFolderInOptions(appConstant.TEST_FOLDER_NAME);
            //4. Verify that content status is displayed in each option
            await studioUtils.saveScreenshot('img_sel_tree_mode_status');
            let statusList = await imageSelectorForm.getTreeModeOptionStatus();
            assert.isTrue(statusList.length > 0, "Content status should be displayed in each row");
        });

    it(`GIVEN wizard for image-selector is opened WHEN 'dropdown handle' button has been pressed THEN flat mode should be present in the options list`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            //1. Open wizard with Image Selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_2_4);
            //2. Click on dropdown handle in the selector:
            await imageSelectorForm.clickOnDropdownHandle();
            await imageSelectorForm.pause(800);
            //3. Verify expanded options:
            await studioUtils.saveScreenshot("selector_flat_mode");
            let nameImages = await imageSelectorForm.getFlatModeOptionImageNames();
            await studioUtils.saveScreenshot('img_sel_flat_mode');
            assert.isTrue(nameImages.length > 0, 'images should be present in the dropdown list');
            assert.isTrue(nameImages[0].includes('.png') || nameImages[0].includes('.jpg') || nameImages[0].includes('.jpeg') ||
                          nameImages[0].includes('.svg'), 'Expected extension should be in all the names');
        });

    //verifies https://github.com/enonic/lib-admin-ui/issues/628
    it(`GIVEN wizard with image-selector is opened WHEN folder's name(folder has child image) has been typed in filter input THEN one option should be present in the dropdown list`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            //1. Open wizard with Image Selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_1_1);
            //2. Type the folder-name:
            await imageSelectorForm.doFilterOptions(FOLDER_WITH_FILES);
            //3. Verify that expected options are present in the expanded list:
            let optionsName = await imageSelectorForm.getFlatModeOptionImageNames();
            studioUtils.saveScreenshot('img_sel_filtered');
            assert.equal(optionsName.length, 2, 'one option should be present in options, because text files should be filtered');
            assert.isTrue(optionsName[1].includes('.svg'), 'pdf and text- files should be filtered in drop down list');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
