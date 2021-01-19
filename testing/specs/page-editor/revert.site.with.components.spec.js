/**
 * Created on 05.11.2019.
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
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');

describe("revert.site.with.component.spec: Insert image component then revert the previous version and check Live Frame",
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();

        let IMAGE_DISPLAY_NAME = 'seng';
        let SITE;
        let CONTROLLER_NAME = 'main region';

        it(`Preconditions: new site should be created`,
            async () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES], CONTROLLER_NAME);
                await studioUtils.doAddSite(SITE);
            });

        it(`Preconditions: GIVEN existing site is opened AND an image has been inserted`,
            async () => {
                let contentWizard = new ContentWizard();
                let pageComponentView = new PageComponentView();
                let liveFormPanel = new LiveFormPanel();
                await studioUtils.selectContentAndOpenWizard(SITE.displayName);
                //1. Open  'Page Component View' dialog:
                await contentWizard.clickOnShowComponentViewToggler();
                //2. Open the context menu:
                await pageComponentView.openMenu("main");
                //3. Click on the 'Insert image' menu item:
                await pageComponentView.selectMenuItem(["Insert", "Image"]);
                //4. Close the 'Page Component View' dialog:
                await pageComponentView.clickOnCloseButton();
                //5. Select the image in the Page Editor:
                await liveFormPanel.selectImageByDisplayName(IMAGE_DISPLAY_NAME);
                //6. The image should appear in Live Frame:
                await liveFormPanel.waitForImageDisplayed(IMAGE_DISPLAY_NAME);
                await contentWizard.switchToMainFrame();
                //The site should be saved automatically!
                await contentWizard.waitForSaveButtonDisabled();
            });

        it(`GIVEN existing site with image component is opened WHEN do right click on the image-component THEN component's context menu should appear`,
            async () => {
                let contentWizard = new ContentWizard();
                let liveFormPanel = new LiveFormPanel();
                //1. Open the site with inserted image:
                await studioUtils.selectContentAndOpenWizard(SITE.displayName);
                let position = await contentWizard.getLiveFramePosition();
                //2. Do right click on the image-component:
                await contentWizard.switchToLiveEditFrame();
                await liveFormPanel.doRightClickOnImageComponent(IMAGE_DISPLAY_NAME, position.x, position.y);
                studioUtils.saveScreenshot("image_component_context_menu");
                //3. Verify menu items:
                let result = await liveFormPanel.getItemViewContextMenuItems();
                assert.equal(result[0], 'Select parent');
                assert.equal(result[1], 'Insert');
                assert.equal(result[2], "Inspect");
                assert.equal(result[3], "Reset");
                assert.equal(result[4], "Remove");
                assert.equal(result[5], "Duplicate");
                assert.equal(result[6], "Save as Fragment");
                assert.equal(result[7], "Edit");
            });

        //Verifies https://github.com/enonic/xp/issues/7603  (Page changes are not reverted on version revert )
        it(`GIVEN existing site with image component is opened WHEN the version without the image has been reverted THEN the image should not be present in Live Edit frame`,
            async () => {
                let contentWizard = new ContentWizard();
                let versionPanel = new WizardVersionsWidget();
                let liveFormPanel = new LiveFormPanel();
                await studioUtils.selectContentAndOpenWizard(SITE.displayName);
                //1. Open  'Versions Panel':
                await contentWizard.openVersionsHistoryPanel();
                //2. Revert the previous version:
                await versionPanel.clickAndExpandVersion(1);
                await versionPanel.clickOnRevertButton();
                studioUtils.saveScreenshot("site_reverted1");
                await contentWizard.switchToLiveEditFrame();
                //3. After reverting - Image should not be present in Live Frame
                await liveFormPanel.waitForImageNotDisplayed(IMAGE_DISPLAY_NAME);
                await contentWizard.switchToMainFrame();
                //4.Verify - Save button should be disabled after the reverting:
                await contentWizard.waitForSaveButtonDisabled();
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });
