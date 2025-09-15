/**
 * Created on 17.08.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const contentBuilder = require("../../libs/content.builder");
const ShortcutForm = require('../../page_objects/wizardpanel/shortcut.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');

describe("Shortcut's target specification", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const TARGET_1 = 'whale';
    const TARGET_2 = 'server';
    const SHORTCUT_NAME = contentBuilder.generateRandomName('shortcut');
    const SHORTCUT_NAME1 = contentBuilder.generateRandomName('shortcut');

    it(`GIVEN wizard for new shortcut is opened WHEN name input has been filled in THEN the content should be invalid`,
        async () => {
            let contentWizard = new ContentWizard();
            let shortcutForm = new ShortcutForm();
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            // 1. Fill in the name input:
            await contentWizard.typeDisplayName(SHORTCUT_NAME1);
            // 2. save the shortcut:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('shortcut_target_not_selected');
            // 3. Verify that the content is not valid:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, "shortcut content should be invalid, because a target is not selected");
            // 4. Verify the validation recording:
            let recording = await shortcutForm.getFormValidationRecording();
            assert.equal(recording, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, "Expected validation message should appear");
        });

    it(`GIVEN required data is typed in the wizard AND 'Add Parameters' button has been clicked WHEN 'Save' button has been pressed THEN the shortcut gets invalid because parameter inputs are empty`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            await contentWizard.typeDisplayName(SHORTCUT_NAME);
            // 1. select the target:
            await shortcutForm.filterOptionsAndSelectTarget(TARGET_1);
            // 2. save the shortcut:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('shortcut_target_1');
            // 3. Verify the selected option:
            let actualResult = await shortcutForm.getSelectedTargetDisplayName();
            assert.equal(actualResult, TARGET_1, "Expected display name should be present in the selected option");
        });

    it(`GIVEN existing shortcut is opened WHEN target has been updated THEN new target should be present after saving the content`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectContentAndOpenWizard(SHORTCUT_NAME);
            // 1. Click on Remove icon and select another option in the target-selector
            await shortcutForm.clickOnRemoveTargetIcon();
            await shortcutForm.filterOptionsAndSelectTarget(TARGET_2);
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('shortcut_target_2');
            // 2.Verify the selected option:
            let actualResult = await shortcutForm.getSelectedTargetDisplayName();
            assert.equal(actualResult, TARGET_2, "Expected display name should be present in the selected option");
        });

    it(`GIVEN shortcut with an image in its target are selected WHEN 'Media' has been selected THEN 'Preview not available' message should be displayed in the Preview panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select the existing shortcut to an image:
            await studioUtils.findAndSelectItem(SHORTCUT_NAME);
            // 2. Select 'Media' in the Preview widget dropdown:
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.MEDIA);
            await studioUtils.saveScreenshot('shortcut_target_image_media_selected');
            // 3. Verify that Preview button is  disabled in the toolbar in Item Preview Panel:
            await contentItemPreviewPanel.waitForPreviewButtonDisabled();
            // 4. Verify the message in Preview panel:
            let actualMessage = await contentItemPreviewPanel.getNoPreviewMessage();
            // 'Preview not available' message should be displayed
            assert.ok(actualMessage.includes(appConst.PREVIEW_PANEL_MESSAGE.PREVIEW_NOT_AVAILABLE),
                'expected message should be displayed');
        });

    it(`GIVEN shortcut with an image in its target is selected WHEN 'Automatic' has been selected THEN 'Preview not available' message should be displayed in the Preview panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select the existing shortcut to an image:
            await studioUtils.findAndSelectItem(SHORTCUT_NAME);
            // 2. 'Automatic' should be in the Preview widget dropdown by default :
            let actualOption = await contentItemPreviewPanel.getSelectedOptionInPreviewWidget();
            assert.equal(actualOption, appConst.PREVIEW_WIDGET.AUTOMATIC,
                'Automatic option should be selected in preview widget by default');
            await studioUtils.saveScreenshot('shortcut_target_image_automatic_selected');
            // 3. Verify that 'Preview' button is disabled in the toolbar in Item Preview Panel:
            await contentItemPreviewPanel.waitForPreviewButtonDisabled();
            // 4. Verify the message in Preview panel:
            let actualMessage = await contentItemPreviewPanel.getNoPreviewMessage();
            assert.ok(actualMessage.includes('Preview not available'), "'Preview not available' message should be displayed");
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/2462
    // Shortcut wizard is not updated after reverting a version #2462
    it(`GIVEN existing shortcut is opened WHEN the previous version has been reverted THEN the previous target should appear`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardContextPanel = new WizardContextPanel();
            // 1. Open existing shortcut:
            await studioUtils.selectContentAndOpenWizard(SHORTCUT_NAME);
            // 2. Open versions widget
            await contentWizard.openContextWindow();
            await wizardContextPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            // 3. Expand the previous version and click on 'Revert' button:
            await wizardVersionsWidget.clickAndExpandVersion(1);
            await studioUtils.saveScreenshot('shortcut_target_reverted');
            await wizardVersionsWidget.clickOnRestoreButton();
            // 4. Verify the target after reverting the previous version:
            await studioUtils.saveScreenshot('shortcut_target_reverted');
            let actualTarget = await shortcutForm.getSelectedTargetDisplayName();
            assert.equal(actualTarget, TARGET_1, "Expected target should appear");
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
