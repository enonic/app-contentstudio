/**
 * Created on 23.11.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const ImageSelectorForm = require('../page_objects/wizardpanel/imageselector.form.panel');
const DeleteContentDialog = require('../page_objects/delete.content.dialog');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');

describe('image.selector.required.input.spec tests for validation of content with required image',
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();
        let CONTENT_NAME = contentBuilder.generateRandomName('content');

        let IMAGE_DISPLAY_NAME1 = appConstant.TEST_IMAGES.PES;
        let SITE;

        it(`Precondition: new site should be added`,
            async () => {
                let contentBrowsePanel = new ContentBrowsePanel();
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App']);
                await studioUtils.doAddSite(SITE);
                await studioUtils.findAndSelectItem(SITE.displayName);
                await contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            });

        it(`Preconditions: content with required image-selector should be added`,
            async () => {
                let imageSelectorForm = new ImageSelectorForm();
                let contentWizard = new ContentWizard();
                await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_1_1);
                await contentWizard.typeDisplayName(CONTENT_NAME);
                //select the image:
                await imageSelectorForm.filterOptionsAndSelectImage(IMAGE_DISPLAY_NAME1);
                await contentWizard.waitAndClickOnSave();
            });
        it("Preconditions: just selected image should be deleted",
            async () => {
                let contentBrowsePanel = new ContentBrowsePanel();
                let deleteContentDialog = new DeleteContentDialog();
                await studioUtils.findAndSelectItem(IMAGE_DISPLAY_NAME1);
                //browse panel - select the image and delete it
                await contentBrowsePanel.clickOnDeleteButton(IMAGE_DISPLAY_NAME1);
                await deleteContentDialog.waitForDialogOpened();
                await deleteContentDialog.clickOnDeleteNowButton();
                await deleteContentDialog.waitForDialogClosed();
            });

        it("GIVEN existing content with Image selector is opened WHEN required image is deleted THEN this content remains valid",
            async () => {
                //1. Open existing content with one required image:
                let contentWizard = new ContentWizard();
                await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
                await contentWizard.pause(1000);
                //2. Verify that the content is valid, selected required image was deleted in the previous step:
                let isNotValid = await contentWizard.isContentInvalid();
                assert.isFalse(isNotValid, "This content remains valid");
            });

        it("GIVEN searching for item with deleted required image WHEN item appears in browse panel THEN the content should be displayed as valid",
            async () => {
                let contentBrowsePanel = new ContentBrowsePanel();
                //1. Select existing content with one required image:
                await studioUtils.findAndSelectItem(CONTENT_NAME);
                //2. Verify that the content is not valid, because the selected required image was deleted in the previous step:
                let isNotValid = await contentBrowsePanel.isRedIconDisplayed(CONTENT_NAME);
                assert.isFalse(isNotValid, "This content remains valid");
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });




