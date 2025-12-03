/**
 * Created on 21.09.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');

describe('folder.content.revert.display.name.spec: tests for reverting of folder content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const FOLDER_NAME_1 = contentBuilder.generateRandomName('folder');
    const FOLDER_NAME_2 = contentBuilder.generateRandomName('folder');

    it.skip(`GIVEN wizard for new folder is opened WHEN name has been saved THEN 2 version-items should be present in Versions Widget`,
        async () => {
            let wizardVersionsWidget = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            // 1. open new wizard and fill in the name input:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(FOLDER_NAME_1);

            await contentWizard.openVersionsHistoryPanel();
            let result = await wizardVersionsWidget.countVersionItems();
            assert.equal(result, 1, "One version item should be present in the widget");
            // 2. Save the folder and verify that the number of version items increases:
            await contentWizard.waitAndClickOnSave();
            result = await wizardVersionsWidget.countVersionItems();
            await studioUtils.saveScreenshot('number_versions_should_be_3');
            assert.equal(result, 3, 'Three version-items should be present in the widget');

            result = await wizardVersionsWidget.countEditedItems();
            assert.equal(result, 2, `Two 'Edited' version items should be present`);
            result = await wizardVersionsWidget.countCreatedItems();
            assert.equal(result, 1, `One 'Created' version item should be present`);
        });

    it.skip(`GIVEN display name has been updated and saved WHEN the previous version has been reverted THEN the display name should be updated, but the path remains the same`,
        async () => {
            let wizardVersionsWidget = new WizardVersionsWidget();
            let contentWizard = new ContentWizard();
            // 1. open new wizard and fill in the name input:
            await studioUtils.selectAndOpenContentInWizard(FOLDER_NAME_1);
            await contentWizard.typeDisplayName(FOLDER_NAME_2);
            // 2. Save the content:
            await contentWizard.waitAndClickOnSave();
            let actualPath1 = await contentWizard.getPath();
            // 3. Revert the version with the previous display name:
            await contentWizard.openVersionsHistoryPanel();
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED,2);
            await wizardVersionsWidget.clickOnRestoreButton();
            await contentWizard.waitForNotificationMessage();
            let actualDisplayName = await contentWizard.getDisplayName();
            // 4. Verify that 'displayName' is reverted
            assert.equal(actualDisplayName, FOLDER_NAME_1, "The previous display name should be reverted");
            // 5. Verify that the path(name) is not updated
            let actualPath2 = await contentWizard.getPath();
            assert.equal(actualPath1, actualPath2, "Path remains the same after reverting the previous display name");
            // 6. Verify that the number of versions is updated after the reverting
            let numberVersions = await wizardVersionsWidget.countVersionItems();
            await studioUtils.saveScreenshot('number_versions_should_be_increased');
            assert.equal(numberVersions, 6, "The number of version items should be increased after the reverting");
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
