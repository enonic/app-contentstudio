/**
 * Created on 17.05.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const DeleteContentDialog = require('../page_objects/delete.content.dialog');
const NewContentDialog = require('../page_objects/browsepanel/new.content.dialog');
const appConst = require('../libs/app_const');

describe('Browse toolbar shortcut spec`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    it(`GIVEN content is selected WHEN 'Ctrl+Delete' have been pressed THEN 'Delete Dialog' should appear`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let deleteContentDialog = new DeleteContentDialog();
        await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
        await contentBrowsePanel.hotKeyDelete();
        //'Delete Dialog' should be loaded(otherwise exception will be thrown)
        await deleteContentDialog.waitForDialogOpened();
    });

    it(`GIVEN content is selected WHEN 'Ctrl+e' have been pressed THEN 'Content Wizard' should be loaded`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentWizard = new ContentWizard();
        //1. Select the folder:
        await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
        //2. 'Control'+ 'e'
        await contentBrowsePanel.hotKeyEdit();
        await studioUtils.switchToContentTabWindow('All Content types images');
        //'Content Wizard' should be loaded(otherwise exception will be thrown):
        await contentWizard.waitForOpened();
    });

    it("WHEN 'Alt+n' have been pressed THEN 'New content' dialog should be loaded", async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let newContentDialog = new NewContentDialog();
        await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
        //'Alt'+ 'n' have been pressed:
        await contentBrowsePanel.hotKeyNew();
        //'New Content Dialog should be loaded:
        await newContentDialog.waitForOpened();
    });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
