/**
 * Created on 17.05.2018.
 */
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const DeleteContentDialog = require('../page_objects/delete.content.dialog');
const NewContentDialog = require('../page_objects/browsepanel/new.content.dialog');
const appConst = require('../libs/app_const');

describe('Browse toolbar shortcut spec`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const CONTENT_DISPLAY_NAME = 'All Content types images';

    // Enter key doesn't open content for Edit #8756
    // https://github.com/enonic/app-contentstudio/issues/8756
    it(`GIVEN content is selected WHEN 'Enter' key has been pressed THEN the folder should be opened in new tab`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentWizard = new ContentWizard();
        // 1. Select a folder
        await studioUtils.findAndSelectItem(appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_NAME);
        // 2. Press 'Enter' key
        await contentBrowsePanel.pressEnterKey();
        // 3. Switch to the new browser tab:
        await studioUtils.switchToContentTabWindow(CONTENT_DISPLAY_NAME);
        await contentWizard.waitForOpened();
    });

    // Enter key doesn't open content for Edit #8756
    // https://github.com/enonic/app-contentstudio/issues/8756
    it(`GIVEN 2 item are checked in the grid WHEN 'Enter' key has been pressed THEN both folders should be opened in new tabs`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizard = new ContentWizard();
            // 1. Find the folder and Click on its checkbox:
            await studioUtils.typeNameInFilterPanel(appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_NAME);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_NAME);
            // 2. Find the second folder and click on its checkbox:
            await studioUtils.typeNameInFilterPanel(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_DISPLAY_NAME);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_NAME);
            // 3. Press 'Enter' key
            await contentBrowsePanel.pressEnterKey();
            // 4. Switch to the first new browser tab:
            await studioUtils.switchToContentTabWindow(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_DISPLAY_NAME);
            await contentWizard.waitForOpened();
            // 5. Switch to the second new browser tab:
            await studioUtils.switchToContentTabWindow(appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_DISPLAY_NAME);
            await contentWizard.waitForOpened();
        });

    it(`GIVEN content is selected WHEN 'Ctrl+Delete' have been pressed THEN 'Delete Dialog' should appear`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let deleteContentDialog = new DeleteContentDialog();
        // 1. Select a folder
        await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
        await contentBrowsePanel.waitForSpinnerNotVisible();
        // 2. Press Control+Delete
        await contentBrowsePanel.hotKeyDelete();
        // 3. Verify that the modal dialog is loaded - 'Delete Dialog' should be loaded
        await deleteContentDialog.waitForDialogOpened();
    });

    it(`GIVEN content is selected WHEN 'Ctrl+e' have been pressed THEN 'Content Wizard' should be loaded`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentWizard = new ContentWizard();
        // 1. Select the folder:
        await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
        await contentBrowsePanel.waitForSpinnerNotVisible();
        // 2. 'Control'+ 'e'
        await contentBrowsePanel.hotKeyEdit();
        await studioUtils.switchToContentTabWindow('All Content types images');
        await contentWizard.waitForOpened();
    });

    it("WHEN 'Alt+n' have been pressed THEN 'New content' dialog should be loaded", async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let newContentDialog = new NewContentDialog();
        // 1. Select the folder:
        await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
        await contentBrowsePanel.waitForSpinnerNotVisible();
        // 'Alt'+ 'n' have been pressed:
        await contentBrowsePanel.hotKeyNew();
        // 'New Content Dialog should be loaded:
        await newContentDialog.waitForOpened();
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
