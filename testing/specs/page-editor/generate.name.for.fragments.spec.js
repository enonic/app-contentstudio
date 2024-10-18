/**
 * Created on 25.02.2020.
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
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const WizardDependenciesWidget = require('../../page_objects/wizardpanel/details/wizard.dependencies.widget');
const FragmentInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/fragment.inspection.panel');
const appConst = require('../../libs/app_const');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');

describe('Generate name for fragments specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const CONTROLLER_NAME = 'main region';
    const TEST_IMAGE_NAME = appConst.TEST_IMAGES.FOSS;

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/1455 Text component name should be sanitised
    it(`GIVEN an image is inserted in text-component WHEN the component has been saved as fragment THEN expected fragment-name should be generated`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            let insertImageDialog = new InsertImageDialog();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 2. Insert new text-component
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.switchToLiveEditFrame();
            // 3. Open 'Insert Image' dialog and insert an image in htmlArea:
            await textComponentCke.clickOnInsertImageButton();
            await insertImageDialog.filterAndSelectImage(TEST_IMAGE_NAME);
            await insertImageDialog.clickOnDecorativeImageRadioButton();
            await insertImageDialog.clickOnInsertButton();
            // 4. Save the text-component as fragment:
            await pageComponentView.openMenu('Text');
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            await contentWizard.pause(700);
            await studioUtils.doSwitchToNewWizard();
            // 5. Verify the generated display name:
            let fragmentContent = await contentWizard.getDisplayName();
            assert.equal(fragmentContent, 'Text', 'Expected display name should be generated in Fragment-Wizard');
            // 6. Verify that 'Page Component' step wizard is displayed in the fragment-wizard:
            await pageComponentsWizardStepForm.waitForLoaded();
            // 7. Only one item should be present in Page Component wizard step
            let result = await pageComponentsWizardStepForm.getPageComponentsDisplayName();
            assert.equal(result.length, 1, 'One item should be displayed in the Page Component wizard step');
            assert.ok(result.includes('Text'), 'City list part should be present in the dialog');
        });

    it(`WHEN a fragment-text with an image has been selected AND Show Inbound button has been pressed THEN the parent site should be filtered in the grid`,
        async () => {
            let contentFilterPanel = new ContentFilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.typeNameInFilterPanel('fragment-text');
            await contentBrowsePanel.pause(1000);
            await contentBrowsePanel.clickOnRowByName(SITE.displayName + '/' + 'fragment-text');
            await contentBrowsePanel.pause(1000);
            await studioUtils.openDependencyWidgetInBrowsePanel();
            let browseDependenciesWidget = new BrowseDependenciesWidget();
            await browseDependenciesWidget.clickOnShowInboundButton();
            await studioUtils.doSwitchToNextTab();
            // 'Dependencies Section' should be present, in the filter panel
            await contentFilterPanel.waitForDependenciesSectionVisible();
            await studioUtils.saveScreenshot('issue_text_component_inbound_section');
            let result = await contentBrowsePanel.getDisplayNamesInGrid();

            assert.equal(result[0], SITE.displayName, 'expected display name of dependency');
            // TODO uncomment it
            //assert.equal(result.length, 1, 'One content should be present in the grid');
        });

    it(`WHEN a fragment-text has been clicked in Page Component View and 'Remove' menu item has been selected THEN the fragment should be removed in the Page Component View`,
        async () => {
            let pageComponentView = new PageComponentView();
            let contentWizard = new ContentWizard();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let wizardDependenciesWidget = new WizardDependenciesWidget();
            // 1. Open the site with a fragment(text component)
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Click on text-component and expand the menu, then click on Remove menu item:
            await pageComponentView.openMenu('Text');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.REMOVE]);
            // 4. Save the site:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            //TODO check this behavior:
            await wizardDetailsPanel.openDependencies();
            // 5. Verify that there are no fragments in Page Component View:
            let result = await pageComponentView.getFragmentsDisplayName();
            assert.equal(result.length, 0, 'Fragment should not be present in Page Component View');
            // 7. 'Show outbound' button should disappear in the widget, because the fragment was removed in Page Component View
            await wizardDependenciesWidget.waitForOutboundButtonNotVisible();
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
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert existing text-component
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, 'Fragment']);
            await liveFormPanel.selectFragmentByDisplayName('Text');
            await contentWizard.switchToMainFrame();
            await contentWizard.waitForNotificationMessage();
            let result = await pageComponentView.getFragmentsDisplayName();
            assert.equal(result.length, 1, 'single Fragment should be present in Page Component View');
            assert.equal(result[0], 'Text', 'Text Fragment should be present in Page Component View');
        });

    //Verifies -  xp/issues/7831, Component Names - generate proper names for Fragment component #7831
    it(`GIVEN an layout component is inserted WHEN the empty layout has been saved as fragment THEN expected fragment-name should be generated`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert new layout-component
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Layout']);
            // 4. Save the empty layout-component as fragment:
            await pageComponentView.openMenu("Layout");
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            await contentWizard.pause(1000);
            await studioUtils.doSwitchToNewWizard();
            // 5. Verify the generated display name(should be 'Layout'):
            let fragmentContent = await contentWizard.getDisplayName();
            assert.equal(fragmentContent, 'Layout', 'Expected display name should be generated in Fragment-Wizard');
        });

    it(`GIVEN existing site is opened WHEN the third fragment has been added and selected in Fragment Inspection panel THEN 3 fragments should be present in Live Edit`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let fragmentInspectionPanel = new FragmentInspectionPanel();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert new fragment-component
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Fragment']);
            // 4. Select a fragment in Inspection Panel:
            let fragmentDisplayName = 'Layout';
            await fragmentInspectionPanel.typeNameAndSelectFragment(fragmentDisplayName);
            await studioUtils.saveScreenshot('fragment-inserted-in-inspect');
            // 5. Verify that the site is automatically saved and Save button is disabled
            await contentWizard.waitForNotificationMessage();
            await contentWizard.waitForSaveButtonDisabled();
            // 6. Verify the number of fragments in Live Edit:
            let number = await liveFormPanel.getFragmentsNumber();
            assert.equal(number, 3, 'Three fragments should be in Live Edit');
        });

    //Verifies : Workflow state is incorrect after pressing Mark as Ready #4964
    it(`GIVEN an image has been inserted in new text-component WHEN 'Mark as ready' button has been pressed THEN Ready for publishing state should be displayed in the wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            let insertImageDialog = new InsertImageDialog();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert new text-component
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.switchToLiveEditFrame();
            // 4. Open 'Insert Image' dialog and insert an image in htmlArea:
            await textComponentCke.clickOnInsertImageButton();
            await insertImageDialog.filterAndSelectImage(TEST_IMAGE_NAME);
            await insertImageDialog.clickOnDecorativeImageRadioButton();
            await insertImageDialog.clickOnInsertButton();
            // 5. Click on Mark as ready button and save all:
            await contentWizard.clickOnMarkAsReadyButton();
            await contentWizard.waitForNotificationMessage();
            await contentPublishDialog.clickOnCancelTopButton();
            // 6. Verify the workflow state:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            let state = await contentWizard.getContentWorkflowState();
            assert.equal(state, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING, "'Ready for publishing' state should be displayed in the wizard");
            // 7. Verify that Save button is disabled:
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
