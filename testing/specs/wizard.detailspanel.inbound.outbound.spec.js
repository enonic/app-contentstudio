/**
 * Created on 22.08.2018.
 *
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const ContentFilterPanel = require('../page_objects/browsepanel/content.filter.panel');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const PageComponentView = require("../page_objects/wizardpanel/liveform/page.components.view");
const LiveFormPanel = require("../page_objects/wizardpanel/liveform/live.form.panel");
const WizardDetailsPanel = require('../page_objects/wizardpanel/details/wizard.details.panel');
const WizardDependenciesWidget = require('../page_objects/wizardpanel/details/wizard.dependencies.widget');

describe('wizard.detailspanel.inbound.outbound: select a content with inbound and outbound dependencies and check dependencies',
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();

        let IMAGE_DISPLAY_NAME = 'kotey';
        let SITE;
        let TEMPLATE;
        let SUPPORT = 'Site';
        let CONTROLLER_NAME = 'main region';

        it(`Precondition: new site should be added`,
            async () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App']);
                await studioUtils.doAddSite(SITE);
            });

        it(`Precondition: new template has been added`,
            async () => {
                let contentBrowsePanel = new ContentBrowsePanel();
                let templateName = contentBuilder.generateRandomName('template');
                TEMPLATE = contentBuilder.buildPageTemplate(templateName, SUPPORT, CONTROLLER_NAME);
                await studioUtils.doAddPageTemplate(SITE.displayName, TEMPLATE);
                await studioUtils.findAndSelectItem(TEMPLATE.displayName);
                await contentBrowsePanel.waitForContentDisplayed(TEMPLATE.displayName);
            });

        it(`GIVEN existing site is opened WHEN an image has been inserted and saved as fragment AND Dependencies widget opened in the site-wizard THEN 'Show Outbound' button should be present but 'Show Inbound' should be hidden`,
            async () => {
                let siteWizard = new ContentWizard();
                let pageComponentView = new PageComponentView();
                let liveFormPanel = new LiveFormPanel();
                let wizardDetailsPanel = new WizardDetailsPanel();
                let wizardDependenciesWidget = new WizardDependenciesWidget();
                //Select and open the site:
                await studioUtils.selectContentAndOpenWizard(SITE.displayName);
                await siteWizard.doUnlockLiveEditor();

                await siteWizard.switchToMainFrame();
                //Open Page Component View dialog and click on Insert Image menu item:
                await siteWizard.clickOnShowComponentViewToggler();
                await pageComponentView.openMenu("main");
                await pageComponentView.selectMenuItemAndCloseDialog(["Insert", "Image"]);
                //Select the image in the image-selector:
                await liveFormPanel.selectImageByDisplayName(IMAGE_DISPLAY_NAME);
                await siteWizard.switchToMainFrame();
                //Open Page Component View:
                await siteWizard.clickOnShowComponentViewToggler();
                //open the context menu:
                await pageComponentView.openMenu(IMAGE_DISPLAY_NAME);
                //Click on 'Save as Fragment' menu item:
                    await pageComponentView.clickOnMenuItem(appConstant.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
                await pageComponentView.pause(3000);

                //open Details panel in the site-wizard:
                await siteWizard.openDetailsPanel();
                await wizardDetailsPanel.openDependencies();
                studioUtils.saveScreenshot('site_wizard_dependencies');
                //`Show outbound` button should be present in the widget, because new fragment has been created in the site wizard'
                await wizardDependenciesWidget.waitForOutboundButtonVisible();

                let isVisible = await wizardDependenciesWidget.isInboundButtonVisible();
                assert.isFalse(isVisible, '`Show Inbound` button should not be present, because the site has no inbound dependencies');
            });

        it(`GIVEN existing site with fragment WHEN fragment has been selected AND Dependencies widget opened  THEN 'Show Outbound' button should be present AND 'Show Inbound' should be present`,
            async () => {
                let wizardDetailsPanel = new WizardDetailsPanel();
                let contentWizard = new ContentWizard();
                let wizardDependenciesWidget = new WizardDependenciesWidget();
                //1. Open the fragment:
                await studioUtils.selectContentAndOpenWizard('fragment-' + IMAGE_DISPLAY_NAME);
                await contentWizard.openDetailsPanel();
                //2. Open Dependencies-widget:
                await wizardDetailsPanel.openDependencies();
                studioUtils.saveScreenshot('fragment_wizard_dependencies');
                // 'Show outbound' button should be present on the widget, because the fragment was created from an image
                await wizardDependenciesWidget.waitForOutboundButtonVisible();
                //'Show Inbound' button should be present, because the fragment has parent site:
                await wizardDependenciesWidget.waitForInboundButtonVisible();
            });

        it(`GIVEN existing site with fragment WHEN 'Show Outbound' button has been pressed THEN 'Dependencies Section' should appear in the new browser-tab`,
            async () => {
                let contentWizard = new ContentWizard();
                let wizardDetailsPanel = new WizardDetailsPanel();
                let wizardDependenciesWidget = new WizardDependenciesWidget();
                let contentFilterPanel = new ContentFilterPanel();
                let contentBrowsePanel = new ContentBrowsePanel();
                //1. Open the fragment:
                await studioUtils.selectContentAndOpenWizard('fragment-' + IMAGE_DISPLAY_NAME);
                await contentWizard.openDetailsPanel();
                await wizardDetailsPanel.openDependencies();

                //2. Click on 'Show Outbound' button:
                await wizardDependenciesWidget.clickOnShowOutboundButton();
                await wizardDependenciesWidget.pause(1000);
                //3. Switch to the next browser-tab:
                await studioUtils.doSwitchToNextTab();
                //4. 'Dependencies Section' should be present, in the filter panel'
                await contentFilterPanel.waitForDependenciesSectionVisible();
                studioUtils.saveScreenshot('outbound_dep_in_new_tab');
                let result = await contentBrowsePanel.getDisplayNamesInGrid();

                assert.equal(result[0], IMAGE_DISPLAY_NAME, 'expected display name of dependency');
                assert.equal(result.length, 1, 'One content should be present in the grid');
            });

        it(`GIVEN existing site with fragment is opened WHEN fragment has been removed in 'Page Component View'  THEN 'No outgoing dependencies' should appears`,
            async () => {
                let contentWizard = new ContentWizard();
                let pageComponentView = new PageComponentView();
                let wizardDetailsPanel = new WizardDetailsPanel();
                let wizardDependenciesWidget = new WizardDependenciesWidget();
                //1. Site is opened:
                await studioUtils.selectContentAndOpenWizard(SITE.displayName);
                await contentWizard.openDetailsPanel();
                //2. Dependencies widget is opened:
                await wizardDetailsPanel.openDependencies();
                //3. Open Page Component View and remove the fragment:
                await contentWizard.clickOnShowComponentViewToggler();
                await pageComponentView.openMenu(IMAGE_DISPLAY_NAME);
                await pageComponentView.selectMenuItem(["Remove"]);
                //4. Save the site:
                await contentWizard.waitAndClickOnSave();
                studioUtils.saveScreenshot('fragment_removed_dependencies');
                //5. 'Show outbound" button should disappear in the widget, because the fragment was removed in Page Component View
                await wizardDependenciesWidget.waitForOutboundButtonNotVisible();
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification is starting: ' + this.title);
        });
    });
