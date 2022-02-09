/**
 * Created on 13.10.2021.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const AttachmentsForm = require('../../page_objects/wizardpanel/attachments.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('attachments.wizard.spec: tests for attachments content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    const ATTACHMENT_NAME = contentBuilder.generateRandomName('attachments');
    const ATTACHMENT_NAME2 = contentBuilder.generateRandomName('attachments');


    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("WHEN new wizard with required 'attachment' is opened THEN 'Upload' button should be displayed",
        async () => {
            let attachmentsForm = new AttachmentsForm();
            let contentWizard = new ContentWizard();
            //1. Open wizard for new attachment content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ATTACHMENTS_1_1);
            //2. Verify that Upload button is displayed:
            await attachmentsForm.waitForUploaderDisplayed();
            await studioUtils.saveScreenshot('attachments_wizard_1');
            await contentWizard.typeDisplayName(ATTACHMENT_NAME);
            //3. Verify that the content is not valid, because attachment input is required:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isTrue(isInvalid, "Content should be not valid");
            //4. Verify that validation recording does not appear until content is saved
            let validRecording = await attachmentsForm.getOccurrenceValidationRecording(0);
            assert.equal(validRecording, "", "Validation recording should be empty until content is saved");
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it("GIVEN existing attachment(1:1) has been reopened WHEN attachment binary is not uploaded THEN the content should be not valid",
        async () => {
            let attachmentsForm = new AttachmentsForm();
            let contentWizard = new ContentWizard();
            //1. existing attachment(1:1) has been reopened
            await studioUtils.selectAndOpenContentInWizard(ATTACHMENT_NAME);
            //2. Verify that Validation Recording for attachments input is displayed:
            let actualRecording = await attachmentsForm.getFormValidationRecording();
            assert.equal(actualRecording, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, "Validation recording should be displayed");
            //3. Verify that the content is not valid
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isTrue(isInvalid, "Content should be not valid");
        });

    it("WHEN new wizard with not required 'attachment' is opened AND name input is filled in THEN the content gets valid",
        async () => {
            let contentWizard = new ContentWizard();
            //1. Open wizard for new attachment content (0:0 not required)
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ATTACHMENTS_0_0);
            await contentWizard.typeDisplayName(ATTACHMENT_NAME2);
            await studioUtils.saveScreenshot('attachments_wizard_2');
            //3. Verify that the content is valid, because attachment input is not required:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isFalse(isInvalid, "Content should be valid");
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
