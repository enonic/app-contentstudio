/**
 * Created on 19.02.2020.
 * verifies : Descriptor dropdowns in the Inspection panel is not updated after content path has changed #1095
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const LayoutInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/layout.inspection.panel');
const FragmentInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/fragment.inspection.panel');

describe('fragment.inspect.panel.update.path.spec - Select a site with not valid child and try to publish it', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let FRAGMENT_LAYOUT_DESCRIPTION = "layout";

    //Verifies:
    // 1)"Descriptor dropdowns in the Inspection panel is not updated after content path has changed #1095"
    // 2) Page Component View - incorrect description of a fragment. https://github.com/enonic/app-contentstudio/issues/1534
    it("GIVEN layout saved as fragment in new site WHEN site's name has been updated THEN path should be updated in selected option in Fragment Inspect Panel",
        async () => {
            let pageComponentView = new PageComponentView();
            let fragmentInspectionPanel = new FragmentInspectionPanel();
            let siteFormPanel = new SiteFormPanel();
            let layoutInspectionPanel = new LayoutInspectionPanel();
            let displayName = contentBuilder.generateRandomName('site');
            let contentWizardPanel = new ContentWizardPanel();
            //1. Open new site-wizard, select an application and controller:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await siteFormPanel.addApplications([appConst.SIMPLE_SITE_APP]);
            await contentWizardPanel.selectPageDescriptor("main");
            //2. Open Component View and insert the layout:
            await contentWizardPanel.clickOnShowComponentViewToggler();
            await pageComponentView.openMenu("main");
            await pageComponentView.selectMenuItem(["Insert", "Layout"]);
            await layoutInspectionPanel.typeNameAndSelectLayout('3-col');
            await pageComponentView.openMenu('3-col');
            //3. Click on 'Save as Fragment' menu item. (Save the layout as fragment)
            await pageComponentView.clickOnMenuItem(appConst.MENU_ITEMS.SAVE_AS_FRAGMENT);
            await contentWizardPanel.pause(3000);
            //4. Type new site's name and save:
            await contentWizardPanel.typeDisplayName(displayName);
            await contentWizardPanel.waitAndClickOnSave();
            // wait for the description is refreshing:
            await contentWizardPanel.pause(1400);
            //5. Fragment Inspection Panel should be loaded automatically. Verify that path is updated in the dropdown:
            let actualPath = await fragmentInspectionPanel.getSelectedOptionPath();
            assert.include(actualPath, displayName, "Path should be updated in Fragment Inspection Panel");
            //6. Verify that expected description should be in the fragment 'component item'
            let actualDescription = await pageComponentView.getComponentDescription("3-col");
            assert.equal(actualDescription, FRAGMENT_LAYOUT_DESCRIPTION, "Expected description should be present in 'component item'")
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
