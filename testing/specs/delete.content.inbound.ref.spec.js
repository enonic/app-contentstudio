/**
 * Created on 30.11.2017.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
var webDriverHelper = require('../libs/WebDriverHelper');
var appConstant = require('../libs/app_const');
const contentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const deleteContentDialog = require('../page_objects/delete.content.dialog');


describe('Delete a content that has inbound references spec', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it(`GIVEN existing shortcut with a target WHEN the target-content has been selected AND 'Delete' button pressed THEN notification message should appear`,
        () => {
            let displayName = contentBuilder.generateRandomName('shortcut');
            let shortcut = contentBuilder.buildShortcut(displayName, appConstant.TEST_IMAGES.WHALE);
            return studioUtils.doAddShortcut(shortcut).then(()=> {
            }).then(()=> {
                return studioUtils.findAndSelectItem(appConstant.TEST_IMAGES.WHALE);
            }).then(()=> {
                return contentBrowsePanel.clickOnDeleteButton();
            }).then(()=> {
                return contentBrowsePanel.waitForNotificationWarning();
            }).then(result=> {
                assert.isTrue(result == appConstant.DELETE_INBOUND_MESSAGE, 'correct warning should appear');
            }).then(()=> {
                return deleteContentDialog.getNumberOfInboundDependency(appConstant.TEST_IMAGES.WHALE);
            }).then(result=> {
                assert.isTrue(result == 'Inbound dependency: 1', 'correct warning should appear');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(()=> {
        return console.log('specification is starting: ' + this.title);
    });
});
