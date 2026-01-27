/**
 * Created on 25.09.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentWizardPanel = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const PageComponentView = require("../page_objects/wizardpanel/liveform/page.components.view");
const appConst = require('../libs/app_const');
const WizardContextPanel = require('../page_objects/wizardpanel/details/wizard.context.window.panel');
const ConfirmationDialog = require('../page_objects/confirmation.dialog');
const PartInspectionPanel = require('../page_objects/wizardpanel/liveform/inspection/part.inspection.panel');
const LayoutInspectionPanel = require('../page_objects/wizardpanel/liveform/inspection/layout.inspection.panel');

describe('default.error.page.spec tests for Default error page', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;
    const ERROR_PART_NAME = appConst.PART_NAME.PART_WITH_ERROR;
    const PART_CITIES_DISTANCE_FACET = appConst.PART_NAME.CONTENT_TYPES_CITIES_DISTANCE_FACET;

    it(`Preconditions: test site should be created`, async () => {
        let displayName = contentBuilder.generateRandomName('site');
        SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.APP_CONTENT_TYPES], CONTROLLER_NAME);
        await studioUtils.doAddSite(SITE);
    });

    it("WHEN part with errors has been inserted WHEN 'Preview' button has been pressed THEN default error page should be loaded",
        async () => {
            let contentWizard = new ContentWizardPanel();
            let pageComponentView = new PageComponentView();
            let partInspectionPanel = new PartInspectionPanel();
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 1. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 2. open the context menu
            await pageComponentView.openMenu('main');
            // 3. click on the 'Insert Part' menu item:
            await pageComponentView.selectMenuItem([appConst.PCV_MENU_ITEM.INSERT, appConst.PCV_MENU_ITEM.PART]);
            // 4. Select the part with errors:
            await partInspectionPanel.waitForOpened();
            await partInspectionPanel.typeNameAndSelectPart(ERROR_PART_NAME);
            // 5. Click on 'Preview' button:
            await contentWizard.clickOnPreviewButton();
            await studioUtils.doSwitchToNextTab();
            await studioUtils.saveScreenshot('default-error-page');
            // 6. Verify that Default Error Page is loaded:
            let pageSource = await studioUtils.getPageSource();
            assert.ok(pageSource.includes('Error 500'), 'Default error page should be loaded');
            assert.ok(pageSource.includes('Oops, something went wrong!'), 'Expected message should be loaded');
        });

    it("WHEN part with errors has been removed THEN new inserted component should be displayed without the red icon",
        async () => {
            let contentWizard = new ContentWizardPanel();
            let pageComponentView = new PageComponentView();
            let layoutInspectionPanel = new LayoutInspectionPanel();
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 1. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 2. open the context menu for part with errors
            await pageComponentView.openMenu(ERROR_PART_NAME);
            // 3. click on the 'Remove' menu item in PCV and remove the part-component
            await pageComponentView.selectMenuItem([appConst.PCV_MENU_ITEM.REMOVE]);
            await pageComponentView.openMenu('main');
            // 4. click on the 'Insert Part' menu item:
            await pageComponentView.selectMenuItem([appConst.PCV_MENU_ITEM.INSERT, appConst.PCV_MENU_ITEM.LAYOUT]);
            await layoutInspectionPanel.waitForOpened();
            await layoutInspectionPanel.typeNameAndSelectLayout(appConst.LAYOUT_NAME.CENTERED);
            await contentWizard.waitForNotificationMessage();
            // 5. Verify that red icon is not displayed beside the layout-component in the PCV:
            let isInvalid = await pageComponentView.isComponentItemInvalid(appConst.LAYOUT_NAME.CENTERED);
            assert.ok(isInvalid === false, 'The layout-component should be displayed as valid in PCV');
        });

    it("WHEN Controller has been reset THEN Details widget should be loaded in the wizard page",
        async () => {
            let partInspectionPanel = new PartInspectionPanel();
            let contentWizard = new ContentWizardPanel();
            let pageComponentView = new PageComponentView();
            let wizardContextPanel = new WizardContextPanel();
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 1. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await contentWizard.openContextWindow();
            // 2. open the context menu
            await pageComponentView.openMenu('main');
            // 3. click on the 'Insert Part' menu item:
            await pageComponentView.selectMenuItem([appConst.PCV_MENU_ITEM.INSERT, appConst.PCV_MENU_ITEM.PART]);
            // 4. Select a  part:
            await partInspectionPanel.waitForOpened();
            await partInspectionPanel.typeNameAndSelectPart(PART_CITIES_DISTANCE_FACET);
            await contentWizard.switchToMainFrame();
            // 5. Reset the controller in PCV
            await pageComponentView.openMenu('main region');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.RESET]);
            // 6. Click on 'Yes' button in the confirmation dialog:
            let confirmationDialog = new ConfirmationDialog();
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot('site_controller_has_been_reset');
            // 7. Verify that Details widget should be loaded in Context Window
            let selectedOption = await wizardContextPanel.getSelectedOptionInWidgetSelectorDropdown();
            assert.equal(selectedOption, appConst.WIDGET_SELECTOR_OPTIONS.DETAILS, `'Details' widget should be in the widget selector`);
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
