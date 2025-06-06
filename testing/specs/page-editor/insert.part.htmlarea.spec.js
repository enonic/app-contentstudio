/**
 * Created on 15.10.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const TextComponentCke = require('../../page_objects/components/text.component');
const appConst = require('../../libs/app_const');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const PartInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/part.inspection.panel');
const InsertablesPanel = require('../../page_objects/wizardpanel/liveform/insertables.panel');

describe('insert.part.htmlarea.spec - insert a html-part in htlmlarea-content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTROLLER_NAME = 'main region';
    let CONTENT_NAME;
    const PART_DESCRIPTION = 'Html Area Example';
    const PART_FRAGMENT_NAME = 'fragment-html-area-example'
    const TEST_TEXT = 'Test text';
    let TEMPLATE;

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    // verifies - Page Editor is not updated after content is saved #1096
    it(`GIVEN html-area content is opened AND part with html-example has been inserted WHEN text has been typed in the html-area THEN the text should appear in the Page Editor`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let liveFormPanel = new LiveFormPanel();
            let htmlAreaForm = new HtmlAreaForm();
            CONTENT_NAME = contentBuilder.generateRandomName('content');
            // Open new html-area wizard, type the name and type the initial text in the html-area :
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await contentWizard.typeDisplayName(CONTENT_NAME);
            await htmlAreaForm.typeTextInHtmlArea('test1');
            await studioUtils.saveScreenshot('issue_1');
            // 1 Click on the toggler and open 'Page Editor'
            await contentWizard.clickOnPageEditorToggler();
            // 2 Select the page descriptor
            await contentWizard.selectPageDescriptor('main region');
            // 3 Open the context menu
            await pageComponentsWizardStepForm.openMenu('main');
            // 4 click on the 'Insert Part' menu item:
            await pageComponentsWizardStepForm.selectMenuItem(['Insert', 'Part']);
            // 5 Type the name and select the filtered option(select the part):
            await liveFormPanel.selectPartByDisplayName(PART_DESCRIPTION);
            await contentWizard.switchToMainFrame();
            // 6. Type a text in the html-area
            await htmlAreaForm.typeTextInHtmlArea(TEST_TEXT);
            // 7. Save the content:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.switchToLiveEditFrame();
            // 8. wait for the text is updated in Page Editor:
            await studioUtils.saveScreenshot('text_in_part_updated');
            let actualText = await liveFormPanel.getTextInPart();
            assert.equal(actualText, TEST_TEXT, "Text should be updated in 'Page Editor'");
        });

    // Verifies (Case 1): https://github.com/enonic/app-contentstudio/issues/1487 Custom icon is overwritten with the default icon
    it(`GIVEN existing content with part(custom icon) is opened WHEN the part has been duplicated THEN the duplicated part should displayed with custom icon`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            // 1. Open the content:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Open the context menu and duplicate existing part(the content should be saved automatically!):
            await pageComponentView.openMenu(PART_DESCRIPTION);
            await pageComponentView.selectMenuItem(['Duplicate']);
            // 4. Verify that the default icon should be replaced with a custom icon:
            let isDefaultIcon = await pageComponentView.isItemWithDefaultIcon("Html Area Example", 0);
            await studioUtils.saveScreenshot('verify_custom_icon');
            assert.ok(isDefaultIcon === false, 'The initial part should be displayed with the custom icon');
            isDefaultIcon = await pageComponentView.isItemWithDefaultIcon("Html Area Example", 1);
            assert.ok(isDefaultIcon === false, 'The duplicated part should be displayed with the custom icon');
        });

    // Verifies(Case 2) : https://github.com/enonic/app-contentstudio/issues/1487 Custom icon is overwritten with the default icon
    it(`WHEN existing content with 2 parts(custom icon) is opened THEN both parts should displayed with custom icon`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            // 1. Open the content:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Verify that the custom icon should be displayed in each component:
            let isDefaultIcon = await pageComponentView.isItemWithDefaultIcon('Html Area Example', 0);
            assert.ok(isDefaultIcon === false, 'The first part should be displayed with the custom icon');
            isDefaultIcon = await pageComponentView.isItemWithDefaultIcon('Html Area Example', 1);
            assert.ok(isDefaultIcon === false, 'The second part should be displayed with the custom icon');
        });

    // https://github.com/enonic/app-contentstudio/issues/1474  Part description is not shown when the part is included more than once
    it(`GIVEN existing content with duplicated part WHEN Page Component View has been opened THEN description should be in both items in the dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            // 1. Open the content:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Verify that descriptions should be in both items in the dialog:
            let description1 = await pageComponentView.getComponentDescription('Html Area Example', 0);
            assert.equal(description1, PART_DESCRIPTION, 'Expected description should be present in the first item');
            let description2 = await pageComponentView.getComponentDescription('Html Area Example', 1);
            assert.equal(description2, PART_DESCRIPTION, 'Expected description should be present in the second item');
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/1523 "Custom icon is overwritten with the default icon in Fragment wizard"
    it(`GIVEN existing content is opened WHEN part with custom icon has been saved as fragment THEN custom icon should be present in fragment-wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            //1. Open the content:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Expand the menu and click on "Save as Fragment" menu item
            await pageComponentView.openMenu(PART_DESCRIPTION);
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            // 4. Go to Fragment Wizard (generated displayName is 'Html Area Example'")
            await studioUtils.switchToContentTabWindow('Html Area Example');
            // pageComponentsWizard Step Form should be loaded by default in the fragment wizard
            // 6. Verify that custom icon should be present in Fragment Wizard:
            await pageComponentsWizardStepForm.waitForLoaded();
            await studioUtils.saveScreenshot('fragment_wizard_component_step');
            let isDefaultIcon = await pageComponentsWizardStepForm.isItemWithDefaultIcon('Html Area Example');
            assert.ok(isDefaultIcon === false, 'The part should be displayed with the custom icon');
            //7. Verify that expected part-descriptions should be displayed in the dialog:
            let actualDescription = await pageComponentsWizardStepForm.getComponentDescription("Html Area Example");
            assert.equal(actualDescription, PART_DESCRIPTION, "Expected description should be present in the menu item");
        });

    // Verify issue 7543
    // need to preselect layout/part/text of the fragment when nothing is selected in the Page Component view of a fragment. If it's selected and then unselected, then controller stays correctly selected in the Inspect panel.
    it(`GIVEN html-area content is opened AND part with html-example has been inserted WHEN text has been typed in the html-area THEN the text should appear in the Page Editor`,
        async () => {
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let partInspectionPanel = new PartInspectionPanel();
            // 1. Open the fragment created from the part:
            await studioUtils.openContentAndSwitchToTabByDisplayName(PART_FRAGMENT_NAME, PART_DESCRIPTION);
            await partInspectionPanel.waitForOpened();
            // 2. Verify that Part Inspection panel loaded with expected selected option in the dropdown:
            let selectedOption = await partInspectionPanel.getDropdownSelectedOption();
            assert.equal(selectedOption, PART_DESCRIPTION, "Expected selected option should be displayed in the Part tab");
            await pageComponentsWizardStepForm.clickOnComponent(PART_DESCRIPTION);
            await studioUtils.saveScreenshot('part_fragment_wizard_inspect_panel');
            selectedOption = await partInspectionPanel.getDropdownSelectedOption();
            assert.equal(selectedOption, PART_DESCRIPTION, "Expected selected option should be displayed in the Part tab");
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/1523 Case 2
    it(`GIVEN existing content with fragment(created from a part) is opened WHEN fragment has been detached THEN part with custom icon should appear in the Page Component View`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            // 1. Open existing content with fragment and part:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Expand the menu and click on "Detach from fragment" menu item
            await pageComponentView.openMenuByDescription('part');
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.DETACH_FROM_FRAGMENT);
            // 4. Verify that custom icon should be displayed after the part detached from fragment:
            let isDefaultIcon = await pageComponentView.isItemWithDefaultIcon("Html Area Example", 0);
            assert.ok(isDefaultIcon === false, 'The part should be displayed with the custom icon');
            isDefaultIcon = await pageComponentView.isItemWithDefaultIcon("Html Area Example", 1);
            assert.ok(isDefaultIcon === false, 'The part should be displayed with the custom icon');
        });

    // Verify the issue - Part Inspection panel remains visible after removing a part #7523
    it(`GIVEN a part has been selected in PCV WHEN the part has been removed THEN 'Insert panel' should be loaded in Context Window`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let partInspectionPanel = new PartInspectionPanel();
            let insertablesPanel = new InsertablesPanel();
            // 1. Open the content:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. Click on minimize-toggler, expand 'Live Edit' and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Select the 'Html area' part:
            await pageComponentView.clickOnComponent(PART_DESCRIPTION);
            // 4. Verify that 'Part Inspection Panel' is loaded:
            await partInspectionPanel.waitForOpened();
            // 5. Expand the menu and click on "Remove" menu item in PCV:
            await pageComponentView.openMenu(PART_DESCRIPTION);
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.REMOVE);
            // 6. Verify that 'Insert panel' is loaded after removing a selected part:
            await insertablesPanel.waitForOpened();
            // 7. Verify that 'Save' button is enabled
            await contentWizard.waitForSaveButtonEnabled();
            let items = await insertablesPanel.getItems();
            assert.equal(items.length, 4, 'Four items should be present in Insert panel');

        });

    it(`GIVEN new page template with a text component is saved WHEN text component context menu has been opened THEN 'Save as fragment' menu item should not be present in the menu`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            // 1. Expand the site and add a template:
            let templateName = contentBuilder.generateRandomName('template');
            TEMPLATE = contentBuilder.buildPageTemplate(templateName, 'Site', CONTROLLER_NAME);
            await studioUtils.doOpenPageTemplateWizard(SITE.displayName);
            await contentWizard.typeData(TEMPLATE);
            await contentWizard.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.ENONIC_RENDERING);
            await contentWizard.selectPageDescriptor(TEMPLATE.data.controllerDisplayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3.Click on the item and open Context Menu:
            await pageComponentView.openMenu('main');
            // 4. Insert Text Component with test text and save it:
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.typeTextInCkeEditor('test text');
            await contentWizard.waitAndClickOnSave();
            // 5. Open text-component context menu:
            await pageComponentView.openMenu('test text');
            await studioUtils.saveScreenshot('fragment-template-context-menu');
            // 6. Verify that 'Save as Fragment' menu item is not present in the menu:
            await pageComponentView.waitForMenuItemNotDisplayed(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            // 7. Verify that 'Save as Template' menu item is not present in the menu:
            await pageComponentView.waitForMenuItemNotDisplayed(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_TEMPLATE);
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
