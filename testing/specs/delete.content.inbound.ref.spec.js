/**
 * Created on 30.11.2017.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const DeleteContentDialog = require('../page_objects/delete.content.dialog');

describe('Delete a content that has inbound references spec', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it(`GIVEN existing shortcut with a target WHEN the target-content has been selected AND 'Delete' button pressed THEN expected notification message should appear`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            let displayName = contentBuilder.generateRandomName('shortcut');
            let shortcut = contentBuilder.buildShortcut(displayName, appConstant.TEST_IMAGES.WHALE);
            //1. new Shortcut-content has been added and selected:
            await studioUtils.doAddShortcut(shortcut);
            await studioUtils.findAndSelectItem(appConstant.TEST_IMAGES.WHALE);
            //2. Delete button has been clicked:
            await contentBrowsePanel.clickOnDeleteButton();
            let notificationMessage = await contentBrowsePanel.waitForNotificationWarning();

            studioUtils.saveScreenshot("delete_dialog_inbound_ref");
            assert.equal(notificationMessage, appConstant.DELETE_INBOUND_MESSAGE, 'expected warning should appear');
            let result = await deleteContentDialog.getNumberOfInboundDependency(appConstant.TEST_IMAGES.WHALE);
            assert.equal(result, 'Inbound dependency: 1', 'expected warning should be present in the dialog');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
