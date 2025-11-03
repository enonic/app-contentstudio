/**
 * Created on 22.01.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const contentBuilder = require("../../libs/content.builder");
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');
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

    it("GIVEN Comparing Versions Dialog is opened WHEN the first 'Edited' option has been selected in the left dropdown THEN 'Versions are identical' message get visible",
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openDetailsPanel();
            // 2. Open Version panel:
            await wizardDetailsPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            // 3. Click on 'show changes' icon in the first 'edited' item:
            await wizardVersionsWidget.clickOnShowChangesButtonByHeader('Edited', 0);
            await compareContentVersionsDialog.waitForDialogOpened();
            // 4. Expand the left dropdown and click on the edited-option:
            await compareContentVersionsDialog.expandLeftDropdownAndClickOnModifiedOption(0);
            // 5. Verify that 'Versions are identical' message appears in the dialog:
            let actualMessage = await compareContentVersionsDialog.waitForVersionsIdenticalMessage();
            assert.equal(actualMessage, 'Versions are identical', "'Versions are identical' message should be displayed");
        });

    it("Preconditions: existing folder should be modified(select a language and create new version item )",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            await editSettingsDialog.filterOptionsAndSelectLanguage(appConst.LANGUAGES.EN);
            await editSettingsDialog.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.waitForSaveButtonDisabled();
        });

    it("GIVEN Comparing Versions Dialog is opened WHEN 'Show entire content' has been clicked THEN 'type', 'owner', 'publish' properties get visible",
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openDetailsPanel();
            // 2. Open Version History panel:
            await wizardDetailsPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            // 3. Click on 'show changes' icon in the previous version:
            await wizardVersionsWidget.clickOnOnShowChangesButton(1);
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
    it.skip(
        "GIVEN 'Show entire content' checkbox has been selected WHEN the modal dialog has been reopened THEN 'Show entire content' should not be selected",
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openDetailsPanel();
            // 2. Open Version History panel:
            await wizardDetailsPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            // 3. Click on 'show changes' icon:
            await wizardVersionsWidget.clickOnOnShowChangesButton(1);
            await compareContentVersionsDialog.waitForDialogOpened();
            let isSelected = await compareContentVersionsDialog.isShowEntireContentCheckboxSelected();
            assert.ok(isSelected === false, "'Show entire content' checkbox should not be selected");
            // 4. Click on 'Show entire content' checkbox
            await compareContentVersionsDialog.clickOnShowEntireContentCheckbox();
            isSelected = await compareContentVersionsDialog.isShowEntireContentCheckboxSelected();
            assert.ok(isSelected, "'Show entire content' checkbox should be selected");
            // 5. Close then reopen the modal dialog:
            await compareContentVersionsDialog.clickOnCancelButtonTop();
            await compareContentVersionsDialog.waitForDialogClosed();
            await wizardVersionsWidget.clickOnOnShowChangesButton(1);
            await compareContentVersionsDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('show_entire_content_not_selected');
            // 6. Verify that 'Show entire content' checkbox  is not selected:
            isSelected = await compareContentVersionsDialog.isShowEntireContentCheckboxSelected();
            assert.ok(isSelected === false, "'Show entire content' checkbox should not be selected");
        });

    it(`GIVEN existing folder is opened WHEN compare icon in the active version item has been clicked THEN then right Revert button should be disabled in the compare versions dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openDetailsPanel();
            // 2. Open Version History panel:
            await wizardDetailsPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            // 3. Click on 'compare' icon in the Active version(the first item):
            await wizardVersionsWidget.clickOnShowChangesButtonByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            // 4. Verify that modal dialog is loaded:
            await compareContentVersionsDialog.waitForDialogOpened();
            // 5. Right 'Revert' menu-button should be disabled:
            await compareContentVersionsDialog.waitForRightRevertMenuButtonDisabled();
            // 6. Left 'Revert' menu-button should be enabled:
            await compareContentVersionsDialog.waitForLeftRevertMenuButtonEnabled();
        });

    it(`GIVEN existing folder is opened WHEN compare icon in the second Edited version item has been clicked THEN then both Revert buttons should be enabled in the compare versions dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openDetailsPanel();
            // 2. Open Version History panel:
            await wizardDetailsPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            // 3. Click on 'compare' icon in the Active version(the first item):
            await wizardVersionsWidget.clickOnShowChangesButtonByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 1);
            // 4. Verify that modal dialog is loaded:
            await compareContentVersionsDialog.waitForDialogOpened();
            // 5. Right 'Revert' menu-button should be enabled:
            await compareContentVersionsDialog.waitForRightRevertMenuButtonEnabled();
            // 6. Left 'Revert' menu-button should be enabled:
            await compareContentVersionsDialog.waitForLeftRevertMenuButtonEnabled();
        });

    it(`GIVEN Comparing Versions Dialog is opened in wizard WHEN left revert menu button has been clicked THEN 'Revert' menu item gets visible in the expanded menu`,
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openDetailsPanel();
            // 2. Open Version History panel:
            await wizardDetailsPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            // 3. Open Compare Versions dialog(click in previous version):
            await wizardVersionsWidget.clickOnOnShowChangesButton(1);
            await compareContentVersionsDialog.waitForDialogOpened();
            // 4. Click on left 'Revert' menu-button and expand the menu:
            await compareContentVersionsDialog.clickOnLeftRevertMenuButton();
            // 5. 'Revert' menu-item should be present in the expanded menu:
            await compareContentVersionsDialog.waitForLeftRevertMenuItemDisplayed();
        });

    it(`GIVEN Comparing Versions Dialog is loaded WHEN Esc key has been pressed THEN the modal dialog closes`,
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            // 1. Open Comparing Versions Dialog:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openDetailsPanel();
            await wizardDetailsPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            await wizardVersionsWidget.clickOnOnShowChangesButton(1);
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
            let wizardDetailsPanel = new WizardDetailsPanel();
            // 1. Open Comparing Versions Dialog:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openDetailsPanel();
            await wizardDetailsPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            await wizardVersionsWidget.clickOnOnShowChangesButton(1);
            await compareContentVersionsDialog.waitForDialogOpened();
            // 2. 'Cancel button top' key been pressed:
            await compareContentVersionsDialog.clickOnCancelButtonTop();
            // 3. Verify that the modal dialog is closed:
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
