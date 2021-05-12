/**
 * Created on 01.02.2019.
 *
 * Verifies : https://github.com/enonic/app-contentstudio/issues/77
 * Incorrect behavior after applying changes in Inspection Panel
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const ImageInspectPanel = require('../../page_objects/wizardpanel/liveform/inspection/image.inspection.panel');

describe("image.component.inspect.panel.spec: Inserts a image component and checks 'Inspect Panel' on the Context Window ",
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();

        let IMAGE_DISPLAY_NAME = 'kotey';
        let SITE;
        let CONTROLLER_NAME = 'main region';

        it(`Preconditions: new site should be created`,
            async () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES], CONTROLLER_NAME);
                await studioUtils.doAddSite(SITE);
            });

        it(`GIVEN existing site is opened AND an image has been inserted WHEN a caption has been typed AND 'Apply' button pressed THEN the site is getting 'saved'`,
            async () => {
                let pageComponentView = new PageComponentView();
                let liveFormPanel = new LiveFormPanel();
                let contentWizard = new ContentWizard();
                let imageInspectPanel = new ImageInspectPanel();
                //1. Open existing site:
                await studioUtils.selectContentAndOpenWizard(SITE.displayName);
                //automatic template does not exist, so no need to unlock the editor
                await contentWizard.clickOnShowComponentViewToggler();
                //2. Insert image component, select an image and set a caption:
                await pageComponentView.openMenu("main");
                await pageComponentView.selectMenuItemAndCloseDialog(["Insert", "Image"]);
                await liveFormPanel.selectImageByDisplayName(IMAGE_DISPLAY_NAME);
                await contentWizard.switchToMainFrame();
                await imageInspectPanel.typeCaption("test image");
                //3. Click on 'Apply' button:
                await imageInspectPanel.clickOnApplyButton();
                await contentWizard.switchToMainFrame();
                //4. Verify - the site should be automatically saved, because Apply button was pressed
                let actualMessage = await contentWizard.waitForNotificationMessage();
                //5. Verify the notification message after clicking on Apply button:
                studioUtils.saveScreenshot('inspect_image_panel_applied');
                let expectedMessage = appConstant.itemSavedNotificationMessage(SITE.displayName);
                assert.equal(actualMessage, expectedMessage, "expected notification message should appear")
            });

        //Verifies  Apply button in the Inspect panel shouldn't save content when no changes have been made (#2151).
        it(`GIVEN existing site with image-component is opened WHEN no changes in inspection AND Apply button has been pressed THEN updated caption should be present in the text area`,
            async () => {
                let contentWizard = new ContentWizard();
                let pageComponentView = new PageComponentView();
                let imageInspectPanel = new ImageInspectPanel();
                //1. Open existing site and open Page Component View:
                await studioUtils.selectContentAndOpenWizard(SITE.displayName);
                await contentWizard.clickOnShowComponentViewToggler();
                //2. Click on 'Mark as Ready' button then remove the notification message:
                await contentWizard.clickOnMarkAsReadyButton();
                await contentWizard.waitForNotificationMessage();
                await contentWizard.removeNotificationMessage();
                //3. Click on 'Apply' button
                await pageComponentView.clickOnComponent(IMAGE_DISPLAY_NAME);
                await imageInspectPanel.clickOnApplyButton();
                await imageInspectPanel.pause(1000);
                let result = await contentWizard.isNotificationMessageDisplayed();
                assert.isFalse(result, "Notification message should not be displayed when no changes have been made");
                //6. Verify the content is not updated and the workflow state is not changed::
                let status = await contentWizard.getToolbarWorkflowState();
                assert.equal(status, appConstant.WORKFLOW_STATE.READY_FOR_PUBLISHING);
            });

        //verifies https://github.com/enonic/app-contentstudio/issues/77
        it(`GIVEN existing site with image-component is opened WHEN the caption in inspection panel has been updated THEN updated caption should be present in the text area`,
            async () => {
                let contentWizard = new ContentWizard();
                let pageComponentView = new PageComponentView();
                let imageInspectPanel = new ImageInspectPanel();
                //1. Open existing site and open Page Component View:
                await studioUtils.selectContentAndOpenWizard(SITE.displayName);
                await contentWizard.clickOnShowComponentViewToggler();
                await pageComponentView.clickOnComponent(IMAGE_DISPLAY_NAME);
                //2. Verify that image inspection panel should be loaded automatically
                await imageInspectPanel.waitForOpened();
                //3. Type the text in caption area:
                await imageInspectPanel.typeCaption("new caption");
                //4. click on Apply button:
                await imageInspectPanel.clickOnApplyButton();
                //5. Update the caption:
                await imageInspectPanel.typeCaption("test caption");
                await imageInspectPanel.clickOnApplyButton();
                //6. Verify that notification message appears after clicking on Apply button:
                await contentWizard.waitForNotificationMessage();
                await imageInspectPanel.pause(300);
                //6. Verify the text in caption-area:
                let actualCaption = await imageInspectPanel.getCaptionText();
                assert.equal(actualCaption, "test caption", "caption should be updated successfully");
                //7. Verify that workflow state is updated as well:
                //TODO uncomment it after fixing the issue https://github.com/enonic/app-contentstudio/issues/3150
                //let status = await contentWizard.getToolbarWorkflowState();
                //assert.equal(status, appConstant.WORKFLOW_STATE.WORK_IN_PROGRESS);
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });
