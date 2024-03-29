/**
 * Created on 23.11.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ImageSelectorForm = require('../../page_objects/wizardpanel/imageselector.form.panel');
const DeleteContentDialog = require('../../page_objects/delete.content.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe('image.selector.required.input.spec tests for validation of content with required image', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const CONTENT_NAME = contentBuilder.generateRandomName('content');

    const IMAGE_DISPLAY_NAME1 = appConst.TEST_IMAGES.PES;
    let SITE;

    it(`Precondition: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App']);
            await studioUtils.doAddSite(SITE);
        });

    it("WHEN wizard for new Image Selector(1:1) has been opened THEN options filter input should be displayed AND uploader button should be enabled AND the content is not valid",
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            let contentWizard = new ContentWizard();
            // 1. Open new wizard
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.IMG_SELECTOR_1_1);
            // 2. Fill the name input:
            await contentWizard.typeDisplayName(CONTENT_NAME);
            // 3. Verify that Uploader button is enabled:
            await imageSelectorForm.waitForUploaderButtonEnabled();
            // 4. Verify that options filter input is displayed
            await imageSelectorForm.waitForOptionsFilterInputDisplayed();
            // 5. Verify that the content is not valid
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, "This content should be invalid, because the image selector is required input");
            // 6. Verify that validation recording appears after the saving:
            await contentWizard.waitAndClickOnSave();
            let record = await imageSelectorForm.getSelectorValidationMessage();
            assert.equal(record, "This field is required", "Expected validation record gets visible");
        });

    it(`GIVEN existing content (image is not selected) opened WHEN an image has been selected THEN content gets valid`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            let contentWizard = new ContentWizard();
            // 1. Open existing not valid content:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. select an image:
            await imageSelectorForm.filterOptionsAndSelectImage(IMAGE_DISPLAY_NAME1);
            // 3. Verify that the content gets valid:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "This content should be valid, because one required image is selected");
            // 4. Save the content
            await contentWizard.waitAndClickOnSave();
            // 5. Verify the expected selected option:
            let names = await imageSelectorForm.getSelectedImages();
            assert.equal(names[0], IMAGE_DISPLAY_NAME1);
            // 6. Verify that options filter input is not displayed:
            await imageSelectorForm.waitForOptionsFilterInputNotDisplayed();
        });

    it("GIVEN existing content is opened WHEN selected image has been clicked THEN buttons 'Edit' and 'Remove' should appear in the form",
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            let contentWizard = new ContentWizard();
            // 1. Open existing not valid content:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. select an image:
            await imageSelectorForm.clickOnSelectedImage(IMAGE_DISPLAY_NAME1);
            // 3. Verify that Edit and remove button get visible:
            await imageSelectorForm.waitForEditButtonDisplayed();
            await imageSelectorForm.waitForRemoveButtonDisplayed();
            // 4. Verify that default action is Mark as Ready:
            await contentWizard.waitForMarkAsReadyButtonVisible();
        });

    it("GIVEN existing content is opened WHEN selected image has been removed THEN the content gets invalid again",
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            let contentWizard = new ContentWizard();
            //1. Open existing valid content with selected image:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            //2. click on the image:
            await imageSelectorForm.clickOnSelectedImage(IMAGE_DISPLAY_NAME1);
            //3. Click on 'Remove' button:
            await imageSelectorForm.clickOnRemoveButton();
            //4. Verify that the content gets not valid now:
            await contentWizard.waitUntilInvalidIconAppears();
            //5. Verify that default action is 'Create Issue':
            await contentWizard.waitForCreateIssueButtonDisplayed();
            //6. Validation recording gets visible now:
            let record = await imageSelectorForm.getSelectorValidationMessage();
            assert.equal(record, "This field is required", "Expected validation record gets visible");
            //7. Remove button should be not visible:
            await imageSelectorForm.waitForRemoveButtonNotDisplayed();
        });

    it("Preconditions: the image (that is selected in existing content) has been deleted in Browse Panel",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            await studioUtils.findAndSelectItem(IMAGE_DISPLAY_NAME1);
            //browse panel - select the image and delete it
            await contentBrowsePanel.clickOnArchiveButton();
            await deleteContentDialog.waitForDialogOpened();
            await deleteContentDialog.clickOnIgnoreInboundReferences();
            await deleteContentDialog.clickOnDeleteMenuItem();
            await deleteContentDialog.waitForDialogClosed();
        });

    it("GIVEN selected required image was deleted/archived WHEN the content with not available image is opened THEN this content remains valid",
        async () => {
            // 1. Open existing content with one required image:
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            await contentWizard.pause(1000);
            // 2. Verify that the content is valid, selected required image was deleted in the previous step:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "This content should be valid when the selected image is not available");
        });

    it("WHEN the content with not available required image has been filtered THEN the content should be displayed without the red icon",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select existing content with one required image:
            await studioUtils.findAndSelectItem(CONTENT_NAME);
            // 2. Verify that the content is invalid, because the selected required image was deleted in the previous step:
            let isInvalid = await contentBrowsePanel.isRedIconDisplayed(CONTENT_NAME);
            assert.ok(isInvalid === false, "This content should be valid when the selected image is not available");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});




