/**
 * Created on 13.10.2021.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const AttachmentsForm = require('../../page_objects/wizardpanel/attachments.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardAttachmentsItemWidget = require('../../page_objects/wizardpanel/details/wizard.attachments.item.widget');

describe('attachments.wizard.spec: tests for attachments content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const ATTACHMENT_NAME = contentBuilder.generateRandomName('attach');
    const ATTACHMENT_NAME2 = contentBuilder.generateRandomName('attach');
    const IMPORTED_ATTACHMENT_1_1 = 'attachment1-1';
    const IMPORTED_ATTACHMENT_2_4 = 'attachment2-4';
    const NOTIFICATION_MESSAGE = 'Item "attachment1-1" is saved.'

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    // https://github.com/enonic/app-contentstudio/issues/7152
    // AttachmentUploader: error in console on removing an attachment #7152
    // https://github.com/enonic/app-contentstudio/issues/7063
    it("GIVEN existing attachment content is opened WHEN attachment binary has been removed THEN the content should be automatically saved",
        async () => {
            let attachmentsForm = new AttachmentsForm();
            let contentWizard = new ContentWizard();
            let wizardAttachmentsItemWidget = new WizardAttachmentsItemWidget();
            // 1. open the existing imported attachment(1:1) content:
            await studioUtils.selectAndOpenContentInWizard(IMPORTED_ATTACHMENT_1_1);
            // 2. Remove the item:
            await attachmentsForm.clickOnRemoveItemIcon(0);
            // 3. Verify that the content is automatically saved
            let message = await contentWizard.waitForNotificationMessage();
            assert.equal(message, NOTIFICATION_MESSAGE, 'Expected notification message should appear');
            // 4. Verify that Validation Recording for attachments gets visible now:
            let actualRecording = await attachmentsForm.getFormValidationRecording();
            assert.equal(actualRecording, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, 'Validation recording should be displayed');
            // 5. Verify that the content is invalid
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, 'Content should be invalid');
            // 6. Verify that attachments item is not visible now:
            await wizardAttachmentsItemWidget.waitForAttachmentItemsNotDisplayed();
            // 7. Verify the message in the widget:
            let placeholder = await wizardAttachmentsItemWidget.getAttachmentsPlaceholder();
            assert.equal(placeholder, 'This item has no attachments', "Expected message should be displayed in the widget")
        });

    // https://github.com/enonic/app-contentstudio/issues/7152
    // AttachmentUploader: error in console on removing an attachment #7152
    it("GIVEN existing attachment content is opened WHEN one attachment binary has been removed THEN the number of attachments item should be reduced",
        async () => {
            let attachmentsForm = new AttachmentsForm();
            let contentWizard = new ContentWizard();
            let wizardAttachmentsItemWidget = new WizardAttachmentsItemWidget();
            // 1. open the existing imported attachment(2:4) content:
            await studioUtils.selectAndOpenContentInWizard(IMPORTED_ATTACHMENT_2_4);
            let result = await wizardAttachmentsItemWidget.getAttachmentsName();
            assert.equal(result.length, 2, "2 attachment items should be displayed in the widget")
            // 2. Remove one attachment item:
            await attachmentsForm.clickOnRemoveItemIcon(0);
            // 3. Verify that the content is automatically saved
            await contentWizard.waitForNotificationMessage();
            // 4. Verify that the number of attachments item is reduced:
            await wizardAttachmentsItemWidget.getAttachmentsName();
            result = await wizardAttachmentsItemWidget.getAttachmentsName();
            assert.equal(result.length, 1, "One attachment item should be displayed in the widget")
        });

    it("WHEN new wizard with required 'attachment' is opened THEN 'Upload' button should be displayed",
        async () => {
            let attachmentsForm = new AttachmentsForm();
            let contentWizard = new ContentWizard();
            // 1. Open wizard for new attachment content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ATTACHMENTS_1_1);
            // 2. Verify that Upload button is displayed:
            await attachmentsForm.waitForUploaderDisplayed();
            await studioUtils.saveScreenshot('attachments_wizard_1');
            await contentWizard.typeDisplayName(ATTACHMENT_NAME);
            // 3. Verify that the content is invalid, because attachment input is required:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, 'Content should be invalid');
            // 4. Verify that validation recording does not appear until content is saved
            await attachmentsForm.waitForFormValidationRecordingNotDisplayed();
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it("GIVEN existing attachment(1:1) has been reopened WHEN attachment binary is not uploaded THEN the content should be invalid",
        async () => {
            let attachmentsForm = new AttachmentsForm();
            let contentWizard = new ContentWizard();
            // 1. existing attachment(1:1) has been reopened
            await studioUtils.selectAndOpenContentInWizard(ATTACHMENT_NAME);
            // 2. Verify that Validation Recording for attachments input is displayed:
            let actualRecording = await attachmentsForm.getFormValidationRecording();
            assert.equal(actualRecording, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, "Validation recording should be displayed");
            // 3. Verify that the content is invalid
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, 'Content should be invalid');
        });

    it("WHEN new wizard with not required 'attachment' is opened AND name input is filled in THEN the content gets valid",
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Open wizard for new attachment content (0:0 not required)
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ATTACHMENTS_0_0);
            await contentWizard.typeDisplayName(ATTACHMENT_NAME2);
            await studioUtils.saveScreenshot('attachments_wizard_2');
            // 3. Verify that the content is valid, because attachment input is not required:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, 'Content should be valid');
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
