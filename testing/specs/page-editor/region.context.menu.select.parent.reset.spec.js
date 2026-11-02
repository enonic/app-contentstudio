/**
 * Created on 29.10.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require('../../libs/content.builder');
const LiveFormPanel = require('../../page_objects/wizardpanel/liveform/live.form.panel');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');
const PageResetDialog = require('../../page_objects/wizardpanel/liveform/page.reset.dialog');
const PageTemplateForm = require('../../page_objects/wizardpanel/page.template.form.panel');
const appConst = require('../../libs/app_const');

describe('region.context.menu.select.parent.reset.spec: Select parent in the region context menu then reset the page in Live Edit', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const MAIN_REGION = 'main';
    const RESET_QUESTION = 'This will discard all the page modifications. Are you sure?';

    let SITE;

    it(`Preconditions: new site should be created`, async () => {
        let displayName = contentBuilder.generateRandomName('site');
        SITE = contentBuilder.buildSite(displayName, null, [appConst.APP_CONTENT_TYPES]);
        await studioUtils.doAddSite(SITE);
    });

    it(`GIVEN 'main region' controller is selected WHEN 'Select parent' has been clicked in the region's context menu AND 'Reset' has been clicked in the page's context menu THEN 'Automatic' option should be displayed in the template dropdown`, async () => {
        let contentWizard = new ContentWizard();
        let liveFormPanel = new LiveFormPanel();
        let pageInspectionPanel = new PageInspectionPanel();
        let pageResetDialog = new PageResetDialog();
        // 1. Open the site:
        await studioUtils.selectContentAndOpenWizard(SITE.displayName);
        // 2. Open 'Page' widget and select 'main region' controller:
        let wizardContextWindow = await contentWizard.openContextWindow();
        await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
        await pageInspectionPanel.selectPageTemplateOrController(appConst.CONTROLLER_NAME.MAIN_REGION);
        await contentWizard.waitForNotificationMessage();
        // 3. Open the context menu for 'main' region in Live Edit frame:
        await contentWizard.switchToLiveEditFrame();
        await liveFormPanel.doRightClickOnRegion(MAIN_REGION);
        await studioUtils.saveScreenshot('main_region_context_menu');
        let regionMenuItems = await liveFormPanel.getItemViewContextMenuItems();
        assert.ok(
            regionMenuItems.includes(appConst.COMPONENT_VIEW_MENU_ITEMS.SELECT_PARENT),
            "'Select parent' menu item should be present in the region's context menu",
        );
        // 4. Click on 'Select parent' menu item:
        await liveFormPanel.clickOnLiveViewContextMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SELECT_PARENT);
        // 5. Verify that the context menu for the parent (page) is loaded:
        await liveFormPanel.waitForItemViewContextMenu();
        await studioUtils.saveScreenshot('page_context_menu_after_select_parent');
        let pageMenuItems = await liveFormPanel.getItemViewContextMenuItems();
        assert.ok(
            pageMenuItems.includes(appConst.COMPONENT_VIEW_MENU_ITEMS.RESET),
            "'Reset' menu item should be present in the page's context menu",
        );
        assert.ok(
            !pageMenuItems.includes(appConst.COMPONENT_VIEW_MENU_ITEMS.SELECT_PARENT),
            "'Select parent' menu item should not be present in the page's context menu",
        );
        // 6. Click on 'Reset' menu item:
        await liveFormPanel.clickOnLiveViewContextMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.RESET);
        await contentWizard.switchToMainFrame();
        // 7. Confirm the resetting in the modal dialog:
        await pageResetDialog.waitForDialogOpened();
        let question = await pageResetDialog.getQuestion();
        assert.equal(question, RESET_QUESTION, 'Expected question should be displayed in the Page Reset dialog');
        await pageResetDialog.clickOnConfirmButton();
        await pageResetDialog.waitForDialogClosed();
        await studioUtils.saveScreenshot('page_reset_in_live_edit');
        // 8. 'No preview available' should be displayed in the Wizard PreviewLabel after the resetting:
        await contentWizard.waitForNoPreviewMessageDisplayed();
        // 9. Open the context menu in Live Edit and click on 'Page settings' menu item:
        await contentWizard.openContextMenuClickOnPageSettings();
        await pageInspectionPanel.waitForOpened();
        // 10. Verify that 'Automatic' option is selected in the template dropdown:
        let selectedController = await pageInspectionPanel.getSelectedPageController();
        assert.equal(
            selectedController,
            appConst.INSPECT_PANEL_TEMPLATE_CONTROLLER.AUTOMATIC,
            "'Automatic' option should be selected in the template dropdown after the resetting",
        );
    });

    // Verifies 'Save as Template' in Live Edit page context menu does not create a template #11651
    // https://github.com/enonic/app-contentstudio/issues/11651
    it(`GIVEN 'main region' controller is selected again WHEN 'Save as Template' has been clicked in the page's context menu in Live Edit THEN wizard for new page template should be loaded in the new browser tab`, async () => {
        let contentWizard = new ContentWizard();
        let liveFormPanel = new LiveFormPanel();
        let pageInspectionPanel = new PageInspectionPanel();
        let pageTemplateForm = new PageTemplateForm();
        // 1. Open the site that was reset in the previous test:
        await studioUtils.selectContentAndOpenWizard(SITE.displayName);
        // 2. Open 'Page' widget and select 'main region' controller again:
        let wizardContextWindow = await contentWizard.openContextWindow();
        await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
        await pageInspectionPanel.selectPageTemplateOrController(appConst.CONTROLLER_NAME.MAIN_REGION);
        await contentWizard.waitForNotificationMessage();
        // 3. Open the context menu for 'main' region in Live Edit frame and click on 'Select parent':
        await contentWizard.switchToLiveEditFrame();
        await liveFormPanel.doRightClickOnRegion(MAIN_REGION);
        await liveFormPanel.clickOnLiveViewContextMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SELECT_PARENT);
        // 4. Verify that 'Save as Template' is present in the page's context menu:
        await liveFormPanel.waitForItemViewContextMenu();
        let pageMenuItems = await liveFormPanel.getItemViewContextMenuItems();
        assert.ok(
            pageMenuItems.includes(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_TEMPLATE),
            "'Save as Template' menu item should be present in the page's context menu",
        );
        // 5. Click on 'Save as Template' menu item:
        await liveFormPanel.clickOnLiveViewContextMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_TEMPLATE);
        await contentWizard.switchToMainFrame();
        await contentWizard.pause(500);
        // 6. Wizard for the new page template should be loaded in the new browser tab:
        await studioUtils.doSwitchToNewWizard();
        await studioUtils.saveScreenshot('live_edit_save_as_template');
        let expectedPath = 'template-' + SITE.displayName;
        let actualPath = await contentWizard.getNameInToolbar();
        assert.equal(actualPath, expectedPath, "Template's path should contain the name of its site");
        // 7. Verify that 'Site' option is selected in the 'Supports' dropdown:
        let support = await pageTemplateForm.getSupportSelectedOptions();
        assert.equal(support.length, 1, 'Single item should be selected in the Supports form');
        assert.equal(
            support[0],
            appConst.TEMPLATE_SUPPORT.SITE,
            "'Site' option should be selected in the Supports dropdown",
        );
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
