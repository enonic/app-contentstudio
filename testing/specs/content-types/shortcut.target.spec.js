/**
 * Created on 17.08.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const contentBuilder = require("../../libs/content.builder");
const ShortcutForm = require('../../page_objects/wizardpanel/shortcut.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');

describe("Shortcut's target specification", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    const TARGET_1 = "whale";
    const TARGET_2 = "server";
    const SHORTCUT_NAME = contentBuilder.generateRandomName('shortcut');
    const SHORTCUT_NAME1 = contentBuilder.generateRandomName('shortcut');

    it(`GIVEN wizard for new shortcut is opened WHEN name input has been filled in THEN the content should be invalid`,
        async () => {
            let contentWizard = new ContentWizard();
            let shortcutForm = new ShortcutForm();
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            //1. Fill in the name input:
            await contentWizard.typeDisplayName(SHORTCUT_NAME1);
            //2. save the shortcut:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot("shortcut_target_not_selected");
            //3. Verify that the content is not valid:
            let actualResult = await contentWizard.isContentInvalid();
            assert.isTrue(actualResult, "shortcut content should be not valid, because a target is not selected");
            //4. Verify the validation recording:
            let recording = await shortcutForm.getFormValidationRecording();
            assert.equal(recording, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, "Expected validation message should appear");
        });

    it(`GIVEN required data is typed in the wizard AND 'Add Parameters' button has been clicked WHEN 'Save' button has been pressed THEN the shortcut gets invalid because parameter inputs are empty`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            await contentWizard.typeDisplayName(SHORTCUT_NAME);
            //1. select the target:
            await shortcutForm.filterOptionsAndSelectTarget(TARGET_1);
            //2. save the shortcut:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot("shortcut_target_1");
            //3. Verify the selected option:
            let actualResult = await shortcutForm.getSelectedTargetDisplayName();
            assert.equal(actualResult, TARGET_1, "Expected display name should be present in the selected option");
        });

    it(`GIVEN existing shortcut is opened WHEN target has been updated THEN new target should be present after saving the content`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectContentAndOpenWizard(SHORTCUT_NAME);
            //1. Click on Remove icon and select another option in the target-selector
            await shortcutForm.clickOnRemoveTargetIcon();
            await shortcutForm.filterOptionsAndSelectTarget(TARGET_2);
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot("shortcut_target_2");
            //2.Verify the selected option:
            let actualResult = await shortcutForm.getSelectedTargetDisplayName();
            assert.equal(actualResult, TARGET_2, "Expected display name should be present in the selected option");
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/2462
    //Shortcut wizard is not updated after reverting a version #2462
    it(`GIVEN existing shortcut is opened WHEN the previous version has been reverted THEN the previous target should appear`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            //1. Open existing shortcut:
            await studioUtils.selectContentAndOpenWizard(SHORTCUT_NAME);
            //2. Open versions widget
            await contentWizard.openDetailsPanel();
            await wizardDetailsPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            //3. Expand the previous version and click on 'Revert' button:
            await wizardVersionsWidget.clickAndExpandVersion(1);
            await studioUtils.saveScreenshot("shortcut_target_reverted");
            await wizardVersionsWidget.clickOnRevertButton();
            studioUtils.saveScreenshot("shortcut_target_reverted");
            let actualTarget = await shortcutForm.getSelectedTargetDisplayName();
            assert.equal(actualTarget, TARGET_1, "Expected target should appear");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
