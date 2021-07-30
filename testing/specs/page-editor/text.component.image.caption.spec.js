/**
 * Created on 09.07.2021
 *
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const InsertImageDialog = require('../../page_objects/wizardpanel/insert.image.dialog.cke');
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");

describe("text.component.image.caption.spec: Inserts a text component with an image and checks the caption",
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();

        let SITE;
        let CONTROLLER_NAME = 'main region';
        const CAPTION = "my caption";

        it(`Preconditions: new site should be created`,
            async () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES], CONTROLLER_NAME);
                await studioUtils.doAddSite(SITE);
            });

        it(`WHEN image with caption has been inserted in text component THEN the caption should be present in Page Editor`,
            async () => {
                let pageComponentView = new PageComponentView();
                let contentWizard = new ContentWizard();
                let textComponent = new TextComponentCke();
                let insertImageDialog = new InsertImageDialog();

                let liveFormPanel = new LiveFormPanel();
                //1. Open existing site:
                await studioUtils.selectContentAndOpenWizard(SITE.displayName);
                //automatic template does not exist, so no need to unlock the editor
                await contentWizard.clickOnShowComponentViewToggler();
                //2. Insert new text component:
                await pageComponentView.openMenu("main");
                await pageComponentView.selectMenuItemAndCloseDialog(["Insert", "Text"]);
                await contentWizard.switchToLiveEditFrame();
                await textComponent.clickOnInsertImageButton();
                //3. Insert an image in the text component:
                await insertImageDialog.filterAndSelectImage(appConstant.TEST_IMAGES.SENG);
                //4. Fill inn the Caption input an insert the image:
                await insertImageDialog.typeCaption(CAPTION);
                await insertImageDialog.clickOnInsertButton();
                await insertImageDialog.waitForDialogClosed();
                await contentWizard.waitAndClickOnSave();
                studioUtils.saveScreenshot('text_component_image_caption');
                await contentWizard.waitForNotificationMessage();
                await contentWizard.switchToLiveEditFrame();
                //5. Verify that the caption is present in Page Editor:
                await liveFormPanel.waitForCaptionDisplayed(CAPTION);

            });


        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });
