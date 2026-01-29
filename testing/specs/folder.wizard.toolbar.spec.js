/**
 * Created on 09.09.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const ContentWizardPanel = require('../page_objects/wizardpanel/content.wizard.panel');
const PageInspectionPanel = require('../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');
const WizardContextPanel = require('../page_objects/wizardpanel/details/wizard.context.window.panel');

describe('folder.wizard.toolbar.spec: tests for toolbar in folder wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const FOLDER_1_NAME = appConst.generateRandomName('folder');
    const NO_SELECTED_CONTROLLER_MSG = appConst.PAGE_WIDGET.NO_SELECTED_CONTROLLER_MSG;

    // https://github.com/enonic/app-contentstudio/issues/9188
    // Verifies Page widget, Insert tab with components displayed when no selected controllers #9188
    it(`WHEN new wizard for folder in the root directory is opened THEN 'Page' widget has been opened in Context Window THEN the message 'No page templates or page blocks available' is displayed`,
        async () => {
            let contentWizardPanel = new ContentWizardPanel();
            let pageInspectionPanel = new PageInspectionPanel();
            // 1. Open the shortcut in the root directory:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            let wizardContextWindow = new WizardContextPanel();
            await contentWizardPanel.openContextWindow();
            // 2. Verify that 'Details' widget is selected in Widget selector by default:
            let actualWidget = await wizardContextWindow.getSelectedOptionInWidgetSelectorDropdown();
            assert.equal(actualWidget, appConst.WIDGET_SELECTOR_OPTIONS.DETAILS, 'Details widget should be selected by default');
            // 3. Open 'Page' widget in Context Window:
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            let actualMessage = await pageInspectionPanel.getNoControllerMessageText();
            // 4. Verify the message - 'No page templates or page blocks available'
            assert.equal(actualMessage, NO_SELECTED_CONTROLLER_MSG, 'Expected no controller message should be displayed');
        });

    it(`GIVEN folder-wizard is opened WHEN name input is empty THEN all buttons have expected state`, async () => {
        let contentWizard = new ContentWizard();
        // 1. Open new folder-wizard
        await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
        await contentWizard.waitForDeleteButtonEnabled();
        // 2. 'Save' button should be disabled (name input is empty)
        await contentWizard.waitForSaveButtonDisabled();
        // 3 'Create Issue' is Default action
        await contentWizard.waitForCreateIssueButtonDisplayed();
        // 4. Only 'Create Issue' menu item should be enabled:
        await contentWizard.openPublishMenu();
        await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_ISSUE);
        await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
        await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.UNPUBLISH);
        await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.MARK_AS_READY);
        await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.PUBLISH);
        // 5. Duplicate button should be enabled
        await contentWizard.waitForDuplicateButtonEnabled();
        // 6. Verify that the content is invalid:
        let result = await contentWizard.isContentInvalid();
        assert.ok(result, 'The folder should be invalid, because the name input is empty');
    });

    it(`GIVEN folder-wizard is opened WHEN name has been typed THEN 'Save' button gets enabled`, async () => {
        let contentWizard = new ContentWizard();
        // 1. Open new folder-wizard
        await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
        // 2. Type a name:
        await contentWizard.typeDisplayName(FOLDER_1_NAME);
        // 3. Save button gets enabled
        await contentWizard.waitForSaveButtonEnabled();
        await contentWizard.waitForMarkAsReadyButtonVisible();
        // 4. Verify that the content gets valid
        let result = await contentWizard.isContentInvalid();
        assert.ok(result === false, 'The folder should be valid before the name saving');
        // 5. Only Unpublish menu item should be disabled:
        await contentWizard.openPublishMenu();
        await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_ISSUE);
        await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
        await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.UNPUBLISH);
        await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.MARK_AS_READY);
        await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.PUBLISH);
    });

    it(`GIVEN folder-wizard is opened AND a name has been typed WHEN 'Save' button has been pressed THEN 'Saved' button gets disabled`,
        async () => {
            let contentWizard = new ContentWizard();
            //1. Open new folder-wizard
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            //2. Type a name:
            await contentWizard.typeDisplayName(FOLDER_1_NAME);
            //3. Click on Save button
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            //4. 'Saved' button gets visible
            await contentWizard.waitForSavedButtonVisible();
            //5. The content should be valid
            let result = await contentWizard.isContentInvalid();
            assert.ok(result === false, 'The folder should be valid after the saving');
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
