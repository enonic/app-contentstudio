/**
 * Created on 25.02.2020.  updated on 30.06.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const ContentFilterPanel = require('../../page_objects/browsepanel/content.filter.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const InsertImageDialog = require('../../page_objects/wizardpanel/html-area/insert.image.dialog.cke');
const BrowseDependenciesWidget = require('../../page_objects/browsepanel/detailspanel/browse.dependencies.widget');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');
const WizardDependenciesWidget = require('../../page_objects/wizardpanel/details/wizard.dependencies.widget');
const FragmentInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/fragment.inspection.panel');
const appConst = require('../../libs/app_const');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const TextComponentInspectionPanel = require("../../page_objects/wizardpanel/liveform/inspection/text.component.inspect.panel");

describe('Generate name for fragments specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const CONTROLLER_NAME = 'main region';
    const TEST_IMAGE_NAME = appConst.TEST_IMAGES.FOSS;
    const FRAGMENT_GENERATED_NAME = 'fragment-text';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, null, [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/1455 Text component name should be sanitised
    it(`GIVEN an image is inserted in text-component WHEN the component has been saved as fragment THEN expected fragment-name should be generated`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentInspectionPanel = new TextComponentInspectionPanel();
            let pageComponentView = new PageComponentView();
            let insertImageDialog = new InsertImageDialog();
            let fragmentInspectionPanel = new FragmentInspectionPanel();
            let siteFormPanel = new SiteFormPanel();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnCollapseContentForm();
            // 2. Insert new text-component
            await pageComponentView.rightClickAndOpenContextMenu('main');
            await pageComponentView.selectContextMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, appConst.PCV_MENU_ITEM.TEXT]);
            // 3. Open 'Insert Image' dialog and insert an image in htmlArea:
            await textComponentInspectionPanel.clickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            await insertImageDialog.filterAndSelectImage(TEST_IMAGE_NAME);
            await insertImageDialog.pause(1000);
            await insertImageDialog.clickOnDecorativeImageRadioButton();
            await insertImageDialog.clickOnInsertButton();
            // 4. Save the text-component as fragment:
            await pageComponentView.rightClickAndOpenContextMenu('Text');
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            await fragmentInspectionPanel.waitForOpened();
            await fragmentInspectionPanel.clickOnEditFragmentButton();
            await contentWizard.pause(700);
            // Switch to the tab with the fragment:
            await studioUtils.doSwitchToNewWizard();
            // 5. Verify the generated display name in the fragment-wizard:
            let fragmentContent = await contentWizard.getDisplayName();
            assert.equal(fragmentContent, 'Text', 'Expected display name should be generated in Fragment-Wizard');
            // 6. Verify that 'Page Component' step wizard is displayed in the fragment-wizard:
            await contentWizard.clickOnWizardStep('Page');
            await pageComponentsWizardStepForm.waitForLoaded();
            // 7. Only one item should be present in Page Component wizard step
            let result = await pageComponentsWizardStepForm.getPageComponentsDisplayName();
            assert.equal(result.length, 1, 'One item should be displayed in the Page Component wizard step');
            assert.ok(result.includes('Text'), 'Text component item should be present in PCV wizard step form');

            await studioUtils.saveScreenshot('x_data_fragment');
            // 8. Verify that x-data toggle is displayed in the fragment-wizard:
            await contentWizard.clickOnXdataMenuTrigger();
            await contentWizard.clickOnXdataMenuItemCheckbox(appConst.X_DATA_NAME.TEXT_AREA_X_DATA_NAME);
            await contentWizard.clickOnConfirmXdataButton();
            // 9. Verify that red icon appears in the wizard, because the fragment gets invalid now, even before a saving:
            await contentWizard.waitUntilInvalidIconAppears();
        });

    // Verify the https://github.com/enonic/app-contentstudio/issues/8255
    // Content Grid displays _path instead of _name #8255
    it(`WHEN a fragment-text with an image has been selected AND Show Inbound button has been pressed THEN the parent site should be filtered in the grid`,
        async () => {
            let contentFilterPanel = new ContentFilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Insert the fragment-text in the search input
            await studioUtils.typeNameInFilterPanel('fragment-text');
            await contentBrowsePanel.pause(1000);
            // 2. Verify that the path should be displayed in the filtered grid:
            await contentBrowsePanel.clickOnRowByName(SITE.displayName + '/' + 'fragment-text');
            await contentBrowsePanel.pause(1000);
            // 3. Open Dependency widget in the Browse Panel:
            await studioUtils.openDependencyWidgetInBrowsePanel();
            let browseDependenciesWidget = new BrowseDependenciesWidget();
            // 4. Click on 'Show all incoming' button:
            await browseDependenciesWidget.clickOnShowAllIncomingButton();
            await studioUtils.doSwitchToNextTab();
            // 'Dependencies Section' should be present, in the filter panel
            await contentFilterPanel.waitForDependenciesSectionVisible();
            await studioUtils.saveScreenshot('issue_text_component_inbound_section');
            let result = await contentBrowsePanel.getDisplayNamesInGrid();

            assert.equal(result[0], SITE.displayName, 'expected display name of dependency');
            assert.equal(result.length, 1, 'One content should be present in the grid');
        });

    // Verify the bug - Content Grid displays _path instead of _name #8255
    it(`WHEN the site has been expanded THEN the expected fragment name should be displayed beneath the site-name`,
        async () => {
            let contentFilterPanel = new ContentFilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Insert the site-name in the search input
            await studioUtils.typeNameInFilterPanel(SITE.displayName);
            await contentBrowsePanel.pause(1000);
            // 2. Expand the site:
            await contentBrowsePanel.clickOnExpanderIcon(SITE.displayName);
            await studioUtils.saveScreenshot('grid_displays_name_8255');
            // 3. Content Grid displays names of the fragments in the site:
            let result = await contentBrowsePanel.getContentNamesInGrid()
            assert.ok(result[1].includes(FRAGMENT_GENERATED_NAME), 'expected fragment name should be displayed in the grid');
        });

    it(`WHEN a fragment-text has been clicked in Page Component View and 'Remove' menu item has been selected THEN the fragment should be removed in the Page Component View`,
        async () => {
            let pageComponentView = new PageComponentView();
            let contentWizard = new ContentWizard();
            let wizardContextPanel = new WizardContextPanel();
            let wizardDependenciesWidget = new WizardDependenciesWidget();
            // 1. Open the site with a fragment(text component)
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on 'minimize-toggle', expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnCollapseContentForm();
            // 3. Click on text-component and expand the menu, then click on Remove menu item:
            await pageComponentView.rightClickAndOpenContextMenu('Text');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.REMOVE]);
            // 4. Save the site:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await wizardContextPanel.openDependenciesWidget();
            // 5. Verify that there are no fragments in Page Component View:
            let result = await pageComponentView.getFragmentsDisplayName();
            assert.equal(result.length, 0, 'Fragment should not be present in Page Component View');
            // 7. 'Show outbound' button should disappear in the widget, because the fragment was removed in Page Component View
            await wizardDependenciesWidget.waitForAllOutgoingButtonNotVisible();
            // 8. 'No outgoing dependencies' message should be displayed:
            await wizardDependenciesWidget.waitForNoOutgoingDependenciesMessage();
        });

    it(`WHEN existing fragment-text has been inserted in site THEN the site should be automatically saved`,
        async () => {
            let pageComponentView = new PageComponentView();
            let contentWizard = new ContentWizard();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnCollapseContentForm();
            // 3. Insert existing text-component
            await pageComponentView.rightClickAndOpenContextMenu('main');
            await pageComponentView.selectContextMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, 'Fragment']);
            let fragmentInspectionPanel = new FragmentInspectionPanel();
            await fragmentInspectionPanel.typeNameAndSelectFragmentByPath(FRAGMENT_GENERATED_NAME);
            await contentWizard.waitForNotificationMessage();
            let result = await pageComponentView.getFragmentsDisplayName();
            assert.equal(result.length, 1, 'single Fragment should be present in Page Component View');
            assert.equal(result[0], 'Text', 'Text Fragment should be present in Page Component View');
        });

    //Verifies : Workflow state is incorrect after pressing Mark as Ready #4964
    it.skip(`GIVEN an image has been inserted in new text-component WHEN 'Mark as ready' button has been pressed THEN Ready for publishing state should be displayed in the wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentInspectionPanel = new TextComponentInspectionPanel();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            let insertImageDialog = new InsertImageDialog();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await studioUtils.saveScreenshot('issue_valid_site');
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnCollapseContentForm();
            // 3. Insert new text-component
            await pageComponentView.rightClickAndOpenContextMenu('main');
            await pageComponentView.selectContextMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, appConst.PCV_MENU_ITEM.TEXT]);
            await textComponentInspectionPanel.waitForOpened();

            // 4. Open 'Insert Image' dialog and insert an image in htmlArea:
            await textComponentInspectionPanel.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            await insertImageDialog.filterAndSelectImage(TEST_IMAGE_NAME);
            await insertImageDialog.clickOnDecorativeImageRadioButton();
            await insertImageDialog.clickOnInsertButton();
            await studioUtils.saveScreenshot('issue_valid_site_2');
            // 5. Click on Mark as ready button and save all:
            await contentWizard.clickOnMarkAsReadyButton();
            await contentWizard.waitForNotificationMessage();
            await contentPublishDialog.clickOnCloseButton();
            // 6. Verify the workflow state:
            await contentWizard.clickOnCollapseContentForm();
            let state = await contentWizard.getContentWorkflowState();
            assert.equal(state, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING,
                "'Ready for publishing' state should be displayed in the wizard");
            // 7. Verify that Save button is disabled:
            await contentWizard.waitForSaveButtonDisabled();
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
