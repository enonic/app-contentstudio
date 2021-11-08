/**
 * Created on 16.01.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");

describe('delete.folder.spec: multiselect deleting content', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let folder1;
    let folder2;
    it(`Precondition:two folders has been added`,
        async () => {
            let displayName1 = contentBuilder.generateRandomName('folder');
            let displayName2 = contentBuilder.generateRandomName('folder');
            folder2 = contentBuilder.buildFolder(displayName2);
            folder1 = contentBuilder.buildFolder(displayName1);
            await studioUtils.doAddFolder(folder1);
            await studioUtils.doAddFolder(folder2);
        });

    //verifies :
    // 1) xp-apps#398 Buttons remain enabled in the grid toolbar after deleting 2 content.
    // 2) https://github.com/enonic/lib-admin-ui/issues/1273  Browse toolbar is not updated after deleting filtered content
    it(`GIVEN two folders(New) in the root directory WHEN both folders has been selected and deleted THEN 'Archive...' button gets disabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.typeNameInFilterPanel(folder1.displayName);
            await contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName(folder1.displayName);
            //1. Select the first folder:
            await studioUtils.typeNameInFilterPanel(folder2.displayName);
            await contentBrowsePanel.pause(1000);
            //2. Select the second folder:
            await contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName(folder2.displayName);
            //3. Delete folders:
            await studioUtils.doDeleteNowAndConfirm(2);
            //4. Delete button should be disabled now:
            await contentBrowsePanel.waitForArchiveButtonDisabled();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
