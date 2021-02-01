/**
 * Created on 01.02.2021.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('wizard.publish.work.in.progress.content.spec - publishes work in progress content in the wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER;
    let SITE;

    it("Precondition  - new site should be added",
        async () => {
            let siteName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(siteName);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN 'Work in progress' folder is opened WHEN 'Publish...' menu item has been pressed AND 'Mark as ready' menu item clicked THEN the content gets 'Ready for publishing'",
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            let displayName = contentBuilder.generateRandomName('folder');
            //1. Add work in progress folder:
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(TEST_FOLDER);
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //2. Expand Publish menu in wizard and select 'Publish...' menu item:
            await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            //3. Verify that Publish now button is disabled, because this content is work in progress:
            await contentPublishDialog.waitForPublishNowButtonDisabled();
            //4. Expand the menu and click on 'Mark as Ready' menu item
            await contentPublishDialog.clickOnMarkAsReadyMenuItem();
            //5. Verify that Publish Now button gets enabled:
            await contentPublishDialog.waitForPublishNowButtonEnabled();
        });

    //Verifies that 'Confirm Value' dialog with the message "Enter 1 in the field and click Confirm" appears in site wizards:
    it(`GIVEN existing 'work in progress' site has been published in wizard WHEN Unpublish button has been pressed THEN 'Confirm Value' dialog with with '1' number is loaded`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            let confirmValueDialog = new ConfirmValueDialog();
            //1. Open an existing site (work in progress)
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            //2. Click on Mark as ready menu item
            await contentPublishDialog.clickOnMarkAsReadyMenuItem();
            //3. Publish the site:
            await contentPublishDialog.clickOnPublishNowButton();
            //4. Open Unpublish modal dialog:
            let unpublishDialog = await contentWizard.clickOnUnpublishButton();
            await unpublishDialog.clickOnUnpublishButton();
            await confirmValueDialog.waitForDialogOpened();
            //5. Verify that input for number of items is displayed in the modal dialog
            await confirmValueDialog.typeNumberOrName(1);
            //6. Confirm the unpublishing:
            await confirmValueDialog.clickOnConfirmButton();
            await confirmValueDialog.waitForDialogClosed();
            await contentWizard.waitForNotificationMessage();
            //7. Verify that status in wizard is UNPUBLISHED now
            let status = await contentWizard.getContentStatus();
            assert.equal(status, appConst.CONTENT_STATUS.UNPUBLISHED, "The content gets Unpublished");
            await contentWizard.waitForPublishButtonDisplayed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
