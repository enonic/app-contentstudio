/**
 * Created on 21.11.2023
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
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('layot.insert.save.as.fragment.spec - tests for inserting a fragment with image in a lyout', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTROLLER_NAME = 'main region';
    const LAYOUT_NAME = "3-col";
    const TEST_IMAGE = appConst.TEST_IMAGES.POP_03;
    const TEST_IMAGE_2 = appConst.TEST_IMAGES.POP_02;

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    // verifies task: Images inside Text component failed to render after saving as fragment… #7082
    it(`GIVEN text has been inserted in left region in 3-column layout WHEN the layout has been saved as fragment THEN the image should be displayed in the LiveEdit`,
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
            // 3. Insert the Layout component (3-column):
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Layout']);
            await liveFormPanel.selectLayoutByDisplayName(LAYOUT_NAME);
            await contentWizard.waitForNotificationMessage();
            // 4. Insert a text component in the left layout's region
            await pageComponentView.openMenu('left');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await contentWizard.switchToLiveEditFrame();
            // 5. Insert an image in the left region
            await textComponentCke.clickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            await insertImageDialog.filterAndSelectImage(TEST_IMAGE);
            await insertImageDialog.clickOnDecorativeImageRadioButton();
            await insertImageDialog.clickOnInsertButton();
            // 6. Save the layout-component as fragment:
            await pageComponentView.openMenu(LAYOUT_NAME);
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            await contentWizard.pause(700);
            await contentWizard.switchToLiveEditFrame();
            // 7. Verify the image in the layout fragment-component
            let srcAttr = await liveFormPanel.verifyImageElementsInFragmentComponent(0);
            await contentWizard.switchToParentFrame();
            assert.ok(srcAttr.includes('/admin/rest'), "Image in the fragment - Attribute 'src' is not correct");
        });

    it(`GIVEN existing layout-fragment is opened WHEN an image has been inserted in the center region THEN LiveEdit should be updated in the its site`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let insertImageDialog = new InsertImageDialog();
            let pageComponentView = new PageComponentView();
            let liveFormPanel = new LiveFormPanel();
            let textComponentCke = new TextComponentCke();
            // 1. open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Switch to the browse panel
            await studioUtils.doSwitchToContentBrowsePanel();
            // 3. Open the layout-fragment in filtered grid:
            await contentBrowsePanel.clickOnExpanderIcon(SITE.displayName);
            await contentBrowsePanel.clickOnRowByName('fragment-3-col');
            await studioUtils.doClickOnEditAndOpenContent('3-col');
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 4. Insert a text component in 'center' region:
            await pageComponentView.openMenu('center');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            // 5. Insert an image in the layout-fragment:
            await contentWizard.switchToLiveEditFrame();
            await textComponentCke.clickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            await insertImageDialog.filterAndSelectImage(TEST_IMAGE_2);
            await insertImageDialog.clickOnDecorativeImageRadioButton();
            await insertImageDialog.clickOnInsertButton();
            // 6. Save the fragment-content:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            // 7. Switch to the site-wizard:
            await studioUtils.switchToContentTabWindow(SITE.displayName);
            await contentWizard.switchToLiveEditFrame();
            // 8. Verify that Live Edit is updated in the site, both  images are present in the site:
            let srcAttr1 = await liveFormPanel.verifyImageElementsInFragmentComponent(0);
            let srcAttr2 = await liveFormPanel.verifyImageElementsInFragmentComponent(1);
            await contentWizard.switchToParentFrame();
            assert.ok(srcAttr1.includes('/admin/rest'), "Image in the fragment - Attribute 'src' is not correct");
            assert.ok(srcAttr2.includes('/admin/rest'), "Image in the fragment - Attribute 'src' is not correct");
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
