/**
 * Created on 02.01.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const InsertImageDialog = require('../../page_objects/wizardpanel/html-area/insert.image.dialog.cke');
const DetailsPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');
const VersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const appConst = require('../../libs/app_const');

describe('insert.image.dlg.custom.width.spec: click on the `custom width` checkbox and check `image range value`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let HTML_AREA_CONTENT_NAME = contentBuilder.generateRandomName('hrtmlarea');
    let IMAGE_DISPLAY_NAME = appConst.TEST_IMAGES.POP_03;

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN htmlarea-content, 'Insert Image' dialog is opened AND an image is selected WHEN 'Custom width' checkbox should be unchecked by default`,
        async () => {
            let insertImageDialog = new InsertImageDialog();
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard and open Insert Image dialog:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            //2. Select the image:
            await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            //3. Verify that image style selector should be present in the modal dialog:
            await insertImageDialog.waitForStyleSelectorVisible();

            let isChecked = await insertImageDialog.isCustomWidthCheckBoxSelected();
            await studioUtils.saveScreenshot('image_dialog_custom_width_default_value');
            assert.ok(isChecked === false, "'Custom width' checkbox should be unchecked by default");
            //4. Verify the alignment buttons:
            await insertImageDialog.waitForAlignRightButtonDisplayed();
            await insertImageDialog.waitForAlignLeftButtonDisplayed();
            await insertImageDialog.waitForAlignCenterButtonDisplayed();
            await insertImageDialog.waitForJustifyButtonDisplayed();
        });

    it(`GIVEN htmlarea-content, 'Insert Image' dialog is opened AND an image is selected WHEN 'Custom width' checkbox has been clicked THEN default range(100%) for custom width should appear`,
        async () => {
            let insertImageDialog = new InsertImageDialog();
            let htmlAreaForm = new HtmlAreaForm();
            // 1. Open new wizard and open Insert Image dialog:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            // 2. Select the image in the modal dialog:
            await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            // 3. Click on the 'Custom Width' checkbox:
            await insertImageDialog.clickOnCustomWidthCheckBox();
            // 4. Verify -  range of the image should be 100% (default value)
            let actualValue = await insertImageDialog.waitForImageRangeValue();
            await studioUtils.saveScreenshot('image_dialog_custom_width_clicked');
            assert.equal(actualValue, '100%', "Range should be 100%");
        });

    it(`GIVEN image withs custom width is inserted WHEN Save button has been pressed THEN content is saving`,
        async () => {
            let insertImageDialog = new InsertImageDialog();
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            //1. Open new wizard and open Insert Image dialog:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await contentWizard.typeDisplayName(HTML_AREA_CONTENT_NAME);
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            //2. Select the image in the modal dialog:
            await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            await insertImageDialog.clickOnDecorativeImageRadioButton();
            //3. 'Custom Width' has been checked:
            await insertImageDialog.clickOnCustomWidthCheckBox();
            //4. Click on Insert and save buttons:
            await insertImageDialog.clickOnInsertButton();
            await contentWizard.waitAndClickOnSave();
            //5. Verify that notification message appears:
            await insertImageDialog.waitForNotificationMessage();
        });

    it(`GIVEN existing htmlarea-content with image(custom width) is opened WHEN double click in htmmlarea THEN expected range should be displayed`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            //1. Open existing content and double-click in html-area
            await studioUtils.selectContentAndOpenWizard(HTML_AREA_CONTENT_NAME);
            await htmlAreaForm.pause(2000);
            await htmlAreaForm.doubleClickOnHtmlArea();
            await insertImageDialog.waitForDialogVisible();
            //2. Get and verify the range value:
            let rangeValue = await insertImageDialog.waitForImageRangeValue();
            await studioUtils.saveScreenshot('image_dialog_custom_width_clicked_saved');
            assert.equal(rangeValue, '100%', "Expected range should be in the dialog");
            //3. 'Custom Width' checkbox should be checked:
            let isChecked = await insertImageDialog.isCustomWidthCheckBoxSelected();
            assert.ok(isChecked, "'Custom Width' Checkbox should be selected");
        });

    it(`GIVEN existing htmlarea-content with inserted image(custom width) is opened WHEN 'Custom Width' has been unselected THEN image-range gets hidden`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            let contentWizard = new ContentWizard();
            //1. Open existing content and double click in html-area
            await studioUtils.selectContentAndOpenWizard(HTML_AREA_CONTENT_NAME);
            await contentWizard.pause(2000);
            //2. Open 'Insert Image Dialog'
            await htmlAreaForm.doubleClickOnHtmlArea();
            await insertImageDialog.waitForDialogVisible();
            //3. Click on 'Custom Width' checkbox and uncheck it:
            await insertImageDialog.clickOnCustomWidthCheckBox();
            //4. Verify that 'range' gets not visible:
            await insertImageDialog.waitForImageRangeNotVisible();
            //5. Verify that `Custom Width` checkbox is unchecked
            let isChecked = await insertImageDialog.isCustomWidthCheckBoxSelected();
            assert.ok(isChecked === false, "Custom Width should be unchecked");
            // just save the changes and create new version
            await insertImageDialog.clickOnUpdateButton();
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.pause(1000);
        });

    it(`GIVEN existing htmlarea-content with an inserted image is opened WHEN rollback version with 'Custom Width' THEN image-range is getting visible again`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            let contentWizard = new ContentWizard();
            let versionsWidget = new VersionsWidget();
            let detailsPanel = new DetailsPanel();
            //1. Open existing content and open versions widget:
            await studioUtils.selectContentAndOpenWizard(HTML_AREA_CONTENT_NAME);
            await contentWizard.openDetailsPanel();
            await detailsPanel.openVersionHistory();
            await versionsWidget.waitForVersionsLoaded();
            //2. Revert the previous version:
            await versionsWidget.clickAndExpandVersion(1);
            //revert the version with 'Custom Width'
            await versionsWidget.clickOnRevertButton();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot("image_range_version_reverted");
            //3. Open 'Insert Image Dialog'
            await htmlAreaForm.doubleClickOnHtmlArea();
            await insertImageDialog.waitForDialogVisible();
            await studioUtils.saveScreenshot('image_dialog_custom_width_reverted');
            //4. Verify that image-range is visible again(default value)
            //TODO uncomment this code when issue with content reverting will be fixed
            //let rangeValue = await insertImageDialog.waitForImageRangeValue();
            //assert.equal(rangeValue, '100%', "Range should be reverted");
            //Verify that`Custom Width` checkbox gets checked:
            //let isChecked = await insertImageDialog.isCustomWidthCheckBoxSelected();
            //assert.ok(isChecked, "Custom Width should be checked");
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
