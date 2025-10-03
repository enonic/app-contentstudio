/**
 * Created on 14.02.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const LiveFormPanel = require('../../page_objects/wizardpanel/liveform/live.form.panel');
const appConst = require('../../libs/app_const');
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const PageWidgetContextPanel = require('../../page_objects/wizardpanel/liveform/page.widget.context.window');
const LayoutInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/layout.inspection.panel');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');

describe('page.component.view.layout.items.spec - tests for page component view items', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;
    const LAYOUT_NAME = '3-col';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    // verifies task: issue-6485, Expand Page Components View tree to the item selected in Live Edit
    it(`GIVEN 3-column layout has been inserted in new site WHEN text has been inserted in left and center layout's regions THEN expected items should be displayed in the Page Component View`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let liveFormPanel = new LiveFormPanel();
            let textComponentCke = new TextComponentCke();
            // 1. reopen the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Maximize the Live Edit:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert the Layout component (3-column):
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Layout']);
            await liveFormPanel.selectLayoutByDisplayName(LAYOUT_NAME);
            await contentWizard.waitForNotificationMessage();
            // 4. Insert text component in the left layout's region
            await pageComponentView.openMenu('left');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.typeTextInCkeEditor('text left');
            // 5. Save the site: (layout get collapsed after the saving )
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('page_component_updated_1');
            // 6. Do not need to expand the layouts items, because the text component is selected in Live Edit now:
            // 7. Insert 'text component' in the left layout's region
            await pageComponentView.openMenu('center');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.typeTextInCkeEditor('text center');
            // 8. Save the site:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('page_component_updated_2');
            // 10. Verify that 'right region' item is displayed in Page Component View
            // verifies bug -
            await pageComponentView.waitForItemDisplayed('right');
        });

    it(`GIVEN existing site has been opened WHEN click on different items in PCV THEN required inspect panel should be loaded`,
        async () => {
            let contentWizard = new ContentWizardPanel();
            let pageComponentView = new PageComponentView();
            let layoutInspectionPanel = new LayoutInspectionPanel();
            let pageWidgetPanel = new PageWidgetContextPanel();
            // 1. Open the existing site
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await pageComponentView.waitForLoaded();
            // 2. Expand the layout item:
            await pageComponentView.expandItem(LAYOUT_NAME)
            // 3. Click on the 'left region' item in the Context Window:
            await pageComponentView.clickOnComponentByDisplayName('left');
            await studioUtils.saveScreenshot('context_win_region_tab');
            // 4. Verify that 'Region' tab bar item is loaded:
            await pageWidgetPanel.waitForTabBarItemDisplayed('Inspect');
            // 5. Click on the 'layout-component' in PCV:
            await pageComponentView.clickOnComponentByDisplayName(LAYOUT_NAME);
            await studioUtils.saveScreenshot('context_win_layout_tab');
            // 6. Verify that 'Layout' tab bar item is loaded in the Context Window:
            await pageWidgetPanel.waitForTabBarItemDisplayed('Inspect');
            await layoutInspectionPanel.waitForOpened();
            let actualSelectedOption = await layoutInspectionPanel.getSelectedOption();
            assert.equal(actualSelectedOption, LAYOUT_NAME, "expected layout-display name should be present in the selected option view");
        });

    it(`GIVEN existing site has been opened WHEN click on the root item in PCV THEN expected inspect panel should be loaded`,
        async () => {
            let contentWizard = new ContentWizardPanel();
            let pageComponentView = new PageComponentView();
            let layoutInspectionPanel = new LayoutInspectionPanel();
            let pageWidgetPanel = new PageWidgetContextPanel();
            let pageInspectionPanel = new PageInspectionPanel();
            // 1. Open the existing site
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await pageComponentView.waitForLoaded();
            // 2. Expand the layout item:
            await pageComponentView.expandItem(LAYOUT_NAME)
            // 3. Click on the 'main region' root item in the PCV:
            await pageComponentView.clickOnComponentByDisplayName('main region');
            await studioUtils.saveScreenshot('context_win_main_region_tab');
            await pageInspectionPanel.waitForOpened();
            // 4. Verify that 'Inspect' tab bar item is loaded in the Context Window:
            await pageWidgetPanel.waitForTabBarItemDisplayed('Inspect');
            let actualController = await pageInspectionPanel.getSelectedPageController();
            assert.equal(actualController, 'main region', "Expected controller should be present in the selected option view");
            // 5. Click on the 'layout-component' in PCV:
            await pageComponentView.clickOnComponentByDisplayName(LAYOUT_NAME);
            await studioUtils.saveScreenshot('context_win_layout_tab');
            // 6. Verify that 'Layout' tab bar item is loaded in the Context Window:
            await pageWidgetPanel.waitForTabBarItemDisplayed('Inspect');
            await layoutInspectionPanel.waitForOpened();
            let actualSelectedOption = await layoutInspectionPanel.getSelectedOption();
            assert.equal(actualSelectedOption, LAYOUT_NAME, "expected layout-display name should be present in the selected option view");
        });

    // Verify issue - Page Components view and step remain visible after reverting versions #6468
    it(`GIVEN existing site has been opened WHEN 'Created' version has been reverted THEN 'Page Component View' step should not be displayed`,
        async () => {
            let contentWizard = new ContentWizardPanel();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let detailsPanel = new WizardContextPanel();
            let versionsWidget = new WizardVersionsWidget();
            let pageComponentViewDialog = new PageComponentView();
            // 1. Open new site-wizard
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Verify that the wizard step is loaded:
            await pageComponentsWizardStepForm.waitForLoaded();
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Open Context Window panel:
            await contentWizard.openContextWindow();
            // 4. Open versions widget:
            await detailsPanel.openVersionHistory();
            await versionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.CREATED);
            // 5. Revert the 'Created' version:
            await versionsWidget.clickOnRestoreButton();
            await versionsWidget.pause(1000);
            await studioUtils.saveScreenshot('components_view_site_reverted');
            await pageComponentsWizardStepForm.waitForNotDisplayed();
            await pageComponentViewDialog.waitForNotDisplayed();
            // 6. Verify the note in  Live Form panel
            let message = await contentWizard.getNoPreviewMessage();
            // ''Preview not available' message is displayed in the Live Form panel
            assert.equal(message, appConst.PREVIEW_PANEL_MESSAGE.PREVIEW_NOT_AVAILABLE, 'expected message should be displayed');
            await contentWizard.waitForSaveButtonDisabled();
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
