/**
 * Created on 21.09.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ImageEditor = require('../../page_objects/wizardpanel/image.editor');
const ImageFormPanel = require('../../page_objects/wizardpanel/image.form.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const appConst = require('../../libs/app_const');

describe("image.editor.focus.spec: tests for focus button", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const CIRCLE_CX = 200;
    const CIRCLE_CY = 150;

    it(`WHEN Try to close the wizard with unsaved set focus THEN Alert dialog should appear`,
        async () => {
            let imageEditor = new ImageEditor();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            // 1. Open an existing image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.POP_02);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            // 2. Verify that red circle is not displayed
            //await imageEditor.waitForFocusCircleNotDisplayed();
            // 3. Click on 'Focus' button and switch to 'edit' mode
            await imageEditor.clickOnFocusButton();
            // 4. Drag the focus circle in edit mode and press on Apply:
            await imageEditor.doDragFocus(CIRCLE_CX, CIRCLE_CY);
            await imageEditor.clickOnApplyButton();
            // 5. Verify that 'Reset Filter' button gets visible in the edit mode:
            await imageEditor.waitForResetFiltersDisplayed();
            // 6. Save button should be enabled now:
            await contentWizard.waitForSaveButtonEnabled();
            // 5. Try to close the wizard with unsaved set focus:
            //await contentWizard.clickOnCloseBrowserTab();
            // let isOpened = await contentWizard.isAlertOpen();
            // if (isOpened) {
            //     await contentWizard.dismissAlert();
            // }
            //assert.ok(isOpened, "Alert should appear after trying to close the wizard with unsaved changes");
        });

    it(`GIVEN existing image is opened WHEN focus circle has been moved AND 'Apply' button pressed THEN focus circle should be displayed in the editor`,
        async () => {
            let imageEditor = new ImageEditor();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            // 1. Open an existing image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.POP_02);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            // 2. Verify that red circle is not displayed
            //await imageEditor.waitForFocusCircleNotDisplayed();
            // 3. Click on 'Focus' button and switch to 'edit' mode
            await imageEditor.clickOnFocusButton();
            // 4. Drag the red circle in edit mode:
            await imageEditor.doDragFocus(CIRCLE_CX, CIRCLE_CY);
            // 5. Verify that 'Reset Autofocus' button gets visible in the edit mode:
            await imageEditor.waitForResetAutofocusButtonDisplayed();
            // 6. Click on 'Apply' button and close the edit mode:
            await imageEditor.clickOnApplyButton();
            // 7. Verify that red circle is displayed in the Image Editor:
            await imageEditor.waitForFocusCircleDisplayed();
            await contentWizard.waitAndClickOnSave();
        });

    it(`WHEN existing focused image is opened THEN 'Reset filters' and focus circle should be displayed in Image Editor`,
        async () => {
            let imageEditor = new ImageEditor();
            let imageFormPanel = new ImageFormPanel();
            // 1. Open the focused image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.POP_02);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            await studioUtils.saveScreenshot('image_focused');
            // 2. Verify that 'Reset filters' button is displayed
            await imageEditor.waitForResetFiltersDisplayed();
            await imageEditor.waitForFocusCircleDisplayed();
        });

    it(`GIVEN existing focused image is opened WHEN 'Reset Autofocus' AND 'Apply' button have been pressed THEN 'Reset filters' and focus circle get not visible in Image Editor`,
        async () => {
            let imageEditor = new ImageEditor();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            // 1. Open the focused image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.POP_02);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            // 2. Click on 'Focus' button and switch to 'edit' mode
            await imageEditor.clickOnFocusButton();
            // 3. Click on 'Reset Autofocus' button
            await imageEditor.clickOnResetAutofocusButton();
            await imageEditor.clickOnApplyButton();
            await studioUtils.saveScreenshot('focused_image_to_initial');
            // 4. Verify that 'Reset filters' button is not displayed
            await imageEditor.waitForResetFiltersNotDisplayed();
            // 5. Verify that focus circle is not displayed in Image Editor
            //await imageEditor.waitForFocusCircleNotDisplayed();

            await contentWizard.waitAndClickOnSave();
        });

    it(`GIVEN existing image is opened WHEN the focused version has been reverted THEN 'Reset filters' and focus circle get visible in Image Editor`,
        async () => {
            let imageEditor = new ImageEditor();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            let wizardVersionsWidget = new WizardVersionsWidget();
            // 1. Open the image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.POP_02);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            // 2. Open Versions Panel
            await contentWizard.openVersionsHistoryPanel();
            // 3. Revert the focused version:
            await wizardVersionsWidget.clickAndExpandVersion(1);
            await wizardVersionsWidget.clickOnRestoreButton();
            // 4. Verify that 'Reset filters' button gets visible:
            await imageEditor.waitForResetFiltersDisplayed();
            await imageEditor.waitForFocusCircleDisplayed();
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
