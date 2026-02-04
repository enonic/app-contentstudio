/**
 * Created on 15.11.2023
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const ShortcutForm = require('../../page_objects/wizardpanel/shortcut.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentDuplicateDialog = require('../../page_objects/content.duplicate.dialog');
const PageComponentView = require('../../page_objects/wizardpanel/liveform/page.components.view');
const TextComponentCke = require('../../page_objects/components/text.component');
const InsertImageDialog = require('../../page_objects/wizardpanel/html-area/insert.image.dialog.cke');
const DeleteContentDialog = require('../../page_objects/delete.content.dialog');

describe('publish.dialog.dependant.items.spec: tests for dependant items', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let SHORTCUT_NAME = appConst.generateRandomName('sh');
    const CONTROLLER_NAME = 'Page';
    const TEST_IMAGE_NAME = appConst.TEST_IMAGES.CAPE + '.jpg-copy';

    it(`Precondition 1: new site should be created`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentDuplicateDialog = new ContentDuplicateDialog();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.CAPE);
            await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            await contentDuplicateDialog.clickOnDuplicateButton();
            await contentDuplicateDialog.waitForDialogClosed();
        });

    it(`Precondition 2: new shortcut should be added`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            // 1. Open shortcut-wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            await contentWizard.typeDisplayName(SHORTCUT_NAME);
            // 2. Select the site in target-selector:
            await shortcutForm.filterOptionsAndSelectTarget(SITE.displayName);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it(`Precondition 3: insert the image in the site`,
        async () => {
            let pageComponentView = new PageComponentView();
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let insertImageDialog = new InsertImageDialog();
            // 1. Open shortcut-wizard:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Maximize the Live Edit:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert the text component:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, appConst.PCV_MENU_ITEM.TEXT]);
            await textComponentCke.switchToLiveEditFrame();
            // 4. Open 'Insert Image' dialog and insert an image in htmlArea:
            await textComponentCke.clickOnInsertImageButton();
            await insertImageDialog.filterAndSelectImageByPath(TEST_IMAGE_NAME);
            await insertImageDialog.clickOnDecorativeImageRadioButton();
            await insertImageDialog.clickOnInsertButton();
            await insertImageDialog.waitForDialogClosed();
            await contentWizard.clickOnMarkAsReadyButton();
            await contentWizard.waitForNotificationMessage();
        });

    // Verify Missing outbound references prevent publishing of content #7066
    // https://github.com/enonic/app-contentstudio/issues/7066
    it(`GIVEN outbound dependency has been deleted WHEN shortcut with outbound dependency has been selected AND Publish menu item has been clicked THEN Publish wizard should be loaded with 'Mark as Ready' button`,
        async () => {
            let deleteContentDialog = new DeleteContentDialog();
            let contentPublishDialog = new ContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Delete the image (outbound dependency in the site)
            await studioUtils.findAndSelectItem(TEST_IMAGE_NAME);
            await contentBrowsePanel.clickOnArchiveButton();
            await deleteContentDialog.waitForDialogOpened();
            await deleteContentDialog.clickOnIgnoreInboundReferences();
            await deleteContentDialog.clickOnDeleteMenuItem();
            await deleteContentDialog.waitForDialogClosed();
            // 2. Select the shortcut:
            await studioUtils.findAndSelectItem(SHORTCUT_NAME);
            // 3. Click on Publish... menu item
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('publish_outbound_item_deleted');
            // 4. Verify that 'Mark as Ready' button is displayed in the dialog, then click on it
            await contentPublishDialog.waitForMarkAsReadyButtonDisplayed();
            await contentPublishDialog.clickOnMarkAsReadyButton();
            // 5. Verify that Publish Now button is enabled
            await contentPublishDialog.waitForPublishNowButtonEnabled();
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
