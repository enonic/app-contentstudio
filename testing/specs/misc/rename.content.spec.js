/**
 * Created on 20.10.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const ContentBrowseDetailsPanel = require('../../page_objects/browsepanel/detailspanel/browse.context.window.panel');
const BrowseVersionsWidget = require('../../page_objects/browsepanel/detailspanel/browse.versions.widget');

describe('rename.content.spec - tests for Renamed version item', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER;
    const NEW_NAME = contentBuilder.generateRandomName('folder');

    it('Precondition - folder should be added',
        async () => {
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(TEST_FOLDER);
        });

    it("GIVEN existing 'new' folder is opened WHEN the name(path) has been updated THEN 'Renamed' version item should appear in the version widget",
        async () => {
            let contentWizard = new ContentWizard();
            let wizardContextPanel = new WizardContextPanel();
            let wizardVersionsWidget = new WizardVersionsWidget();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await wizardContextPanel.openVersionHistory();
            // 1. Rename the folder
            await contentWizard.typeInPathInput(NEW_NAME);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessages();
            // 3. Verify that 'Renamed' version item is visible in the Versions Widget contentWizard panel:
            await wizardVersionsWidget.waitForRenamedItemDisplayed();
            await studioUtils.saveScreenshot('renamed_version_1');
            // 6. Verify that Renamed version item should appear:
            let renamedItems = await wizardVersionsWidget.countRenamedItems();
            assert.equal(renamedItems, 1, '1 Renamed item should appear');
            // 7. The total number of items should be 4:
            let allItems = await wizardVersionsWidget.countVersionItems();
            assert.equal(allItems, 4, '4 version items should be displayed in the widget');
        });

    it("WHEN existing renamed folder has been selected THEN 'Revert' and 'Active version' buttons should not be displayed in the version widget",
        async () => {
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            // 1. Open a renamed content:
            await studioUtils.findAndSelectItem(NEW_NAME);
            // 2. open Versions Panel
            await contentBrowseDetailsPanel.openVersionHistory();
            // 3. Click on 'Renamed' version item:
            await browseVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.RENAMED, 0);
            await studioUtils.saveScreenshot('renamed_version_browse_widget_clicked');
            // 4. Verify that Restore button should not be present in the latest Renamed item:
            await browseVersionsWidget.waitForRestoreButtonNotDisplayed();
            // 6. 'Compare Versions' checkbox should be displayed in the 'Renamed' item
            let isDisplayed = await browseVersionsWidget.isCompareVersionCheckboxDisplayed(appConst.VERSIONS_ITEM_HEADER.RENAMED, 0);
            assert.ok(isDisplayed, 'Compare Versions checkbox should be displayed in the Renamed item');
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
