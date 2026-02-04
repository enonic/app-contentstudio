/**
 * Created on 26.01.2024
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const LiveFormPanel = require('../../page_objects/wizardpanel/liveform/live.form.panel');
const appConst = require('../../libs/app_const');
const InsertImageDialog = require('../../page_objects/wizardpanel/html-area/insert.image.dialog.cke');

describe('image.text.component.as.fragment.spec - tests for saving an image as fragment', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTROLLER_NAME = 'main region';
    const TEST_IMAGE = appConst.TEST_IMAGES.POP_03;

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    // verifies task: Images inside Text component failed to render in a fragment #7075
    it(`GIVEN an image has been inserted in text component WHEN the component has been saved as fragment AND the page has been refreshed THEN the image should be displayed in the LiveEdit`,
        async () => {
            let contentWizard = new ContentWizard();
            let insertImageDialog = new InsertImageDialog();
            let pageComponentView = new PageComponentView();
            let liveFormPanel = new LiveFormPanel();
            let textComponentCke = new TextComponentCke();
            // 1. open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Maximize the Live Edit:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert a text component:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, appConst.PCV_MENU_ITEM.TEXT]);
            await contentWizard.switchToLiveEditFrame();
            // 4. Insert an image in the text component
            await textComponentCke.clickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            await insertImageDialog.filterAndSelectImage(TEST_IMAGE);
            await insertImageDialog.clickOnDecorativeImageRadioButton();
            await insertImageDialog.clickOnInsertButton();
            // 5. Save the text-component as fragment:
            await pageComponentView.openMenu('Text');
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            await studioUtils.switchToContentTabWindow(SITE.displayName);
            await contentWizard.pause(700);
            await contentWizard.refresh();
            await contentWizard.pause(2000);
            await contentWizard.switchToLiveEditFrame();
            // Verify the issue - Images inside Text component failed to render in a fragment #7075
            // 6. Verify that the inserted image is correctly rendered in the fragment component:
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
