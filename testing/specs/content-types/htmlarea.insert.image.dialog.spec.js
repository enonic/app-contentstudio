/**
 * Created on 11.01.2019.
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const InsertImageDialog = require('../../page_objects/wizardpanel/html-area/insert.image.dialog.cke');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe('htmlarea.insert.image.dialog.spec: open insert image dialog.', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
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
            await studioUtils.saveScreenshot("insert_image_esc_test1");
            await insertImageDialog.waitForDialogVisible();
            await contentWizard.pressEscKey();
            await studioUtils.saveScreenshot("insert_image_esc_test2");
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
            await insertImageDialog.waitForDialogVisible();
            await insertImageDialog.clickOnCancelButton();
            await insertImageDialog.waitForDialogClosed();
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
