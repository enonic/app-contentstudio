/**
 * Created on 16.01.2018.
 * verifies : xp-apps#398 Buttons are still enabled in the grid toolbar when 2 contents have been deleted
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const contentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");

describe('delete.folder.content.spec:  verifies `xp-apps#398`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let folder1;
    let folder2;
    it(`Precondition: WHEN two folders has been added THEN folders should be present in the grid`,
        () => {
            let displayName1 = contentBuilder.generateRandomName('folder');
            let displayName2 = contentBuilder.generateRandomName('folder');
            folder2 = contentBuilder.buildFolder(displayName2);
            folder1 = contentBuilder.buildFolder(displayName1);
            return studioUtils.doAddFolder(folder1).then(()=> {
            }).then(()=> {
                return studioUtils.doAddFolder(folder2);
            }).then(()=> {
                return studioUtils.typeNameInFilterPanel(folder1.displayName);
            }).then(()=> {
                return contentBrowsePanel.waitForContentDisplayed(folder1.displayName);
            }).then(isDisplayed=> {
                assert.isTrue(isDisplayed, 'folder should be listed in the grid');
            });
        });
//verifies : xp-apps#398 Buttons are still enabled in the grid toolbar when 2 contents have been deleted
    it(`GIVEN two folders in the root directory WHEN both folders has been selected and deleted THEN 'Delete' button should be disabled`,
        () => {
            return studioUtils.typeNameInFilterPanel(folder1.displayName).pause(1000).then(()=> {
                return contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName(folder1.displayName);
            }).pause(1000).then(()=> {
                return studioUtils.typeNameInFilterPanel(folder2.displayName)
            }).pause(1000).then(()=> {
                return contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName(folder2.displayName);
            }).pause(400).then(()=> {
                return studioUtils.clickOnDeleteAndConfirm(2);
            }).then(()=> {
                return contentBrowsePanel.isDeleteButtonEnabled()
            }).then(result=> {
                assert.isFalse(result, 'Delete button is getting disabled');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(()=> {
        return console.log('specification is starting: ' + this.title);
    });
});
