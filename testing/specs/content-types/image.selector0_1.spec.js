/**
 * Created on 20.04.2021.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ImageSelectorForm = require('../../page_objects/wizardpanel/imageselector.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('image.selector0_1.spec tests for not required image selector',
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();
        const CONTENT_NAME = contentBuilder.generateRandomName('content');

        const IMAGE_DISPLAY_NAME1 = appConstant.TEST_IMAGES.SEVEROMOR;
        let SITE;

        it(`Precondition: new site should be added`,
            async () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App']);
                await studioUtils.doAddSite(SITE);
            });

        it("GIVEN wizard for new Image Selector(0:1) has been opened WHEN name has been typed THEN options filter input should be displayed AND uploader button should be enabled AND the content gets valid",
            async () => {
                let imageSelectorForm = new ImageSelectorForm();
                let contentWizard = new ContentWizard();
                //1. Open new wizard
                await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_0_1);
                //2. Fill the name input:
                await contentWizard.typeDisplayName(CONTENT_NAME);
                //3. Verify that options filter input is displayed
                await imageSelectorForm.waitForOptionsFilterInputDisplayed();
                //4. Verify that the content is valid
                let result = await contentWizard.isContentInvalid();
                assert.isFalse(result, "This content should be valid, because the image selector is not required input");
                //5. Click on Mark as ready button:
                await contentWizard.clickOnMarkAsReadyButton();
                await contentWizard.waitForNotificationMessage();
                await studioUtils.saveScreenshot("test_workflow_icon");
                //6. Verify that 'Save' button gets disabled:
                await contentWizard.waitForSaveButtonDisabled();
                //7. Verify the workflow state:
                let iconState = await contentWizard.getIconWorkflowState();
                assert.equal(iconState, appConstant.WORKFLOW_STATE.READY_FOR_PUBLISHING, "The content gets 'Ready for publishing'");
            });

        it(`GIVEN existing content (image is not selected) opened WHEN an image has been selected THEN content gets Work in progress`,
            async () => {
                let imageSelectorForm = new ImageSelectorForm();
                let contentWizard = new ContentWizard();
                //1. Open existing content (image is not selected):
                await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
                //2. select an image:
                await imageSelectorForm.filterOptionsAndSelectImage(IMAGE_DISPLAY_NAME1);
                //3. Verify the expected selected option:
                let names = await imageSelectorForm.getSelectedImages();
                assert.equal(names[0], IMAGE_DISPLAY_NAME1);
                //4. Verify that options filter input is not displayed:
                await imageSelectorForm.waitForOptionsFilterInputNotDisplayed();
                //5. Verify that 'Save' button gets enabled:
                await contentWizard.waitForSaveButtonEnabled();
                await studioUtils.saveScreenshot("test_workflow_icon_2");
                //6. Verify the workflow state:
                let iconState = await contentWizard.getIconWorkflowState();
                assert.equal(iconState, appConstant.WORKFLOW_STATE.WORK_IN_PROGRESS, "The content gets 'Ready for publishing'");
                await contentWizard.waitAndClickOnSave();
            });

        it("GIVEN existing content is opened WHEN selected image has been removed THEN the content remains valid",
            async () => {
                let imageSelectorForm = new ImageSelectorForm();
                let contentWizard = new ContentWizard();
                //1. Open existing valid content with selected image:
                await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
                //2. click on the image:
                    await imageSelectorForm.clickOnSelectedImage(IMAGE_DISPLAY_NAME1);
                //3. Click on 'Remove' button:
                await imageSelectorForm.clickOnRemoveButton();
                await studioUtils.saveScreenshot("test_workflow_icon_3");
                //4. Verify that default action is 'Mark as Ready':
                await contentWizard.waitForMarkAsReadyButtonVisible();
                //5. Verify that the content remains valid:
                let isInvalid = await contentWizard.isContentInvalid();
                assert.isFalse(isInvalid, "The content remains valid after removing the selected image");
                //7. Remove button should be not visible:
                await imageSelectorForm.waitForRemoveButtonNotDisplayed();
                //7. Verify that Save button gets enabled:
                await contentWizard.waitForSaveButtonEnabled();
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });
