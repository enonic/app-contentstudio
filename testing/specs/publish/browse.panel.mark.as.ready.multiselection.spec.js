/**
 * Created on 05.09.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');

describe('wizard.mark.as.ready.multiselection.spec - select 2 folders and do Mark as Ready action`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER1;
    let TEST_FOLDER2;

    it(`GIVEN 2 folders are added WHEN both folder has been selected and 'MARK AS READY' button pressed THEN confirmation dialog should appear`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            let name1 = contentBuilder.generateRandomName('folder');
            let name2 = contentBuilder.generateRandomName('folder');
            TEST_FOLDER1 = contentBuilder.buildFolder(name1);
            TEST_FOLDER2 = contentBuilder.buildFolder(name2);
            // 2 folders have been added:
            await studioUtils.doAddFolder(TEST_FOLDER1);
            await studioUtils.doAddFolder(TEST_FOLDER2);

            //Click on checkboxes and select bot folders:
            await studioUtils.findContentAndClickCheckBox(name1);
            await studioUtils.findContentAndClickCheckBox(name2);
            //Click on 'MARK AS READY' button
            await contentBrowsePanel.clickOnMarkAsReadyButton();

            await confirmationDialog.waitForDialogOpened();
            let message = await confirmationDialog.getWarningMessage();

            studioUtils.saveScreenshot("mark_as_ready_confirmation");
            assert.equal(message, "Are you sure you want to mark the items as ready?");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
