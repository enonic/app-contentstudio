/**
 * Created on 02.01.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const contentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const htmlAreaForm = require('../page_objects/wizardpanel/htmlarea.form.panel');
const contentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const insertImageDialog = require('../page_objects/wizardpanel/insert.image.dialog.cke');


describe('insert.image.dlg.custom.width.spec:  click on the `custom width` checkbox and check `image range value`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let HTML_AREA_CONTENT_NAME = contentBuilder.generateRandomName('hrtmlarea');
    let IMAGE_DISPLAY_NAME = "Pop_03";

    it(`Preconditions: site should be added`,
        () => {
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

    it(`GIVEN htmlarea-content, 'Insert Image' dialog is opened AND an image is selected WHEN 'Custom width' checkbox has been clicked THEN default range(100%) for custom width should appear`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1').then(() => {
            }).then(() => {
                return htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            }).then(() => {
                return insertImageDialog.waitForDialogVisible();
            }).then(() => {
                return insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            }).then(() => {
                // click on the checkbox
                return insertImageDialog.clickOnCustomWidthCheckBox();
            }).then(() => {
                // range of the image should be 100% (default value)
                return insertImageDialog.waitForImageRangeValue();
            }).then(result => {
                studioUtils.saveScreenshot('image_dialog_custom_width_clicked');
                assert.isTrue(result == '100%');
            });
        });

    it(`GIVEN image withs custom width is inserted WHEN Save button has been pressed THEN content is saving`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1').then(() => {
                return contentWizard.typeDisplayName(HTML_AREA_CONTENT_NAME);
            }).then(() => {
                return htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            }).then(() => {
                return insertImageDialog.waitForDialogVisible();
            }).then(() => {
                return insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            }).then(() => {
                // Custom Width has been checked
                return insertImageDialog.clickOnCustomWidthCheckBox();
            }).then(() => {
                return insertImageDialog.clickOnInsertButton();
            }).then(() => {
                //Save button has been pressed
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                // content is saving
                return insertImageDialog.waitForNotificationMessage();
            });
        });

    it(`GIVEN existing htmlarea-content with inserted image(custom width) is opened WHEN double click in htmmlarea THEN expected range should be displayed`,
        () => {
            return studioUtils.selectContentAndOpenWizard(HTML_AREA_CONTENT_NAME).pause(2000).then(() => {
                return htmlAreaForm.doubleClickOnHtmlArea();
            }).then(() => {
                return insertImageDialog.waitForDialogVisible();
            }).then(() => {
                return insertImageDialog.waitForImageRangeValue();
            }).then(result => {
                studioUtils.saveScreenshot('image_dialog_custom_width_clicked_saved');
                assert.isTrue(result == '100%');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
