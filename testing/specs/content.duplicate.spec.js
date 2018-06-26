/**
 * Created on 31.05.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const contentDuplicateDialog = require('../page_objects/content.duplicate.dialog');
const contentBuilder = require("../libs/content.builder");

describe('content.duplicate.spec: Duplicate 2 folders specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let folder1;
    let folder2;

    it(`WHEN two folders has been added THEN folders should be present in the grid`,
        () => {
            let displayName1 = contentBuilder.generateRandomName('folder');
            let displayName2 = contentBuilder.generateRandomName('folder');
            folder2 = contentBuilder.buildFolder(displayName2);
            folder1 = contentBuilder.buildFolder(displayName1);
            return studioUtils.doAddFolder(folder1).then(() => {
            }).then(() => {
                return studioUtils.doAddFolder(folder2);
            }).then(() => {
                return studioUtils.typeNameInFilterPanel(folder1.displayName);
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(folder1.displayName);
            }).then(isDisplayed => {
                assert.isTrue(isDisplayed, 'folder should be listed in the grid');
            });
        });

    it(`GIVEN two folders are checked AND 'Duplicate Dialog' is opened WHEN 'Duplicate' button on the modal dialog has been pressed  THEN correct notification message should appear`,
        () => {
            return studioUtils.findContentAndClickCheckBox(folder1.displayName).then(() => {
                return studioUtils.findContentAndClickCheckBox(folder2.displayName);
            }).then(() => {
                return contentBrowsePanel.clickOnDuplicateButtonAndWait();
            }).then(() => {
                studioUtils.saveScreenshot("folders_to_duplicate");
                return contentDuplicateDialog.clickOnDuplicateButton();
            }).then(() => {
                return contentBrowsePanel.waitForNotificationMessage();
            }).then(result => {
                studioUtils.saveScreenshot("folders_were_duplicated2");
                assert.equal(result, '2 items are duplicated.', 'correct notification should be displayed');
            });
        });

    it(`WHEN two folders were duplicated THEN 2 copies should be present`,
        () => {
            return studioUtils.typeNameInFilterPanel(folder1.displayName + '-copy').then(() => {
                return contentBrowsePanel.waitForContentDisplayed(folder1.displayName + '-copy');
            }).then(() => {
                return studioUtils.typeNameInFilterPanel(folder2.displayName + '-copy')
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(folder2.displayName + '-copy');
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
