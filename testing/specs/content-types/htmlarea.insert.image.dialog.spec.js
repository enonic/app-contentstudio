/**
 * Created on 11.01.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const InsertImageDialog = require('../../page_objects/wizardpanel/insert.image.dialog.cke');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('htmlarea.insert.image.dialog.spec: open insert image dialog.',
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        if (typeof browser === "undefined") {
            webDriverHelper.setupBrowser();
        }
        let SITE;

        it(`Preconditions: new site should be created`,
            async () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
                await studioUtils.doAddSite(SITE);
            });

        // verifies XP-4949 HTML Area - Modal dialogs must handle close on Esc
        it(`GIVEN 'Insert Image' dialog is opened WHEN ESC key has been pressed THEN dialog should be closed`,
            async () => {
                let contentWizard = new ContentWizard();
                let htmlAreaForm = new HtmlAreaForm();
                let insertImageDialog = new InsertImageDialog();
                await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
                await contentWizard.pause(700);
                await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
                studioUtils.saveScreenshot("insert_image_esc_test1");
                await insertImageDialog.waitForDialogVisible();
                await contentWizard.pressEscKey();
                studioUtils.saveScreenshot("insert_image_esc_test2");
                await insertImageDialog.waitForDialogClosed();
            });

        it(`GIVEN 'Insert Image' dialog is opened WHEN 'Cancel' button has been clicked THEN dialog should be closed`,
            async () => {
                let contentWizard = new ContentWizard();
                let htmlAreaForm = new HtmlAreaForm();
                let insertImageDialog = new InsertImageDialog();
                await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
                await contentWizard.pause(700);
                await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
                studioUtils.saveScreenshot("insert_image_cancel_test1");
                await insertImageDialog.waitForDialogVisible();
                await insertImageDialog.clickOnCancelButton();
                studioUtils.saveScreenshot("insert_image_cancel_test2");
                await insertImageDialog.waitForDialogClosed();
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    });
