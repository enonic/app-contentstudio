/**
 * Created on 27.01.2022
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const MoveContentDialog = require('../../page_objects/browsepanel/move.content.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const contentBuilder = require('../../libs/content.builder');

describe('move.child.content.spec: Move a child content to another location then delete the parent folder', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let PARENT_FOLDER;
    let CHILD_FOLDER;
    let FOLDER;

    it(`Preconditions: three folders should be added`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName1 = appConst.generateRandomName('parent');
            let displayName2 = appConst.generateRandomName('child');
            let displayName3 = appConst.generateRandomName('folder');
            PARENT_FOLDER = contentBuilder.buildFolder(displayName1);
            CHILD_FOLDER = contentBuilder.buildFolder(displayName2);
            FOLDER = contentBuilder.buildFolder(displayName3);
            // 1. Add parent folder
            await studioUtils.doAddFolder(PARENT_FOLDER);
            // 2. Add a child folder:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            // 3. Add one more folder in the root directory
            await studioUtils.doAddFolder(CHILD_FOLDER);
            // 4. First click - move the focus to grid again:
            await contentBrowsePanel.clickOnRowByDisplayName(PARENT_FOLDER.displayName);
            await contentBrowsePanel.pause(400);
            // 5. Second click - Unselect the parent folder and add one more folder in the root directory:
            await contentBrowsePanel.clickOnRowByDisplayName(PARENT_FOLDER.displayName);
            await studioUtils.doAddFolder(FOLDER);
        });

    it(`GIVEN Move dialog is opened WHEN 'remove selected option' has been clicked THEN 'Move' button gets disabled`,
        async () => {
            let moveContentDialog = new MoveContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the child folder:
            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
            // 2. Open 'Move' dialog:
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            // 3. Select a folder in the combobox:
            await moveContentDialog.typeTextAndClickOnOption(FOLDER.displayName);
            // 4. Click on 'Remove' icon:
            await moveContentDialog.clickOnRemoveOptionIcon();
            // 5. Verify that Move button gets disabled:
            await moveContentDialog.waitForMoveButtonDisabled();
        });

    it(`GIVEN child folder has been moved to another folder WHEN parent has been deleted THEN moved folder should not be deleted`,
        async () => {
            let moveContentDialog = new MoveContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the child folder:
            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
            // 2. Open 'Move' dialog:
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            // 3. Move the child folder to another folder:
            await moveContentDialog.typeTextAndClickOnOption(FOLDER.displayName);
            await moveContentDialog.clickOnMoveButton();
            await moveContentDialog.waitForClosed();
            // 4. Delete the parent folder
            await studioUtils.doDeleteContent(PARENT_FOLDER.displayName);
            // 5. Verify that moved folder is not deleted:
            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
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
