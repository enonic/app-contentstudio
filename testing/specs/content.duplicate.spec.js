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
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const ContentDuplicateDialog = require('../page_objects/content.duplicate.dialog');
const contentBuilder = require("../libs/content.builder");

describe('content.duplicate.spec: Select and duplicate 2 folders specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let folder1;
    let folder2;

    it(`Preconditions: two folders should be added`,
        async () => {
            let displayName1 = contentBuilder.generateRandomName('folder');
            let displayName2 = contentBuilder.generateRandomName('folder');
            folder2 = contentBuilder.buildFolder(displayName2);
            folder1 = contentBuilder.buildFolder(displayName1);
            await studioUtils.doAddFolder(folder1);
            await studioUtils.doAddFolder(folder2);
        });

    it(`GIVEN two folders are checked AND 'Duplicate Dialog' is opened WHEN 'Duplicate' button on the modal dialog has been pressed  THEN correct notification message should appear`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentDuplicateDialog = new ContentDuplicateDialog();
            await studioUtils.findContentAndClickCheckBox(folder1.displayName);
            await studioUtils.findContentAndClickCheckBox(folder2.displayName);
            //Click on Duplicate... button in the toolbar:
            await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            studioUtils.saveScreenshot("folders_to_duplicate");
            //Click on Duplicate button in the dialog:
            await contentDuplicateDialog.clickOnDuplicateButton();
            let result = await contentBrowsePanel.waitForNotificationMessage();
            studioUtils.saveScreenshot("folders_were_duplicated2");
            assert.equal(result, '2 items are duplicated.', 'Expected notification message should be displayed');
        });

    it(`WHEN two folders have been duplicated THEN 2 copies should be present in the grid`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.typeNameInFilterPanel(folder1.displayName + '-copy');
            await contentBrowsePanel.waitForContentDisplayed(folder1.displayName + '-copy');
            await studioUtils.typeNameInFilterPanel(folder2.displayName + '-copy')
            await contentBrowsePanel.waitForContentDisplayed(folder2.displayName + '-copy');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
