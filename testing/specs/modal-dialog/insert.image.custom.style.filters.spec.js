/**
 * Created on 17.06.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const InsertImageDialog = require('../../page_objects/wizardpanel/html-area/insert.image.dialog.cke');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe('insert.image.custom.style.filters.spec: select an image with filters in Insert Image modal dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);

    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let IMAGE_DISPLAY_NAME = appConst.TEST_IMAGES.SEVEROMOR;
    let HTML_AREA_CONTENT_NAME = contentBuilder.generateRandomName('hrtmlarea');

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    // Verifies No lazy load in content selectors in modal dialogs #8346
    // https://github.com/enonic/app-contentstudio/issues/8346
    it(`GIVEN Insert Image modal dialog is opened AND image selector is expanded WHEN the options have scrolled down THEN number of option-images should be increased`,
        async () => {
            let contentWizard = new ContentWizard();
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            // 1. Open new wizard with html-area and open Insert Image dialog:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await contentWizard.typeDisplayName(HTML_AREA_CONTENT_NAME);
            // 2. Open Insert Image modal dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            // 3. Expand the image-selector:
            await insertImageDialog.clickOnDropdownHandle();
            // 4. Get image-options from the dropdown-list
            let beforeScrolling = await insertImageDialog.getImagesNameInFlatMode();
            let set = new Set(beforeScrolling);
            // 5. Scroll down the options list:
            await insertImageDialog.scrollDownInOptionsList(700);
            await studioUtils.saveScreenshot('image_dialog_scroll_down');
            // 6. Get image-options:
            let afterScrolling = await insertImageDialog.getImagesNameInFlatMode();
            afterScrolling.forEach(name => set.add(name));
            // 7. Verify that the number of options is increased after scrolling the list
            assert.ok(set.size > beforeScrolling.length, 'Number of option-images should be increased after scrolling');
            assert.equal(beforeScrolling.length, 15, "15 items should be displayed in initial list");
        });

    // Verify issue: 500 error in image service when using filters XP#9497
    it(`GIVEN Insert Image modal dialog is opened WHEN 'Avatar' option with filter has been selected THEN modal should be closed`,
        async () => {
            let contentWizard = new ContentWizard();
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            // 1. Open new wizard with html-area and open Insert Image dialog:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await contentWizard.typeDisplayName(HTML_AREA_CONTENT_NAME);
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            // 2. Select the image:
            await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            await insertImageDialog.clickOnDecorativeImageRadioButton();
            // 3. Type the 'Avatar' text in filter input and click on the option:
            await insertImageDialog.doFilterStyleAndClickOnOption('Avatar');
            // 4. save the changes and save the content
            await insertImageDialog.clickOnInsertButton();
            await contentWizard.waitAndClickOnSave();
        });

    // Verify issue: 500 error in image service when using filters XP#9497
    it(`WHEN double click on the image with custom styles (filter) THEN expected style should be present in style selector in Insert Image modal dialog`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            // 1. Open the htmlArea content:
            await studioUtils.selectContentAndOpenWizard(HTML_AREA_CONTENT_NAME);
            await htmlAreaForm.pause(2000);
            // 2. Do a double click in htmlArea and open InsertImage dialog:
            await htmlAreaForm.doubleClickOnHtmlArea();
            await insertImageDialog.waitForDialogVisible();
            // 3. Verify the selected style option in styles selector:
            let actualStyle = await insertImageDialog.getSelectedStyleValue();
            // 4. Verify that 'Avatar' option should be selected in the styles dropdown selector
            await studioUtils.saveScreenshot('image_dialog_custom_style_avatar');
            assert.equal(actualStyle, 'Avatar', "'Avatar' style should be selected in the dropdown");

            // 5. Verify that 'Decorative image' radio-button is selected
            let isSelected = await insertImageDialog.isDecorativeImageRadioSelected();
            assert.ok(isSelected, `'Decorative image' radio-button is selected`);
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
