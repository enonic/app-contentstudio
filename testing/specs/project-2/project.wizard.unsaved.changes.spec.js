/**
 * Created on 30.07.2020.  updated on 12.08.2026
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const LanguageAndParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const appConst = require('../../libs/app_const');

describe('project.wizard.unsaved.changes.spec - checks unsaved changes in the wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    it("GIVEN project wizard is opened AND a language is selected WHEN click outside the dialog THEN 'Confirmation' dialog should be loaded", async () => {
        let languageAndParentProjectStep = new LanguageAndParentProjectStep();
        // 1. Open Project Wizard Dialog:
        let settingsBrowsePanel = new SettingsBrowsePanel();
        await settingsBrowsePanel.clickOnNewButton();
        await languageAndParentProjectStep.waitForLoaded();
        await languageAndParentProjectStep.selectLanguage(appConst.LANGUAGES.EN);
        // Click outside the dialog - 'Confirmation' dialog should appear:
        await languageAndParentProjectStep.clickOutsideDialog();
        let confirmationDialog = new ConfirmationDialog();
        await confirmationDialog.waitForDialogOpened();
        await confirmationDialog.clickOnCancelButton();
        await languageAndParentProjectStep.waitForLoaded();

        await languageAndParentProjectStep.clickOutsideDialog();
        await confirmationDialog.clickOnConfirmButton();
        await languageAndParentProjectStep.waitForDialogClosed();
    });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioApp();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
