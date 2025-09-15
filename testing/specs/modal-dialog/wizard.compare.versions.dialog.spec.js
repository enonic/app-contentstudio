/**
 * Created on 22.01.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const contentBuilder = require("../../libs/content.builder");
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const CompareContentVersionsDialog = require('../../page_objects/compare.content.versions.dialog');

describe('wizard.compare.versions.dialog - open the dialog and verify elements', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let FOLDER;

    it("Preconditions: new folder should be created",
        async () => {
            const folderName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(folderName);
            await studioUtils.doAddFolder(FOLDER);
        });

    it("GIVEN top 'Edited' and 'Created' version items have been clicked WHEN the first 'Edited' option has been selected in the left dropdown THEN 'Versions are identical' message get visible",
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardContextPanel = new WizardContextPanel();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openContextWindow();
            // 2. Open Version panel:
            await wizardContextPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            // 3. Click on 'show changes' icon in the first 'edited' item:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);

            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            await wizardVersionsWidget.clickOnCompareVersionsButton();
            await compareContentVersionsDialog.waitForDialogOpened();
            // 4. Expand the left dropdown(Older) and click on the latest edited-option in the dropdown list:
            await compareContentVersionsDialog.expandLeftDropdownAndClickOnModifiedOption(1);
            // 5. Verify that 'Versions are identical' message appears in the dialog:
            let actualMessage = await compareContentVersionsDialog.waitForVersionsIdenticalMessage();
            assert.equal(actualMessage, 'Versions are identical', `'Versions are identical' message should be displayed`);
        });

    it("Preconditions: existing folder should be modified(select a language and create new version item )",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openContextWindow();
            await contentWizard.openDetailsWidget();
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            await editSettingsDialog.filterOptionsAndSelectLanguage(appConst.LANGUAGES.EN);
            await editSettingsDialog.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.waitForSaveButtonDisabled();
        });

    it(`GIVEN 'Comparing Versions Dialog' is opened WHEN 'Show entire content' has been clicked THEN 'type', 'owner', 'publish' properties get visible`,
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardContextPanel = new WizardContextPanel();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openContextWindow();
            await contentWizard.openDetailsWidget();
            await contentWizard.openContextWindow();
            // 2. Open Version History panel:
            await wizardContextPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            // 3. Click on the first top EDITED item(the latest version):
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            // 4. Check its checkbox:
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            // 5. Click on the CREATED item:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            // 6. Check its checkbox:
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            // 7. Click on Compare Versions button:
            await wizardVersionsWidget.clickOnCompareVersionsButton();
            // 4. Verify that modal dialog is loaded:
            await compareContentVersionsDialog.waitForDialogOpened();
            let type = await compareContentVersionsDialog.getTypeProperty();
            assert.equal(type, '', 'Type property should not be displayed');
            // 5. Click on 'Show entire content' checkbox
            await compareContentVersionsDialog.clickOnShowEntireContentCheckbox();
            type = await compareContentVersionsDialog.getTypeProperty();
            assert.equal(type, `"base:folder"`, 'Expected type property gets visible');
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/6082
    // 'Show entire content' checkbox is not reset after reopening the modal dialog
    it("GIVEN 'Show entire content' checkbox has been checked WHEN the modal dialog has been reopened THEN 'Show entire content' should not be checked",
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardContextPanel = new WizardContextPanel();
            // 1. Open the existing folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openContextWindow();
            // 2. Open 'Version History' panel:
            await wizardContextPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            // 3. Check 2 items:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            // 4. Click on 'Compare Versions' button:
            await wizardVersionsWidget.clickOnCompareVersionsButton();
            await compareContentVersionsDialog.waitForDialogOpened();
            // 5. Verify that 'Show entire content' checkbox is not selected:
            let isSelected = await compareContentVersionsDialog.isShowEntireContentCheckboxSelected();
            assert.ok(isSelected === false, `'Show entire content' checkbox should not be selected`);
            // 6. Click on 'Show entire content' checkbox
            await compareContentVersionsDialog.clickOnShowEntireContentCheckbox();
            isSelected = await compareContentVersionsDialog.isShowEntireContentCheckboxSelected();
            assert.ok(isSelected, `'Show entire content' checkbox should be selected`);
            // 7. Close then reopen the modal dialog:
            await compareContentVersionsDialog.clickOnCancelButtonTop();
            await compareContentVersionsDialog.waitForDialogClosed();
            await wizardVersionsWidget.clickOnCompareVersionsButton();
            await compareContentVersionsDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('show_entire_content_not_selected');
            // 8. Verify that 'Show entire content' checkbox  is not selected:
            isSelected = await compareContentVersionsDialog.isShowEntireContentCheckboxSelected();
            assert.ok(isSelected === false, `'Show entire content' checkbox should not be checked`);
        });

    it(`GIVEN the previous 'Edited' and 'Created' version items have been clicked WHEN compareContentVersions dialog has been opened THEN then right Restore menu button should be enabled in the compare versions dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardContextPanel = new WizardContextPanel();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openContextWindow();
            // 2. Open Version History panel:
            await wizardContextPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            // 3. Click on the second top EDITED item(the previous version):
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 1);
            // 4. Check its checkbox:
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 1);
            // 5. Click on the CREATED item:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            // 6. Check its checkbox:
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            // 7. Click on Compare Versions button:
            await wizardVersionsWidget.clickOnCompareVersionsButton();
            // 4. Verify that modal dialog is loaded:
            await compareContentVersionsDialog.waitForDialogOpened();
            // 5. Right 'Revert'(Newer) menu-button should be disabled:
            await compareContentVersionsDialog.waitForRightRestoreMenuButtonEnabled();
            // 6. Left (Older)'Revert' menu-button should be enabled:
            await compareContentVersionsDialog.waitForLeftRestoreMenuButtonEnabled();
            // 7. Click on left 'Restore' menu-button and expand the menu:
            await compareContentVersionsDialog.clickOnLeftRestoreMenuButton();
            // 8. 'Restore' menu-item should be present in the expanded menu:
            await compareContentVersionsDialog.waitForLeftRestoreMenuItemDisplayed();
        });

    it(`GIVEN the current 'Edited'(the first on the top) and Created items have been checked WHEN compare versions dialog has been opened THEN (Newer) 'Revert' menu button should be disabled`,
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardContextPanel = new WizardContextPanel();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openContextWindow();
            // 2. Open Version History panel:
            await wizardContextPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            // 3. Click on the current version(the first item on the top) and click on its checkbox:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            // 4. Click on the Created version and click on its checkbox:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            // 5. Click on the Compare Versions button:
            await wizardVersionsWidget.clickOnCompareVersionsButton();
            // 4. Verify that modal dialog is loaded:
            await compareContentVersionsDialog.waitForDialogOpened();
            // 5. Right(Newer) 'Revert' menu-button should be disabled:
            await compareContentVersionsDialog.waitForRightRestoreMenuButtonDisabled();
            // 6. Left (older) 'Revert' menu-button should be enabled:
            await compareContentVersionsDialog.waitForLeftRestoreMenuButtonEnabled();
        });

    it(`GIVEN Comparing Versions Dialog is loaded WHEN 'Esc' key has been pressed THEN the modal dialog closes`,
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardContextPanel = new WizardContextPanel();
            // 1. Open Comparing Versions Dialog:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openContextWindow();
            await wizardContextPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            // 2. Click on the Edited version item and click on its checkbox:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 1);
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 1);
            // 3. Click on the Created version item and click on its checkbox:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            await wizardVersionsWidget.clickOnCompareVersionsButton();
            await compareContentVersionsDialog.waitForDialogOpened();
            // 2. 'Esc' key has been pressed:
            await contentWizard.pressEscKey();
            // 3. Verify that the modal dialog is closed:
            await compareContentVersionsDialog.waitForDialogClosed();
        });

    it(`GIVEN Comparing Versions Dialog is loaded WHEN cancel-top button has been pressed THEN the modal dialog closes`,
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardContextPanel = new WizardContextPanel();
            // 1. Open Comparing Versions Dialog:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openContextWindow();
            await wizardContextPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            // 2. Click on the Edited version item and click on its checkbox:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 1);
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 1);
            // 3. Click on the Created version item and click on its checkbox:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            await wizardVersionsWidget.clickOnCompareVersionsButton();
            await compareContentVersionsDialog.waitForDialogOpened();
            // 4. 'Cancel button top' key been pressed:
            await compareContentVersionsDialog.clickOnCancelButtonTop();
            // 5. Verify that the modal dialog is closed:
            await compareContentVersionsDialog.waitForDialogClosed();
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
