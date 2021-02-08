/**
 * Created on 21.03.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ImageFormPanel = require('../../page_objects/wizardpanel/image.form.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const ImageInspectPanel = require('../../page_objects/wizardpanel/liveform/inspection/image.inspection.panel');

describe("image.component.default.caption.spec: Type a caption in image-wizard and check it in an inserted image component",
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();

            let IMAGE_DISPLAY_NAME = appConstant.TEST_IMAGES.MAN2;
        let SITE;
        let CONTROLLER_NAME = 'main region';
            let EXPECTED_CAPTION = "man caption";

        it(`Preconditions: new site should be created`,
            async () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES], CONTROLLER_NAME);
                await studioUtils.doAddSite(SITE);
            });

        it(`GIVEN existing image is opened WHEN caption has been typed in the wizard AND the image has been saved THEN the caption should be saved`,
            async () => {
                let imageFormPanel = new ImageFormPanel();
                let contentWizard = new ContentWizard();
                //1. Open the image:
                await studioUtils.selectContentAndOpenWizard(IMAGE_DISPLAY_NAME);
                //2. Type a caption then save the image:
                await imageFormPanel.typeCaption(EXPECTED_CAPTION);
                await contentWizard.waitAndClickOnSave();
                //3. Get the saved caption in the image-wizard:
                let result = await imageFormPanel.getCaption();
                assert.equal(result, EXPECTED_CAPTION, "caption should be saved");
            });

        it(`GIVEN existing site is opened WHEN test image has been inserted THEN expected default caption should be present in the Image Inspection Panel`,
            async () => {
                let contentWizard = new ContentWizard();
                let pageComponentView = new PageComponentView();
                let imageInspectPanel = new ImageInspectPanel();
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
                await contentWizard.switchToMainFrame();
                //Default caption should be loaded in the Caption-Input
                let result = await imageInspectPanel.getCaptionText();
                studioUtils.saveScreenshot('inspect_image_panel_default_caption');
                assert.equal(result, EXPECTED_CAPTION, "actual and expected captions should be equal");
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });
