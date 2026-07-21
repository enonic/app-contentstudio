/**
 * Created on 22.01.2020.  updated on 21.07.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const contentBuilder = require("../../libs/content.builder");
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');
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

    it("GIVEN top 'Edited' and 'Created' version items have been checked WHEN Show changess button has been clicked THEN 'displayName' change is displayed with the expected new value",
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
            await wizardVersionsWidget.waitForLoaded();
            // 3. Click on 2 checkboxes then  click on 'show changes' button:
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            await wizardVersionsWidget.clickOnShowChangesButton();
            await compareContentVersionsDialog.waitForDialogOpened();
            // 5. Verify that the 'displayName' change is displayed with the expected new value:
            let displayName = await compareContentVersionsDialog.getModifiedPropertyNewValue('displayName');
            console.assert(displayName === `"${FOLDER.displayName}"`, 'Expected displayName should be displayed in the dialog');
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

    it(`GIVEN the folder has been modified WHEN the latest and the created versions are compared THEN the content changes should be displayed in the dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardContextPanel = new WizardContextPanel();
            // 1. Open the existing folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openContextWindow();
            // 2. Open Version History panel:
            await wizardContextPanel.openVersionHistory();
            await wizardVersionsWidget.waitForLoaded();
            // 3. Check the latest EDITED item (with the added language) and the CREATED item:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            // 4. Open the 'Compare Versions' dialog:
            await wizardVersionsWidget.clickOnShowChangesButton();
            await compareContentVersionsDialog.waitForDialogOpened();
            // 5. Verify that the 'displayName' change is displayed with the expected new value:
            await compareContentVersionsDialog.waitForModifiedPropertyDisplayed('displayName');
            let displayName = await compareContentVersionsDialog.getModifiedPropertyNewValue('displayName');
            assert.equal(displayName, `"${FOLDER.displayName}"`, "'displayName' new value should be displayed in the dialog");
            // 6. Verify that the added 'language' property is displayed with the expected value:
            await compareContentVersionsDialog.waitForAddedPropertyDisplayed('language');
            let language = await compareContentVersionsDialog.getAddedPropertyValue('language');
            assert.equal(language, `"en"`, "The added 'language' property should be displayed in the dialog");
        });

    it.skip(`GIVEN 'Comparing Versions Dialog' is opened WHEN 'Show entire content' has been clicked THEN 'type', 'owner', 'publish' properties get visible`,
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
            await wizardVersionsWidget.waitForLoaded();
            // 3. Click on the first top EDITED item(the latest version):
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            // 4. Check its checkbox:
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            // 5. Click on the CREATED item:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            // 6. Check its checkbox:
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            // 7. Click on Compare Versions button:
            await wizardVersionsWidget.clickOnShowChangesButton();
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
    it.skip("GIVEN 'Show entire content' checkbox has been checked WHEN the modal dialog has been reopened THEN 'Show entire content' should not be checked",
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
            await wizardVersionsWidget.waitForLoaded();
            // 3. Check 2 items:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            // 4. Click on 'Compare Versions' button:
            await wizardVersionsWidget.clickOnShowChangesButton();
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
            await wizardVersionsWidget.clickOnShowChangesButton();
            await compareContentVersionsDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('show_entire_content_not_selected');
            // 8. Verify that 'Show entire content' checkbox  is not selected:
            isSelected = await compareContentVersionsDialog.isShowEntireContentCheckboxSelected();
            assert.ok(isSelected === false, `'Show entire content' checkbox should not be checked`);
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
            await wizardVersionsWidget.waitForLoaded();
            // 2. Check 2 checkboxes
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 1);
            await wizardVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED, 0);
            // 3. Click on Show changes button
            await wizardVersionsWidget.clickOnShowChangesButton();
            await compareContentVersionsDialog.waitForDialogOpened();
            // 4. 'Esc' key has been pressed:
            await contentWizard.pressEscKey();
            // 3. Verify that the modal dialog is closed:
            await compareContentVersionsDialog.waitForDialogClosed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
