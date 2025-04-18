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
    const CONTENT_NAME_2 = contentBuilder.generateRandomName('imgsel');

    const IMAGE_DISPLAY_NAME1 = appConst.TEST_IMAGES.PES;
    const IMAGE_DISPLAY_NAME2 = appConst.TEST_IMAGES.ELEPHANT;
    let SITE;

    it(`Precondition: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App']);
            await studioUtils.doAddSite(SITE);
        });

    // Verify the bug - hideToggleIcon config doesn't work in selectors #8532
    // https://github.com/enonic/app-contentstudio/issues/8532
    it(`WHEN image-content with hidden toggle mode is opened THEN toggle icon should not be displayed in the Image Selector`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            // 1. Open new wizard for content with image selector(tree mode, toggle is hidden):
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.IMG_SEL_TOGGLE_HIDDEN);
            await studioUtils.saveScreenshot('img_sel_toggle_hidden');
            // 2. Verify that the toggle icon is not displayed in the Image Selector
            await imageSelectorForm.waitForToggleIconNotDisplayed();
            // 3. Insert a image-name in the filter input:
            await imageSelectorForm.typeTextInOptionsFilterInput(appConst.TEST_IMAGES.SPUMANS);
            // 4. Verify that the toggle icon is not displayed in the Image Selector, because the toggle icon is hidden in the config:
            await imageSelectorForm.waitForToggleIconNotDisplayed();
        });

    // Verify https://github.com/enonic/app-contentstudio/issues/6026
    // Handle unresolvable selected items in Content Selector #6026
    it(`GIVEN an image has been selected in an image-content WHEN the image has been archived THEN 'Image is not available' should be displayed in the content-wizard`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            let contentWizard = new ContentWizard();
            let browsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            // 1. Open new wizard
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.IMG_SELECTOR_1_1);
            // 2. Fill the name input:
            await contentWizard.typeDisplayName(CONTENT_NAME_2);
            // 3. Select an image in the required input:
            await imageSelectorForm.filterOptionsAndSelectImage(IMAGE_DISPLAY_NAME2);
            await contentWizard.waitAndClickOnSave();
            await studioUtils.doSwitchToContentBrowsePanel();
            // 4. Delete the image:
            await studioUtils.findAndSelectItem(IMAGE_DISPLAY_NAME2);
            // Open Archive modal  dialog:
            await browsePanel.clickOnArchiveButton();
            await deleteContentDialog.waitForDialogOpened();
            await deleteContentDialog.clickOnIgnoreInboundReferences();
            await deleteContentDialog.clickOnDeleteMenuItem();
            await deleteContentDialog.waitForDialogClosed();
            await studioUtils.switchToContentTabWindow(CONTENT_NAME_2);
            // 5. Verify that the content remains valid:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "This content remains valid after deleting its selected option");
            // 6. Verify that text 'Image is not available' is displayed in the single selected option:
            let items = await imageSelectorForm.waitForImageNotAvailableTextDisplayed();
            assert.equal(items, 1, "One selected option should be with 'Image is not available' text");
        });

    it(`GIVEN content with unresolvable selected item is opened WHEN the unresolvable item has been clicked THEN 'Edit' button should be disabled`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            let contentWizard = new ContentWizard();
            // 1. Open the content with an unresolvable selected image:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME_2);
            // 2. Click on the option:
            await imageSelectorForm.clickOnSelectedOptionByIndex(0);
            // 3. Verify that 'Edit' button is disabled:
            await imageSelectorForm.waitForEditButtonDisabled();
            // 4. Remove button should be enabled:
            await imageSelectorForm.waitForRemoveButtonEnabled();
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "This content remains valid after deleting its selected option");
        });

    it("WHEN the content with not available required image has been filtered THEN the content should be displayed without red icon",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select existing content with one required image:
            await studioUtils.findAndSelectItem(CONTENT_NAME_2);
            // 2. Verify that the content is invalid, because the selected required image was deleted in the previous step:
            let isInvalid = await contentBrowsePanel.isRedIconDisplayed(CONTENT_NAME_2);
            assert.ok(isInvalid === false, "This content should be valid when the selected image is not available");
        });

    it("WHEN wizard for new Image Selector(1:1) has been opened THEN options filter input should be displayed AND uploader button should be enabled AND the content is invalid",
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
            // 5. Verify that the content is invalid
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
            // 1. Open existing valid content with selected image:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. click on the image:
            await imageSelectorForm.clickOnSelectedImage(IMAGE_DISPLAY_NAME1);
            // 3. Click on 'Remove' button:
            await imageSelectorForm.clickOnRemoveButton();
            // 4. Verify that the content gets invalid now:
            await contentWizard.waitUntilInvalidIconAppears();
            // 5. Verify that default action is 'Create Issue':
            await contentWizard.waitForCreateIssueButtonDisplayed();
            // 6. Validation recording gets visible now:
            let record = await imageSelectorForm.getSelectorValidationMessage();
            assert.equal(record, 'This field is required', "Expected validation record gets visible");
            // 7. Remove button should be not visible:
            await imageSelectorForm.waitForRemoveButtonNotDisplayed();
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
