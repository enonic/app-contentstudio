/**
 * Created on 15.12.2017.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ImageSelectorForm = require('../../page_objects/wizardpanel/imageselector.form.panel');
const appConst = require('../../libs/app_const');

describe('content.image.selector: Image selector dropdown specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const FOLDER_WITH_FILES = 'selenium-tests-folder';
    const EXPECTETD_NUMBER_OF_ITEMS_IN_SELECTOR = 15;

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN display name of an image has been typed in option filter input (tree mode) WHEN the image has been clicked THEN then the option should be selected after clicking on OK button`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            // 1. Open wizard with Image Selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.IMG_SELECTOR_2_4);
            // 2. switch the selector to tree mode:
            await imageSelectorForm.clickOnModeTogglerButton();
            // 3. Type the image display-name in the filter input:
            await imageSelectorForm.doFilterOptions(appConst.TEST_IMAGES.KOTEY);
            // 4. Click on the filtered image:
            // TODO - check it : Click on the expander-icon for the folder-item in the dropdown-list and expand the folder:
            await imageSelectorForm.clickOnExpanderIconInOptionsList(appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_NAME);
            await imageSelectorForm.clickOnImageOptionInTreeMode(appConst.TEST_IMAGES.KOTEY);
            await imageSelectorForm.clickOnOkAndApplySelectionButton();
            // 5. Verify that the selected image is displayed in the selected options:
            let result = await imageSelectorForm.getSelectedImages();
            assert.equal(result[0], appConst.TEST_IMAGES.KOTEY, "Expected image should be displayed in the selected options");
        });

    it(`GIVEN wizard for image-selector is opened WHEN 'zzzzzz' typed in the filter input THEN 'No matching items' should appear`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            // 1. Open wizard with Image Selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.IMG_SELECTOR_2_4);
            // 2. Type a not existing name:
            await imageSelectorForm.doFilterOptions('zzzzzz');
            // 3. Verify that the message: "No matching items - this message should appear"
            await imageSelectorForm.waitForEmptyOptionsMessage();
        });

    it(`GIVEN wizard for image-selector is opened and actual name is typed in filter input WHEN 'zzzzzz' string has been typed in the filter input THEN 'No matching items' should appears`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            //1. Open wizard with Image Selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.IMG_SELECTOR_2_4);
            // 2. Type an existing folder-name
            await imageSelectorForm.doFilterOptions(appConst.TEST_IMAGES.SPUMANS);
            // 3. Type a not existing name:
            await imageSelectorForm.doFilterOptions('zzzzzz');
            let isDisplayed = await imageSelectorForm.waitForEmptyOptionsMessage();
            await studioUtils.saveScreenshot('img_empty_options2');
            assert.ok(isDisplayed, "'No matching items' - this message should appear");
        });

    it(`GIVEN wizard for image-selector is opened WHEN 'mode toggler' button has been pressed THEN mode should be switched to 'Tree' and expected folder with images should be present in the options`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            // 1. Open wizard with Image Selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.IMG_SELECTOR_2_4);
            // 2. Switch the selector to Tree-mode:
            await imageSelectorForm.clickOnModeTogglerButton();
            let options = await imageSelectorForm.getTreeModeOptionDisplayNames();
            await studioUtils.saveScreenshot('img_sel_tree_mode');
            assert.strictEqual(options[0], appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_DISPLAY_NAME,
                'Expected folder should be present in expanded tree mode options');
        });

    it(`GIVEN wizard for image-selector is opened WHEN options have been expanded in tree mode THEN image status should be displayed in options`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            // 1. Open wizard with Image Selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.IMG_SELECTOR_2_4);
            // 2. Switch the selector to Tree-mode and expand the test folder:
            await imageSelectorForm.clickOnModeTogglerButton();
            // 3. Expand a folder with images:
            await imageSelectorForm.clickOnExpanderIconInOptionsList(appConst.TEST_FOLDER_NAME);
            // 4. Verify that content status is displayed for each option
            await studioUtils.saveScreenshot('img_sel_tree_mode_status');
            let statusList = await imageSelectorForm.getImagesStatusInOptions();
            assert.ok(statusList.length >= EXPECTETD_NUMBER_OF_ITEMS_IN_SELECTOR, "Content status should be displayed for each item");
        });

    it(`GIVEN wizard for image-selector is opened WHEN 'dropdown handle' button has been pressed THEN flat mode should be present in the options list`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            // 1. Open wizard with Image Selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.IMG_SELECTOR_2_4);
            // 2. Click on dropdown handle in the selector:
            await imageSelectorForm.clickOnDropdownHandle();
            await imageSelectorForm.pause(800);
            // 3. Verify expanded options:
            await studioUtils.saveScreenshot('selector_flat_mode');
            let nameImages = await imageSelectorForm.getFlatModeOptionImageNames();
            await studioUtils.saveScreenshot('img_sel_flat_mode');
            assert.ok(nameImages.length > 0, 'images should be present in the dropdown list');
            assert.ok(nameImages[0].includes('.png') || nameImages[0].includes('.jpg') || nameImages[0].includes('.jpeg') ||
                      nameImages[0].includes('.svg'), 'Expected extension should be in all the names');
        });

    // verifies https://github.com/enonic/lib-admin-ui/issues/628
    it(`GIVEN wizard with image-selector is opened WHEN folder's name(folder has child image) has been typed in filter input THEN one option should be present in the dropdown list`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            // 1. Open wizard with Image Selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.IMG_SELECTOR_1_1);
            // 2. Type the folder-name:
            await imageSelectorForm.doFilterOptions(FOLDER_WITH_FILES);
            // 3. Verify that expected images (options) are present in the expanded list: there are only 2 images in this folder.
            let optionsName = await imageSelectorForm.getFlatModeOptionImageNames();
            await studioUtils.saveScreenshot('img_sel_filtered');
            assert.equal(optionsName.length, 2, 'one option should be present in options, because text files should be filtered');
            assert.ok(optionsName[1].includes('.svg'), 'pdf and text- files should be filtered in drop down list');
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
