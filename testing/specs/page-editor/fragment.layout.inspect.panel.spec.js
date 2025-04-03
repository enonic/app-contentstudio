/**
 * Created on 19.02.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const LayoutInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/layout.inspection.panel');
const FragmentInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/fragment.inspection.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const WizardDependenciesWidget = require('../../page_objects/wizardpanel/details/wizard.dependencies.widget');
const ContentFilterPanel = require('../../page_objects/browsepanel/content.filter.panel');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');

describe('fragment.layout.inspect.panel.spec - Select a site with invalid child and try to publish it', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const FRAGMENT_LAYOUT_DESCRIPTION = 'layout';
    const MAIN_REGION_CONTROLLER = 'main region';
    const MAIN_COMPONENT_NAME = 'main';
    const SITE_1_NAME = contentBuilder.generateRandomName('site');
    const SITE_2_NAME = contentBuilder.generateRandomName('site');
    const LAYOUT_2_COL = '25/75';
    const LAYOUT_3_COL = '3-col';
    const FRAGMENT_2_COL_GENERATED_NAME = 'fragment-25-75';

    // Verifies:
    // 1)"Descriptor dropdowns in the Inspection panel is not updated after content path has changed #1095"
    // 2) Page Component View - incorrect description of a fragment. https://github.com/enonic/app-contentstudio/issues/1534
    it("GIVEN layout saved as fragment in new site WHEN site's name has been updated THEN path should be updated in selected option in Fragment Inspect Panel",
        async () => {
            let pageComponentView = new PageComponentView();
            let fragmentInspectionPanel = new FragmentInspectionPanel();
            let siteFormPanel = new SiteFormPanel();
            let layoutInspectionPanel = new LayoutInspectionPanel();
            let contentWizardPanel = new ContentWizardPanel();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            // 1. Open new site-wizard, select an application and controller:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await siteFormPanel.addApplications([appConst.TEST_APPS_NAME.SIMPLE_SITE_APP]);
            await contentWizardPanel.selectPageDescriptor(MAIN_REGION_CONTROLLER);
            // 2. Click on minimize-toggler  expand Live Edit and open 'Page Component view' modal dialog:
            await contentWizardPanel.clickOnMinimizeLiveEditToggler();
            await pageComponentView.openMenu(MAIN_COMPONENT_NAME);
            await pageComponentView.selectMenuItem(['Insert', 'Layout']);
            // 3. Verifies #6393: we keep 'Inspect panel' collapsed (or collapse it if it was expanded).
            // So need to open 'Inspect panel':
            //await contentWizardPanel.clickOnDetailsPanelToggleButton();
            await layoutInspectionPanel.typeNameAndSelectLayout(LAYOUT_2_COL);
            await pageComponentView.pause(500);
            let actualDescriptionLayout = await pageComponentView.getComponentDescription(LAYOUT_2_COL);
            assert.equal(actualDescriptionLayout, '2 column layout', 'Expected description should be displayed in the layout item');
            // 4. Verify that the site is automatically saved after selecting a layout in the dropdown:
            await pageComponentView.openMenu(LAYOUT_2_COL);
            // 5. Click on 'Save as Fragment' menu item. (Save the layout as fragment)
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            await contentWizardPanel.pause(2000);
            await contentWizardPanel.waitForSpinnerNotVisible();
            // 6. Type new site's name and save:
            await contentWizardPanel.clickOnMinimizeLiveEditToggler();
            await contentWizardPanel.typeDisplayName(SITE_1_NAME);
            await contentWizardPanel.pause(700);
            await contentWizardPanel.waitAndClickOnSave();
            await contentWizardPanel.waitForSpinnerNotVisible();
            // wait for the description is refreshing:
            await contentWizardPanel.pause(2000);
            await studioUtils.saveScreenshot('fragment_path_updated');
            // 7. Fragment Inspection Panel should be loaded automatically in the site wizard. Verify that path is updated in the dropdown:
            let actualPath = await fragmentInspectionPanel.getSelectedOptionPath();
            assert.ok(actualPath.includes(SITE_1_NAME), 'Path should be updated in Fragment Inspection Panel');
            // 8. Verify that expected description should be present in the site in wizard step:
            let actualDescriptionFragment = await pageComponentsWizardStepForm.getComponentDescription(LAYOUT_2_COL);
            assert.equal(actualDescriptionFragment, FRAGMENT_LAYOUT_DESCRIPTION, "'layout' description should be present in 'fragment item'");
        });

    it("GIVEN existing site is opened WHEN the second fragment has been saved THEN two options should be in fragment selector in Inspect Panel",
        async () => {
            let pageComponentView = new PageComponentView();
            let fragmentInspectionPanel = new FragmentInspectionPanel();
            let layoutInspectionPanel = new LayoutInspectionPanel();
            let contentWizardPanel = new ContentWizardPanel();
            // 1. Open the existing site with a fragment:
            await studioUtils.selectAndOpenContentInWizard(SITE_1_NAME);
            // 2. Click on minimize-toggler  expand Live Edit and show Page Component modal dialog:
            await contentWizardPanel.clickOnMinimizeLiveEditToggler();
            await pageComponentView.openMenu(MAIN_COMPONENT_NAME);
            await pageComponentView.selectMenuItem(['Insert', 'Layout']);
            // Inspect panel should be expanded in this case :
            await layoutInspectionPanel.typeNameAndSelectLayout(LAYOUT_3_COL);
            // 3. Verify that the site is automatically saved after selecting a layout in the dropdown:
            await contentWizardPanel.waitForNotificationMessage();
            await pageComponentView.openMenu(LAYOUT_3_COL);
            // 4. Click on 'Save as Fragment' menu item. (Save the layout as fragment)
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            await contentWizardPanel.pause(3000);
            await contentWizardPanel.waitForSpinnerNotVisible(appConst.mediumTimeout);
            // 5. Click on DropdownHandle in Fragment Inspection Panel:
            await fragmentInspectionPanel.clickOnFragmentDropdownHandle();
            await studioUtils.saveScreenshot('fragment_inspect_panel_options');
            let actualOptions = await fragmentInspectionPanel.getFragmentDropdownOptions();
            // 6. Verify that options in the dropdown list are refreshed:
            assert.equal(actualOptions.length, 2, 'Two options should be present in the dropdown list');
            assert.ok(actualOptions.includes(LAYOUT_2_COL), 'The first layout should be present in the dropdown options');
            assert.ok(actualOptions.includes(LAYOUT_3_COL), 'The first layout should be present in the dropdown options');
        });

    it("GIVEN 'Page Components View' is opened WHEN a fragment has been selected AND 'Edit' button in Inspect Panel has been clicked THEN the fragment should be opened in new browser tab",
        async () => {
            let pageComponentView = new PageComponentView();
            let fragmentInspectionPanel = new FragmentInspectionPanel();
            let contentWizard = new ContentWizardPanel();
            // 1. Open the existing site with a fragment:
            await studioUtils.selectAndOpenContentInWizard(SITE_1_NAME);
            // 2. Click on minimize-toggler  expand Live Edit and show Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await pageComponentView.clickOnComponent(LAYOUT_2_COL);
            await fragmentInspectionPanel.waitForOpened();
            // 3. Click on 'Edit Fragment' in Inspect Panel:
            await fragmentInspectionPanel.clickOnEditFragmentButton();
            await studioUtils.doSwitchToNextTab();
            // Verify the wizard-step:
            let result = await contentWizard.isWizardStepPresent('Fragment');
            assert.ok(result, 'Fragment wizard step should be present in the page');
            // Verify the display name
            let displayName = await contentWizard.getDisplayName();
            assert.equal(displayName, LAYOUT_2_COL, 'Expected display name should be present');
            // Verify 'Preview' button is displayed:
            await contentWizard.waitForPreviewButtonDisplayed();
        });

    it("GIVEN existing site with 2 fragments is opened WHEN 'Show Outbound' dependencies button has been pressed THEN 2 fragments should be filtered in new browser tab",
        async () => {
            let contentWizard = new ContentWizardPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            let wizardDependenciesWidget = new WizardDependenciesWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let contentFilterPanel = new ContentFilterPanel();
            // 1. Existing content with x-data(image) is opened:
            await studioUtils.selectContentAndOpenWizard(SITE_1_NAME);
            await contentWizard.openDetailsPanel();
            // 2. Dependencies widget is opened:
            await wizardDetailsPanel.openDependencies();
            // 3. Click on 'Show outbound' button
            await wizardDependenciesWidget.clickOnShowOutboundButton();
            await studioUtils.doSwitchToNextTab();
            // 4. Dependencies section should be loaded in the browse panel
            await contentFilterPanel.waitForDependenciesSectionVisible();
            await contentFilterPanel.pause(1000);
            // 5. Verify that 2 fragments should be filtered in the grid:
            await studioUtils.saveScreenshot('fragment_component_outbound_section');
            let result = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(result[0], LAYOUT_2_COL, 'expected layout fragment should be filtered');
            assert.equal(result[1], LAYOUT_3_COL, 'expected layout fragment should be filtered');
        });

    it("GIVEN existing site with fragments is opened WHEN 2-col fragment has been replaced with 3-col fragment THEN two 3-col fragments should be displayed in Page Component View",
        async () => {
            let contentWizard = new ContentWizardPanel();
            let fragmentInspectionPanel = new FragmentInspectionPanel();
            let pageComponentView = new PageComponentView();
            // 1. Existing site with 2 fragments is opened:
            await studioUtils.selectContentAndOpenWizard(SITE_1_NAME);
            // 2. Click on minimize-toggler  expand Live Edit and show Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await pageComponentView.clickOnComponent(LAYOUT_2_COL);
            await fragmentInspectionPanel.waitForOpened();
            // 3. Expand the dropdown and click on the option:
            await fragmentInspectionPanel.clickOnFragmentDropdownHandle();
            await fragmentInspectionPanel.clickOnOptionInFragmentDropdown(LAYOUT_3_COL);
            let message = await contentWizard.waitForNotificationMessage();
            assert.equal(message, appConst.itemSavedNotificationMessage(SITE_1_NAME),
                "Item is saved - this notification message should appear");
            // 4. Verify that two 3-col fragments should be displayed in Page Component View:
            let result = await pageComponentView.getPageComponentsDisplayName();
            assert.equal(result[2], LAYOUT_3_COL, "Two 3-col fragments should be present in the Page Component View");
            assert.equal(result[3], LAYOUT_3_COL, "Two 3-col fragments should be present in the Page Component View");

            // Verify issue https://github.com/enonic/app-contentstudio/issues/1504
            // Fragment Wizard - Save button remains enabled after updating a fragment #1504
            await contentWizard.waitForSaveButtonDisabled();
        });

    // https://github.com/enonic/app-contentstudio/issues/4988
    //  Page Component View dialog is not correctly refreshed after layout descriptor is changed #4988
    it("GIVEN existing fragment is opened WHEN 2-col layout replaced with 3-col layout THEN 3 columns should be present in Live Edit",
        async () => {
            let pageComponentView = new PageComponentView();
            let layoutInspectionPanel = new LayoutInspectionPanel();
            let contentWizard = new ContentWizardPanel();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open the fragment:
            await studioUtils.openContentAndSwitchToTabByDisplayName(FRAGMENT_2_COL_GENERATED_NAME, "25/75");
            // 2. Click on minimize-toggler  expand Live Edit and show Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Click on the layout component in Page Components View:
            await pageComponentView.clickOnComponent(LAYOUT_2_COL);
            await layoutInspectionPanel.waitForOpened();
            // 4. Expand the dropdown and select another option:
            await layoutInspectionPanel.clickOnLayoutDropdownHandle();
            await layoutInspectionPanel.clickOnOptionInLayoutDropdown(LAYOUT_3_COL);
            // layout descriptor has been changed - notification message should appear(content is saved):
            await contentWizard.waitForNotificationMessage();
            let result = await pageComponentView.getPageComponentsDisplayName();
            await studioUtils.saveScreenshot('layout_config_inspect_panel_updated');
            assert.ok(result.includes('3-col'), '3-col item should be displayed in PCV');
            assert.ok(result.includes('Left'), 'Left region item should be displayed in PCV');
            assert.ok(result.includes('Center'), 'Center region item should be displayed in PCV');
            assert.ok(result.includes('Right'), 'Right region item should be displayed in PCV');
            // 5. Verify that new layout is displayed in the Live Edit:
            let actualColumnNumber = await liveFormPanel.getLayoutColumnNumber();
            assert.equal(actualColumnNumber, 3, "Three column should be present in the layout");
        });

    it("GIVEN the second site has been saved WHEN fragment component has been inserted THEN fragments from the first site should not be available in the second site",
        async () => {
            let pageComponentView = new PageComponentView();
            let fragmentInspectionPanel = new FragmentInspectionPanel();
            let siteFormPanel = new SiteFormPanel();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let contentWizardPanel = new ContentWizardPanel();
            // 1. Open new site-wizard, select the application and controller:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizardPanel.typeDisplayName(SITE_2_NAME);
            await siteFormPanel.addApplications([appConst.TEST_APPS_NAME.SIMPLE_SITE_APP]);
            await contentWizardPanel.selectPageDescriptor(MAIN_REGION_CONTROLLER);
            await wizardDetailsPanel.waitForDetailsPanelLoaded();
            // 2. Click on minimize-toggler  expand Live Edit and show Page Component modal dialog:
            await contentWizardPanel.clickOnMinimizeLiveEditToggler();
            // 3. Insert the fragment-component:
            await pageComponentView.openMenu(MAIN_COMPONENT_NAME);
            await studioUtils.saveScreenshot('fragment_layout_inspection1');
            await pageComponentView.selectMenuItem(["Insert", "Fragment"]);
            // 4. Verify that 'Edit Fragment' button is disabled
            await studioUtils.saveScreenshot('fragment_layout_inspection2');
            await fragmentInspectionPanel.waitForEditFragmentButtonDisabled();
            // 5. Expand the fragment dropdown options and verify that the list of options is empty:'No matching items'
            await fragmentInspectionPanel.clickOnFragmentDropdownHandle();
            await studioUtils.saveScreenshot('fragment_inspect_panel_empty_options');
            // 6. Verify that 'No matching items' text is displayed in the fragment dropdown (fragments from another sites should not be available)
            await fragmentInspectionPanel.waitForEmptyOptionsMessage();
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
