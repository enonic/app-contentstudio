/**
 * Created on 30.11.2017.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const DeleteContentDialog = require('../page_objects/delete.content.dialog');

describe('Delete a content that has inbound references.', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SHORTCUT;

    it(`GIVEN existing shortcut with a target WHEN the target-content has been selected AND 'Delete' button pressed THEN expected warning should be displayed in the dialog`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            let displayName = contentBuilder.generateRandomName('shortcut');
            SHORTCUT = contentBuilder.buildShortcut(displayName, appConstant.TEST_IMAGES.WHALE);
            //1. new Shortcut-content has been added and selected:
            await studioUtils.doAddShortcut(SHORTCUT);
            await studioUtils.findAndSelectItem(appConstant.TEST_IMAGES.WHALE);
            //2. Delete button has been clicked:
            await contentBrowsePanel.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogOpened();
            //3. Verify that expected warning is displayed in the dialog:
            await studioUtils.saveScreenshot("delete_dialog_inbound_ref");
            let warning = await deleteContentDialog.getInboundDependenciesWarning();
            assert.equal(warning, appConstant.DELETE_INBOUND_MESSAGE, 'expected warning should be displayed in thr dialog');
        });

    it(`GIVEN existing image(target in the shortcut ) is selected AND Delete content dialog is opened WHEN 'Show Inbound' link has been clicked THEN expected inbound dependencies should be filtered in new browser tab`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            //1.Click on the image, that was selected in the shortcut
            await studioUtils.findAndSelectItem(appConstant.TEST_IMAGES.WHALE);
            //2. Delete button has been clicked:
            await contentBrowsePanel.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogOpened();
            //3. Click on 'Show Inbound' link:
            await deleteContentDialog.clickOnShowInboundLink(appConstant.TEST_IMAGES.WHALE);
            await studioUtils.doSwitchToNextTab();
            //4. Verify that expected shortcut should be filtered in the grid:
            let displayNames = await contentBrowsePanel.getDisplayNamesInGrid();
            await studioUtils.saveScreenshot("inbound_1");
            assert.equal(displayNames[0], SHORTCUT.displayName, "Expected shortcut should be filtered in the grid");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
