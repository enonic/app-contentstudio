/**
 * Created on 15.11.2023  updated on 01.07.2026
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentDuplicateDialog = require('../../page_objects/content.duplicate.dialog');
const PageComponentView = require('../../page_objects/wizardpanel/liveform/page.components.view');
const InsertImageDialog = require('../../page_objects/wizardpanel/html-area/insert.image.dialog.cke');
const DeleteContentDialog = require('../../page_objects/delete.content.dialog');
const TextComponentInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/text.component.inspect.panel');

describe('publish.wizard.deleted.dependencies.spec: tests for dependant items', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_624991;
    let IMPORTED_SHORTCUT_NAME = appConst.TEST_DATA.IMPORTED_SHORTCUT_518816;
    const TEST_IMAGE_PATH = appConst.TEST_IMAGES.CAPE + '.jpg-copy';

    it(`Precondition 1: new site should be created`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentDuplicateDialog = new ContentDuplicateDialog();
        await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.CAPE);
        await contentBrowsePanel.clickOnDuplicateButtonAndWait();
        await contentDuplicateDialog.clickOnDuplicateButton();
        await contentDuplicateDialog.waitForDialogClosed();
    });

    it(`Precondition 3: insert the image in the site`, async () => {
        let pageComponentView = new PageComponentView();
        let contentWizard = new ContentWizard();
        let insertImageDialog = new InsertImageDialog();
        let textComponentInspectionPanel = new TextComponentInspectionPanel();
        // 1. Open shortcut-wizard:
        await studioUtils.selectContentAndOpenWizard(IMPORTED_SITE_NAME);
        // 2. Maximize the Live Edit:
        await contentWizard.clickOnCollapseContentForm();
        // 3. Insert the text component:
        await pageComponentView.rightClickAndOpenContextMenu('main');
        await pageComponentView.selectContextMenuItem([
            appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT,
            appConst.PCV_MENU_ITEM.TEXT,
        ]);
        await textComponentInspectionPanel.clickInTextArea();
        await textComponentInspectionPanel.clickOnInsertImageButton();
        // 4. Open 'Insert Image' dialog and insert an image in htmlArea:
        await insertImageDialog.filterAndSelectImageByPath(appConst.TEST_IMAGES.CAPE + '.jpg-copy');
        await insertImageDialog.clickOnDecorativeImageRadioButton();
        await insertImageDialog.clickOnInsertButton();
        await insertImageDialog.waitForDialogClosed();
        await contentWizard.clickOnMarkAsReadyButton();
        await contentWizard.waitForNotificationMessage();
    });

    // Verify Missing outbound references prevent publishing of content #7066
    // https://github.com/enonic/app-contentstudio/issues/7066
    it(`GIVEN outbound dependency has been deleted WHEN shortcut with outbound dependency has been selected AND Publish menu item has been clicked THEN Publish wizard should be loaded with Outbound dependencies are not required for publishing AND outbound reference to a deleted item should not prevent publishing.
`, async () => {
        let deleteContentDialog = new DeleteContentDialog();
        let contentPublishDialog = new ContentPublishDialog();
        let contentBrowsePanel = new ContentBrowsePanel();
        // 1. Delete the image (outbound dependency in the site)
        await studioUtils.findAndSelectItem(TEST_IMAGE_PATH);
        await contentBrowsePanel.clickOnDeleteButton();
        await deleteContentDialog.waitForDialogOpened();
        await deleteContentDialog.clickOnIgnoreInboundReferences();
        await deleteContentDialog.clickOnDeleteButton();
        await deleteContentDialog.waitForDialogClosed();
        // 2. Select the shortcut:
        await studioUtils.findAndSelectItem(IMPORTED_SHORTCUT_NAME);
        // 3. Click on Publish button
        await contentBrowsePanel.clickOnPublishButton();
        await contentPublishDialog.waitForDialogOpened();
        await studioUtils.saveScreenshot('publish_outbound_item_deleted');
        // 4. Verify that Publish Now button is enabled
        await contentPublishDialog.waitForPublishNowButtonEnabled();
    });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
