/**
 * Created on 09.07.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const InsertImageDialog = require('../../page_objects/wizardpanel/html-area/insert.image.dialog.cke');
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const appConst = require('../../libs/app_const');

describe("text.component.image.caption.spec: Inserts a text component with an image and checks the caption", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;
    const CAPTION = 'my caption';
    const TEST_IMAGE = appConst.TEST_IMAGES.POP_03;

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`WHEN image with caption has been inserted in text component THEN the caption should be present in Page Editor`,
        async () => {
            let pageComponentView = new PageComponentView();
            let contentWizard = new ContentWizard();
            let textComponent = new TextComponentCke();
            let insertImageDialog = new InsertImageDialog();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            //automatic template does not exist, so no need to unlock the editor
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert new text component:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, appConst.PCV_MENU_ITEM.TEXT]);
            await contentWizard.switchToLiveEditFrame();
            await textComponent.clickOnInsertImageButton();
            // 4. Insert an image in the text component:
            await insertImageDialog.filterAndSelectImage(appConst.TEST_IMAGES.SENG);
            await insertImageDialog.clickOnDecorativeImageRadioButton();
            // 5. Fill in the Caption input an insert the image:
            await insertImageDialog.typeCaption(CAPTION);
            await insertImageDialog.clickOnInsertButton();
            await insertImageDialog.waitForDialogClosed();
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('text_component_image_caption');
            await contentWizard.waitForNotificationMessage();
            await contentWizard.switchToLiveEditFrame();
            // 6. Verify that the caption is present in Page Editor:
            await liveFormPanel.waitForCaptionDisplayed(CAPTION);
            await contentWizard.switchToParentFrame();
            // Remove the text component by caption text
            await pageComponentView.openMenu(CAPTION);
            await pageComponentView.selectMenuItem(['Remove']);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    //Verifies: Browser hangs after a page with an open modal dialogs is refreshed #5003
    //          Insert Image dialog - upload button is not displayed in the dialog #5002
    it(`GIVEN text component is inserted WHEN insert image dialog has been opened THEN Upload button should be present in the modal dialog`,
        async () => {
            let pageComponentView = new PageComponentView();
            let contentWizard = new ContentWizard();
            let textComponent = new TextComponentCke();
            let insertImageDialog = new InsertImageDialog();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert new text component:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, appConst.PCV_MENU_ITEM.TEXT]);
            await contentWizard.switchToLiveEditFrame();
            // 4. Open Insert Image modal dialog:
            await textComponent.clickOnInsertImageButton();
            // 5. Verify that 'Upload' button is present in the dialog:
            await insertImageDialog.waitForUploadButtonDisplayed();
            await insertImageDialog.clickOnCancelButton();
        });

    // Verify https://github.com/enonic/app-contentstudio/issues/7082
    // Images inside Text component failed to render after saving as fragment
    it(`GIVEN an image has been inserted in text-component WHEN the component has been saved as fragment THEN image element should be with correct src-attribute`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            let insertImageDialog = new InsertImageDialog();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open the existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert new text-component
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, appConst.PCV_MENU_ITEM.TEXT]);
            await textComponentCke.switchToLiveEditFrame();
            // 4. Open 'Insert Image' dialog and insert an image in htmlArea:
            await textComponentCke.clickOnInsertImageButton();
            await insertImageDialog.filterAndSelectImage(TEST_IMAGE);
            await insertImageDialog.clickOnDecorativeImageRadioButton();
            await insertImageDialog.clickOnInsertButton();
            // 5. Save the text-component as fragment:
            await pageComponentView.openMenu('Text');
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            await contentWizard.pause(700);
            await contentWizard.switchToLiveEditFrame();
            // 6. Verify the image in fragment-component
            let srcAttr = await liveFormPanel.verifyImageElementsInFragmentComponent(0);
            await contentWizard.switchToParentFrame();
            assert.ok(srcAttr.includes('/admin/rest'), "Image in the fragment - Attribute 'src' is not correct");
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
