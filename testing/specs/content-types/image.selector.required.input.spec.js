/**
 * Created on 23.11.2020.  updated on 26.06.2026
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
    const IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_NAME;

    // Verify the bug - hideToggleIcon config doesn't work in selectors #8532
    // https://github.com/enonic/app-contentstudio/issues/8532
    it(`WHEN image-content with hidden toggle mode is opened THEN toggle icon should not be displayed in the Image Selector`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            // 1. Open new wizard for content with image selector(tree mode, toggle is hidden):
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.IMG_SEL_TOGGLE_HIDDEN);
            await studioUtils.saveScreenshot('img_sel_toggle_hidden');
            // 2. Verify that the toggle icon is not displayed in the Image Selector
            await imageSelectorForm.waitForToggleIconNotDisplayed();
            // 3. Insert an image-name in the filter input:
            await imageSelectorForm.typeTextInOptionsFilterInput(appConst.TEST_IMAGES.SPUMANS);
            // 4. Verify that the toggle icon is not displayed in the Image Selector, because the toggle icon is hidden in the config:
            await imageSelectorForm.waitForToggleIconNotDisplayed();
        });

    // Image Selector - exception thrown after removing selected options in another browser tab #10921
    it(`GIVEN an image has been selected in an image-content WHEN the image has been archived THEN 'Image is not available' should be displayed in the content-wizard`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            let contentWizard = new ContentWizard();
            let browsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            // 1. Open new wizard
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.IMG_SELECTOR_1_1);
            // 2. Fill the name input:
            await contentWizard.typeDisplayName(CONTENT_NAME_2);
            // 3. Select an image in the required input:
            await imageSelectorForm.filterOptionsAndSelectImage(IMAGE_DISPLAY_NAME2);
            await contentWizard.waitAndClickOnSave();
            await studioUtils.doSwitchToContentBrowsePanel();
            // 4. Delete the image:
            await browsePanel.clickOnResetSelectionCheckbox();
            await studioUtils.findContentAndClickCheckBox(IMAGE_DISPLAY_NAME2);
            // Open Delete content modal  dialog:
            await browsePanel.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogOpened();
            await deleteContentDialog.clickOnIgnoreInboundReferences();
            await deleteContentDialog.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogClosed();
            await studioUtils.switchToContentTabWindow(CONTENT_NAME_2);
            // 5. Verify that the content remains valid:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "The content should be valid after deleting its selected option");
            // 6. Verify that text 'Image is not available' is displayed in the single selected option:
            let items = await imageSelectorForm.waitForImageNotAvailableTextDisplayed();
            assert.equal(items, 1, "One selected option should be with 'Image is not available' text");
            // 7. Verify that 'Edit' button is not displayed:
            await imageSelectorForm.waitForEditButtonForNotAvailableImageNotDisplayed();
            // 8. Remove button should be enabled:
            await imageSelectorForm.waitForRemoveButtonForNotAvailableImageEnabled();
        });

    it("WHEN content with an unavailable required image is filtered THEN it should be displayed without a red invalid icon",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select existing content with one required image:
            await studioUtils.findAndSelectItem(CONTENT_NAME_2);
            // 2. Verify that the content is invalid, because the selected required image was deleted in the previous step:
            let isInvalid = await contentBrowsePanel.isRedIconDisplayed(CONTENT_NAME_2);
            assert.ok(isInvalid === false, "The content should be valid even if the selected image is unavailable.");
        });

    it("WHEN wizard for new Image Selector(1:1) has been opened THEN options filter input should be displayed AND uploader button should be enabled AND the content is invalid",
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            let contentWizard = new ContentWizard();
            // 1. Open new wizard
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.IMG_SELECTOR_1_1);
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

    it(`GIVEN existing content with no image selected WHEN an image is selected, THEN the content becomes valid.`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            let contentWizard = new ContentWizard();
            // 1. Open existing not valid content:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. select an image:
            await imageSelectorForm.filterOptionsAndSelectImage(IMAGE_DISPLAY_NAME1);
            // 3. Verify that the content gets valid:
            await contentWizard.waitUntilInvalidIconDisappears();
            // 4. Save the content
            await contentWizard.waitAndClickOnSave();
            // 5. Verify the expected selected option:
            let names = await imageSelectorForm.getSelectedImagesDisplayNames();
            assert.equal(names[0], IMAGE_DISPLAY_NAME1);
            // 6. Verify that options filter input is not displayed:
            await imageSelectorForm.waitForOptionsFilterInputNotDisplayed();
        });

    it("GIVEN existing content is opened WHEN selected image has been removed THEN the content gets invalid again",
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            let contentWizard = new ContentWizard();
            // 1. Open existing valid content with selected image:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. Click on 'Remove' button:
            await imageSelectorForm.clickOnRemoveButton(IMAGE_DISPLAY_NAME1);
            // 3. Verify that the content gets invalid now:
            await contentWizard.waitUntilInvalidIconAppears();
            // 4. Verify that default action is 'Create Issue':
            await contentWizard.waitForCreateIssueButtonDisplayed();
            // 5. Validation recording gets visible now:
            let record = await imageSelectorForm.getSelectorValidationMessage();
            assert.equal(record, 'This field is required', "Expected validation record gets visible");
            // 6. Remove button should be not visible:
            await imageSelectorForm.waitForRemoveButtonNotDisplayed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
