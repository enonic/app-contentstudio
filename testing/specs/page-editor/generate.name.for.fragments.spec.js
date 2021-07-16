/**
 * Created on 25.02.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const ContentFilterPanel = require('../../page_objects/browsepanel/content.filter.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const InsertImageDialog = require('../../page_objects/wizardpanel/insert.image.dialog.cke');
const BrowseDependenciesWidget = require('../../page_objects/browsepanel/detailspanel/browse.dependencies.widget');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const WizardDependenciesWidget = require('../../page_objects/wizardpanel/details/wizard.dependencies.widget');


describe('Generate name for fragments  specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let CONTROLLER_NAME = 'main region';
    let TEST_IMAGE_NAME = appConstant.TEST_IMAGES.FOSS;


    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.SIMPLE_SITE_APP], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/1455 Text component name should be sanitised
    it(`GIVEN an image is inserted in text-component WHEN the component has been saved as fragment THEN expected fragment-name should be generated`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            let insertImageDialog = new InsertImageDialog();
            //1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            //2. Insert new text-component
            await pageComponentView.openMenu("main");
            await pageComponentView.selectMenuItemAndCloseDialog(["Insert", "Text"]);
            await textComponentCke.switchToLiveEditFrame();
            //3. Open 'Insert Image' dialog and insert an image in htmlArea:
            await textComponentCke.clickOnInsertImageButton();
            await insertImageDialog.filterAndSelectImage(TEST_IMAGE_NAME);
            await insertImageDialog.clickOnInsertButton();
            //4. Save the text-component as fragment:
            await contentWizard.clickOnShowComponentViewToggler();
            await pageComponentView.openMenu("Text");
            await pageComponentView.clickOnMenuItem(appConstant.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            await contentWizard.pause(700);
            await studioUtils.doSwitchToNewWizard();
            //5. Verify the generated display name:
            let fragmentContent = await contentWizard.getDisplayName();
            assert.equal(fragmentContent, "Text", "Expected display name should be generated in Fragment-Wizard");
        });

    it(`WHEN a fragment-text with an image has been selected AND Show Inbound button has been pressed THEN the parent site should be filtered in the grid`,
        async () => {
            let contentFilterPanel = new ContentFilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.typeNameInFilterPanel("fragment-text");
            await contentBrowsePanel.pause(1000);
            await contentBrowsePanel.clickOnRowByName(SITE.displayName + "/" + "fragment-text");
            await contentBrowsePanel.pause(1000);
            await studioUtils.openDependencyWidgetInBrowsePanel();
            let browseDependenciesWidget = new BrowseDependenciesWidget();
            await browseDependenciesWidget.clickOnShowInboundButton();
            await studioUtils.doSwitchToNextTab();
            //5. 'Dependencies Section' should be present, in the filter panel'
            await contentFilterPanel.waitForDependenciesSectionVisible();
            studioUtils.saveScreenshot('text_component_inbound_section');
            let result = await contentBrowsePanel.getDisplayNamesInGrid();

            assert.equal(result[0], SITE.displayName, 'expected display name of dependency');
            assert.equal(result.length, 1, 'One content should be present in the grid');
        });

    it(`WHEN a fragment-text has been clicked in Page Component View and 'Remove' menu item has been selected THEN the fragment should be removed in the Page Component View`,
        async () => {
            let pageComponentView = new PageComponentView();
            let contentWizard = new ContentWizard();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let wizardDependenciesWidget = new WizardDependenciesWidget();
            //1. Open the site with a fragment(text component)
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            //2. Click on text-component and expand the menu, then click on Remove menu item:
            await pageComponentView.openMenu("Text");
            await pageComponentView.selectMenuItemAndCloseDialog([appConstant.COMPONENT_VIEW_MENU_ITEMS.REMOVE]);
            //3. Save the site:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            //TODO check this behavior:
            await wizardDetailsPanel.openDependencies();
            //4. Verify that there are no fragments in Page Component View:
            await contentWizard.clickOnComponentViewToggler();
            let result = await pageComponentView.getFragmentsDisplayName();
            assert.equal(result.length, 0, "Fragment should not be present in Page Component View");
            //5. 'Show outbound" button should disappear in the widget, because the fragment was removed in Page Component View
            await wizardDependenciesWidget.waitForOutboundButtonNotVisible();
            //6. 'No outgoing dependencies' message should be displayed:
            await wizardDependenciesWidget.waitForNoOutgoingDependenciesMessage();
        });

    it(`WHEN existing fragment-text has been inserted in site THEN the site should be automatically saved`,
        async () => {
            let pageComponentView = new PageComponentView();
            let contentWizard = new ContentWizard();
            let liveFormPanel = new LiveFormPanel();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            //2. Insert existing text-component
            await pageComponentView.openMenu("main");
            await pageComponentView.selectMenuItemAndCloseDialog([appConstant.COMPONENT_VIEW_MENU_ITEMS.INSERT, "Fragment"]);
            await contentWizard.clickOnComponentViewToggler();
            await liveFormPanel.selectFragmentByDisplayName("Text");
            await contentWizard.switchToMainFrame();
            await contentWizard.waitForNotificationMessage();
            let result = await pageComponentView.getFragmentsDisplayName();
            assert.equal(result.length, 1, "single Fragment should be present in Page Component View");
        });

    //Verifies -  xp/issues/7831, Component Names - generate proper names for Fragment component #7831
    it(`GIVEN an layout component is inserted WHEN the empty layout has been saved as fragment THEN expected fragment-name should be generated`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            //1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            //2. Insert new layout-component
            await pageComponentView.openMenu("main");
            await pageComponentView.selectMenuItem(["Insert", "Layout"]);
            //3. Save the empty layout-component as fragment:
            await pageComponentView.openMenu("Layout");
            await pageComponentView.clickOnMenuItem(appConstant.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            await contentWizard.pause(700);
            await studioUtils.doSwitchToNewWizard();
            //4. Verify the generated display name(should be 'Layout'):
            let fragmentContent = await contentWizard.getDisplayName();
            assert.equal(fragmentContent, "Layout", "Expected display name should be generated in Fragment-Wizard");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
