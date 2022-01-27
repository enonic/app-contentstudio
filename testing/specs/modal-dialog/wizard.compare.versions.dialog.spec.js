/**
 * Created on 22.01.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const contentBuilder = require("../../libs/content.builder");
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const CompareContentVersionsDialog = require('../../page_objects/compare.content.versions.dialog');
const SettingsStepForm = require('../../page_objects/wizardpanel/settings.wizard.step.form');

describe('wizard.compare.versions.dialog - open the dialog and verify elements', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let FOLDER;

    it("Preconditions: new folder should be created",
        async () => {
            const folderName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(folderName);
            await studioUtils.doAddFolder(FOLDER);
        });

    it("Preconditions: existing folder should be modified(select a language and create new version item )",
        async () => {
            let contentWizard = new ContentWizard();
            let settingsStepForm = new SettingsStepForm();
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await settingsStepForm.filterOptionsAndSelectLanguage('English (en)');
            await contentWizard.waitAndClickOnSave();
        });

    it("GIVEN Comparing Versions Dialog is opened WHEN 'Show entire content' has been clicked THEN 'type', 'owner', 'publish' properties get visible",
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            //1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openDetailsPanel();
            //2. Open Version History panel:
            await wizardDetailsPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            //3. Click on 'compare' icon in the previous version:
            await wizardVersionsWidget.clickOnCompareWithCurrentVersionButton(1);
            //4. Verify that modal dialog is loaded:
            await compareContentVersionsDialog.waitForDialogOpened();
            let type = await compareContentVersionsDialog.getTypeProperty();
            assert.equal(type, '', "Type property should not be displayed");
            //5. Click on 'Show entire content' checkbox
            await compareContentVersionsDialog.clickOnShowEntireContentCheckbox();
            type = await compareContentVersionsDialog.getTypeProperty();
            assert.equal(type, `"base:folder"`, "Expected type property gets visible");
        });

    it(`GIVEN existing folder is opened WHEN compare icon in the previous version has been clicked THEN Comparing Versions Dialog should be loaded`,
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            //1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openDetailsPanel();
            //2. Open Version History panel:
            await wizardDetailsPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            //3. Click on 'compare' icon in the previous version:
            await wizardVersionsWidget.clickOnCompareWithCurrentVersionButton(1);
            //4. Verify that modal dialog is loaded:
            await compareContentVersionsDialog.waitForDialogOpened();
            //5. Right 'Revert' menu-button should be disabled:
            await compareContentVersionsDialog.waitForRightRevertMenuButtonDisabled();
            //6. Left 'Revert' menu-button should be enabled:
            await compareContentVersionsDialog.waitForLeftRevertMenuButtonEnabled();
        });

    it(`GIVEN Comparing Versions Dialog is opened in wizard WHEN left revert menu button has been clicked THEN 'Revert' menu item gets visible in the expanded menu`,
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            //1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openDetailsPanel();
            //2. Open Version History panel:
            await wizardDetailsPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            //3. Open Compare Versions dialog(click in previous version):
            await wizardVersionsWidget.clickOnCompareWithCurrentVersionButton(1);
            await compareContentVersionsDialog.waitForDialogOpened();
            //4. Click on left 'Revert' menu-button and expand the menu:
            await compareContentVersionsDialog.clickOnLeftRevertMenuButton();
            //5. 'Revert' menu-item should be present in the expanded menu:
            await compareContentVersionsDialog.waitForLeftRevertMenuItemDisplayed();
        });

    it(`GIVEN Comparing Versions Dialog is loaded WHEN Esc key has been pressed THEN the modal dialog closes`,
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            //1. Open Comparing Versions Dialog:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openDetailsPanel();
            await wizardDetailsPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            await wizardVersionsWidget.clickOnCompareWithCurrentVersionButton(1);
            await compareContentVersionsDialog.waitForDialogOpened();
            //2. 'Esc' key has been pressed:
            await contentWizard.pressEscKey();
            //3. Verify that the modal dialog is closed:
            await compareContentVersionsDialog.waitForDialogClosed();
        });

    it(`GIVEN Comparing Versions Dialog is loaded WHEN cancel-top button has been pressed THEN the modal dialog closes`,
        async () => {
            let contentWizard = new ContentWizard();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            //1. Open Comparing Versions Dialog:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openDetailsPanel();
            await wizardDetailsPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            await wizardVersionsWidget.clickOnCompareWithCurrentVersionButton(1);
            await compareContentVersionsDialog.waitForDialogOpened();
            //2. 'Cancel button top' key been pressed:
            await compareContentVersionsDialog.clickOnCancelButtonTop();
            //3. Verify that the modal dialog is closed:
            await compareContentVersionsDialog.waitForDialogClosed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
