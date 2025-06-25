/**
 * Created on 12/2/2017.
 */
const LauncherPanel = require('../page_objects/launcher.panel');
const HomePage = require('../page_objects/home.page');
const LoginPage = require('../page_objects/login.page');
const BrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const FilterPanel = require("../page_objects/browsepanel/content.filter.panel");
const appConst = require("./app_const");
const lib = require("./elements-old");
const NewContentDialog = require('../page_objects/browsepanel/new.content.dialog');
const ContentWizardPanel = require('../page_objects/wizardpanel/content.wizard.panel');
const webDriverHelper = require("./WebDriverHelper");
const IssueListDialog = require('../page_objects/issue/issue.list.dialog');
const CreateIssueDialog = require('../page_objects/issue/create.issue.dialog');
const DeleteContentDialog = require('../page_objects/delete.content.dialog');
const InsertLinkDialog = require('../page_objects/wizardpanel/html-area/insert.link.modal.dialog.cke');
const ContentPublishDialog = require('../page_objects/content.publish.dialog');
const BrowseContextWindowPanel = require('../page_objects/browsepanel/detailspanel/browse.context.window.panel');
const BrowseDependenciesWidget = require('../page_objects/browsepanel/detailspanel/browse.dependencies.widget');
const ContentUnpublishDialog = require('../page_objects/content.unpublish.dialog');
const CreateRequestPublishDialog = require('../page_objects/issue/create.request.publish.dialog');
const ProjectSelectionDialog = require('../page_objects/project/project.selection.dialog');
const SettingsBrowsePanel = require('../page_objects/project/settings.browse.panel');
const UserBrowsePanel = require('../page_objects/users/userbrowse.panel');
const AppBrowsePanel = require('../page_objects/applications/applications.browse.panel');
const UserWizard = require('../page_objects/users/user.wizard');
const NewPrincipalDialog = require('../page_objects/users/new.principal.dialog');
const PrincipalFilterPanel = require('../page_objects/users/principal.filter.panel');
const ConfirmationDialog = require('../page_objects/confirmation.dialog');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const ConfirmValueDialog = require('../page_objects/confirm.content.delete.dialog');
const DateTimeRange = require('../page_objects/components/datetime.range');
const WizardDependenciesWidget = require('../page_objects/wizardpanel/details/wizard.dependencies.widget');
const WizardContextPanel = require('../page_objects/wizardpanel/details/wizard.context.window.panel');
const fs = require('fs');
const path = require('path');
const PropertiesWidgetItem = require('../page_objects/browsepanel/detailspanel/properties.widget.itemview');
const EditSettingDialog = require('../page_objects/details_panel/edit.settings.dialog');
const InsertLinkDialogContentPanel = require('../page_objects/wizardpanel/html-area/insert.link.modal.dialog.content.panel');
const InsertLinkDialogUrlPanel = require('../page_objects/wizardpanel/html-area/insert.link.modal.dialog.url.panel');
const PageInspectionPanel = require('../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');
const LiveFormPanel = require('../page_objects/wizardpanel/liveform/live.form.panel');

module.exports = {

    getBrowser() {
        if (typeof browser !== 'undefined') {
            return browser;
        } else {
            return webDriverHelper.browser;
        }
    },

    async setTextInCKE(id, text) {
        let script = `CKEDITOR.instances['${id}'].setData('${text}')`;
        await this.getBrowser().execute(script);
        let script2 = `CKEDITOR.instances['${id}'].fire('change')`;
        //let script2 = `CKEDITOR.instances['${id}'].element.$.dispatchEvent(new Event('paste'))`;
        return await this.getBrowser().execute(script2);
    },

    insertTextInCKE(id, text) {
        let script = `CKEDITOR.instances['${id}'].insertText('${text}')`;
        return this.getBrowser().execute(script).then(() => {
            let script2 = `CKEDITOR.instances['${id}'].fire('change')`;
            return this.getBrowser().execute(script2);
        })
    },
    async waitForElementDisplayed(selector, ms) {
        let element = await this.getBrowser().$(selector);
        return await element.waitForDisplayed(ms);
    },
    async waitForElementNotDisplayed(selector, ms) {
        let element = await this.getBrowser().$(selector);
        return await element.waitForDisplayed(ms);
    },
    async clickOnElement(selector) {
        let el = await this.getBrowser().$(selector);
        await el.waitForDisplayed({timeout: 2000});
        return await el.click();
    },
    async getText(selector) {
        let el = await this.getBrowser().$(selector);
        await el.waitForDisplayed({timeout: 2000});
        return await el.getText();
    },

    async isElementDisplayed(selector) {
        let el = await this.getBrowser().$(selector);
        return await el.isDisplayed();
    },
    getPageSource() {
        return this.getBrowser().getPageSource();
    },

    async switchToFrameBySrc(src) {
        try {
            let selector = `//iframe[contains(@src,'${src}')]`;
            let el = await this.getBrowser().$(selector);
            await el.waitForDisplayed({timeout: 2000});
            await this.getBrowser().switchFrame(el);
        } catch (err) {
            throw new Error('Error when switch to frame  ' + err);
        }
    },
    getTitle() {
        return this.getBrowser().getTitle();
    },

    getTextInCKE(id) {
        let script = `return CKEDITOR.instances['${id}'].getData()`;
        return this.getBrowser().execute(script);
    },
    scrollViewPort(viewportElement, step) {
        return this.getBrowser().execute("arguments[0].scrollTop=arguments[1]", viewportElement, step);
    },
    async insertUrlLinkInCke(text, url) {
        let insertLinkDialog = new InsertLinkDialog();
        let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
        await insertLinkDialog.clickOnBarItem('URL');
        await insertLinkDialog.typeInLinkTextInput(text);
        await insertLinkDialogUrlPanel.typeUrl(url);
        await insertLinkDialog.clickOnInsertButtonAndWaitForClosed();
        return await this.getBrowser().pause(200);
    },
    async insertTellLinkInCke(text, tel) {
        let insertLinkDialog = new InsertLinkDialog();
        let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
        await insertLinkDialog.clickOnBarItem('URL');
        await insertLinkDialog.typeInLinkTextInput(text);
        await insertLinkDialogUrlPanel.clickOnUrlTypeMenuOption(appConst.URL_TYPE_OPTION.TEL);
        await insertLinkDialogUrlPanel.typeUrl(tel);
        await insertLinkDialog.clickOnInsertButtonAndWaitForClosed();
        return await this.getBrowser().pause(200);
    },
    async insertEmailLinkInCke(text, email) {
        let insertLinkDialog = new InsertLinkDialog();
        await insertLinkDialog.clickOnBarItem('Email');
        await insertLinkDialog.typeInLinkTextInput(text);
        await insertLinkDialog.typeTextInEmailInput(email);
        await this.saveScreenshot('email_link_dialog');
        await insertLinkDialog.clickOnInsertButtonAndWaitForClosed();
        return await insertLinkDialog.pause(200);
    },

    async insertContentLinkInCke(text, contentDisplayName, entireProject) {
        try {
            let insertLinkDialog = new InsertLinkDialog();
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            await insertLinkDialog.typeInLinkTextInput(text);
            if (entireProject) {
                await insertLinkDialogContentPanel.clickOnShowContentFromEntireProjectCheckbox();
            }
            await insertLinkDialogContentPanel.typeTextInFilterInputInContentSelector(contentDisplayName);
            // After inserting a search text the dropdown should be switched to 'Flat mode', click on the folder(don't need to click on 'Apply' button):
            await insertLinkDialogContentPanel.clickOnOptionByDisplayName(contentDisplayName);
            await this.saveScreenshot('content_link_dialog');
            await insertLinkDialog.clickOnInsertButton();
            return await insertLinkDialog.pause(700);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_insert_content_link');
            throw new Error(`Error when insert content link in CKE, screenshot: ${screenshot} ` + err);
        }
    },
    async doCloseCurrentBrowserTab() {
        let title = await this.getBrowser().getTitle();
        if (title !== 'Enonic XP Home') {
            //return await this.getBrowser().closeWindow();
            return await this.getBrowser().execute('window.close();')
        }
    },
    async openIssuesListDialog() {
        let browsePanel = new BrowsePanel();
        let issueListDialog = new IssueListDialog();
        await browsePanel.clickOnShowIssuesListButton();
        await issueListDialog.waitForDialogOpened();
        return await issueListDialog.pause(300);
    },
    async openCreateIssueDialog() {
        try {
            let browsePanel = new BrowsePanel();
            let createIssueDialog = new CreateIssueDialog();
            let issueListDialog = new IssueListDialog();
            await browsePanel.clickOnShowIssuesListButton();
            await issueListDialog.waitForDialogOpened();
            await issueListDialog.clickOnNewIssueButton();
            return await createIssueDialog.waitForDialogLoaded();
        } catch (err) {
            throw new Error("Error when opening 'Create Issue Dialog' " + err);
        }
    },
    async createPublishRequest(text) {
        try {
            let browsePanel = new BrowsePanel();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            await browsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            await createRequestPublishDialog.waitForDialogLoaded();
            await createRequestPublishDialog.pause(300);
            await createRequestPublishDialog.clickOnNextButton();
            await createRequestPublishDialog.typeInChangesInput(text);
            return await createRequestPublishDialog.clickOnCreateRequestButton();
        } catch (err) {
            throw new Error("Error when create 'Publish Request' " + err);
        }
    },
    async openPublishMenuAndClickOnCreateIssue() {
        let browsePanel = new BrowsePanel();
        let createIssueDialog = new CreateIssueDialog();
        await browsePanel.openPublishMenuAndClickOnCreateIssue();
        return await createIssueDialog.waitForDialogLoaded();
    },
    async openBrowseDetailsPanel() {
        let browsePanel = new BrowsePanel();
        let browseContextWindow = new BrowseContextWindowPanel();
        let result = await browseContextWindow.isPanelVisible();
        if (!result) {
            await browsePanel.clickOnDetailsPanelToggleButton();
        }
        await browseContextWindow.waitForLoaded();
        await browsePanel.waitForSpinnerNotVisible(appConst.TIMEOUT_5);
        return await browsePanel.pause(1000);
    },
    async openContentWizard(contentType) {
        let browsePanel = new BrowsePanel();
        let newContentDialog = new NewContentDialog();
        let contentWizardPanel = new ContentWizardPanel();
        await browsePanel.waitForNewButtonEnabled(appConst.mediumTimeout);
        await browsePanel.clickOnNewButton();
        await newContentDialog.waitForOpened();
        await newContentDialog.typeSearchText(contentType);
        await newContentDialog.clickOnContentType(contentType);
        //Switch to the new wizard:
        await this.doSwitchToNewWizard();
        await contentWizardPanel.waitForOpened();
        return await contentWizardPanel.waitForDisplayNameInputFocused();
    },
    async selectAndOpenContentInWizard(contentName, checkFocused) {
        let contentWizardPanel = new ContentWizardPanel();
        let browsePanel = new BrowsePanel();
        await this.findAndSelectItem(contentName);
        await browsePanel.clickOnEditButton();
        await this.switchToContentTabWindow(contentName);
        await contentWizardPanel.waitForOpened();
        let waitForFocused = checkFocused === undefined ? true : checkFocused;
        if (waitForFocused) {
            await contentWizardPanel.waitForDisplayNameInputFocused();
        }
        return contentWizardPanel;
    },

    async openContentAndSwitchToTabByDisplayName(contentName, contentDisplayName, checkFocused) {
        let contentWizardPanel = new ContentWizardPanel();
        let browsePanel = new BrowsePanel();
        await this.findAndSelectItem(contentName);
        await browsePanel.clickOnEditButton();
        await this.switchToContentTabWindow(contentDisplayName);
        await contentWizardPanel.waitForOpened();
        let waitForFocused = checkFocused === undefined ? true : checkFocused;
        if (waitForFocused) {
            await contentWizardPanel.waitForDisplayNameInputFocused();
        }
        return contentWizardPanel;
    },

    async selectByDisplayNameAndOpenContent(displayName, checkFocused) {
        let contentWizardPanel = new ContentWizardPanel();
        let browsePanel = new BrowsePanel();
        await this.findAndSelectItemByDisplayName(displayName);
        await browsePanel.clickOnEditButton();
        await this.switchToContentTabWindow(displayName);
        await contentWizardPanel.waitForOpened();
        //timeout = ms === undefined ? appConst.longTimeout : ms;
        let waitForFocused = checkFocused === undefined ? true : checkFocused;
        if (waitForFocused) {
            await contentWizardPanel.waitForDisplayNameInputFocused();
        }
        return contentWizardPanel;
    },
    async selectContentAndClickOnLocalize(contentName) {
        let contentWizardPanel = new ContentWizardPanel();
        let browsePanel = new BrowsePanel();
        await this.findAndSelectItem(contentName);
        await browsePanel.waitForSpinnerNotVisible(appConst.mediumTimeout);
        await browsePanel.clickOnLocalizeButton();
        await this.doSwitchToNewWizard();
        await contentWizardPanel.waitForOpened();
        await contentWizardPanel.waitForDisplayNameInputFocused();
        return contentWizardPanel;
    },

    async doAddShortcut(shortcut) {
        let contentWizardPanel = new ContentWizardPanel();
        //Open new shortcut-wizard:
        await this.openContentWizard(appConst.contentTypes.SHORTCUT);
        await contentWizardPanel.typeData(shortcut);
        await contentWizardPanel.waitAndClickOnSave();
        return await this.doCloseWizardAndSwitchToGrid();
    },
    async doAddPublishedShortcut(shortcut) {
        let contentWizardPanel = new ContentWizardPanel();
        // Open new shortcut-wizard:
        await this.openContentWizard(appConst.contentTypes.SHORTCUT);
        await contentWizardPanel.typeData(shortcut);
        await contentWizardPanel.clickOnMarkAsReadyButton();
        let contentPublishDialog = new ContentPublishDialog();
        await contentPublishDialog.waitForDialogOpened();
        await contentPublishDialog.clickOnPublishNowButton();
        await contentPublishDialog.waitForDialogClosed();
        await contentWizardPanel.waitForNotificationMessage();
        return await this.doCloseWizardAndSwitchToGrid();
    },
    async doAddReadyFolder(folder) {
        let contentWizardPanel = new ContentWizardPanel();
        await this.openContentWizard(appConst.contentTypes.FOLDER);
        await contentWizardPanel.typeData(folder);
        await contentWizardPanel.clickOnMarkAsReadyButton();
        await this.doCloseWizardAndSwitchToGrid();
        return await this.getBrowser().pause(1000);
    },
    async doAddPublishedFolder(folder) {
        let contentWizardPanel = new ContentWizardPanel();
        await this.openContentWizard(appConst.contentTypes.FOLDER);
        await contentWizardPanel.typeData(folder);
        await contentWizardPanel.clickOnMarkAsReadyButton();
        let contentPublishDialog = new ContentPublishDialog();
        await contentPublishDialog.waitForDialogOpened();
        await contentPublishDialog.clickOnPublishNowButton();
        await contentPublishDialog.waitForDialogClosed();
        await contentWizardPanel.waitForNotificationMessage();
        await this.doCloseWizardAndSwitchToGrid();
        return await this.getBrowser().pause(1000);
    },
    async doAddFolder(folder) {
        let contentWizardPanel = new ContentWizardPanel();
        // 1. Open the folder-wizard:
        await this.openContentWizard(appConst.contentTypes.FOLDER);
        await contentWizardPanel.typeData(folder);
        // 2. Save the folder:
        await contentWizardPanel.waitAndClickOnSave();
        // 3.Close the wizard:
        await this.doCloseWizardAndSwitchToGrid();
        return await this.getBrowser().pause(1000);
    },
    async doCloseWizardAndSwitchToGrid() {
        await this.doCloseCurrentBrowserTab();
        return await this.doSwitchToContentBrowsePanel();
    },
    async doCloseWizardAndSwitchContentStudioTab() {
        await this.doCloseCurrentBrowserTab();
        let browsePanel = new BrowsePanel();
        await this.switchToTab(appConst.BROWSER_XP_TITLES.CONTENT_STUDIO);
        await browsePanel.pause(400);
    },
    async doAddSite(site, noControllers) {
        let contentWizardPanel = new ContentWizardPanel();
        let pageInspectionPanel = new PageInspectionPanel();
        // 1. Open new site-wizard:
        await this.openContentWizard(appConst.contentTypes.SITE);
        await contentWizardPanel.typeData(site);
        // 2. Type the data and save:
        if (site.data.controller) {
            let wizardContextWindow = await contentWizardPanel.openContextWindow();
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            await pageInspectionPanel.selectPageTemplateOrController(site.data.controller);
        }
        if (noControllers) {
            await contentWizardPanel.waitAndClickOnSave();
        }
        await this.doCloseCurrentBrowserTab();
        await this.doSwitchToContentBrowsePanel();
        return await this.getBrowser().pause(1000);

    },
    async doAddReadySite(site) {
        let contentWizardPanel = new ContentWizardPanel();
        await this.openContentWizard(appConst.contentTypes.SITE);
        await contentWizardPanel.typeData(site);

        if (site.data.controller) {
            // TODO 8607
            await contentWizardPanel.selectPageDescriptor(site.data.controller);
        } else {
            await contentWizardPanel.clickOnMarkAsReadyButton();
        }
        await this.doCloseCurrentBrowserTab();
        await this.doSwitchToContentBrowsePanel();
        return await this.getBrowser().pause(1000);
    },
    doOpenSiteWizard() {
        return this.openContentWizard(appConst.contentTypes.SITE);
    },
    async doOpenPageTemplateWizard(siteName) {
        let browsePanel = new BrowsePanel();
        let newContentDialog = new NewContentDialog();
        let contentWizardPanel = new ContentWizardPanel();
        await this.typeNameInFilterPanel(siteName);
        await browsePanel.waitForContentDisplayed(siteName);
        await browsePanel.pause(300);
        await browsePanel.clickOnExpanderIcon(siteName);
        await browsePanel.clickCheckboxAndSelectRowByDisplayName('Templates');
        await browsePanel.clickOnNewButton();
        await newContentDialog.clickOnContentType(appConst.contentTypes.PAGE_TEMPLATE);
        await this.doSwitchToNewWizard();
        return await contentWizardPanel.waitForOpened();
    },

    async doAddPageTemplate(siteName, template) {
        let contentWizardPanel = new ContentWizardPanel();
        let liveFormPanel = new LiveFormPanel();
        await this.doOpenPageTemplateWizard(siteName);
        await contentWizardPanel.typeData(template);
        // auto-saving of template should be after selecting a controller:
        let pageInspectionPanel = new PageInspectionPanel();
        let wizardContextWindow = await contentWizardPanel.openContextWindow();
        await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
        await pageInspectionPanel.selectPageTemplateOrController(template.data.controllerDisplayName);
        await contentWizardPanel.waitForNotificationMessage();
        await this.saveScreenshot(template.displayName + '_created');
        await this.doCloseCurrentBrowserTab();
        await this.doSwitchToContentBrowsePanel();
        return await contentWizardPanel.pause(2000);
    },
    //Clicks on Publish button on the toolbar then clicks on Publish button in the dialog
    async openDialogAndPublishSelectedContent() {
        let browsePanel = new BrowsePanel();
        await browsePanel.waitForPublishButtonVisible();
        await browsePanel.clickOnPublishButton();
        await this.doPublish();
        return await browsePanel.pause(1000);
    },
    async doPublish() {
        let contentPublishDialog = new ContentPublishDialog();
        await contentPublishDialog.waitForDialogOpened();
        await contentPublishDialog.clickOnPublishNowButton();
        await contentPublishDialog.waitForDialogClosed();
    },
    async doPublishTree() {
        let browsePanel = new BrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        await browsePanel.clickOnPublishTreeButton();
        await contentPublishDialog.waitForDialogOpened();
        await contentPublishDialog.clickOnPublishNowButton();
        return await contentPublishDialog.waitForDialogClosed();
    },
    // Parent content(work in progress) should be selected, clicks on 'Publish Tree menu item', then clicks on 'Mark as ready' button:
    async doMarkAsReadyAndPublishTree() {
        let browsePanel = new BrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        await browsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
        await contentPublishDialog.waitForDialogOpened();
        // Click on 'Mark as ready; button in the modal dialog:
        await contentPublishDialog.clickOnMarkAsReadyButton();
        await contentPublishDialog.clickOnPublishNowButton();
        return await contentPublishDialog.waitForDialogClosed();
    },
    async doPublishInWizard() {
        let contentPublishDialog = new ContentPublishDialog();
        let contentWizardPanel = new ContentWizardPanel();
        // 1. Open Publish Content Dialog:
        await contentWizardPanel.clickOnPublishButton();
        await contentPublishDialog.waitForDialogOpened();
        //2. Click on Publish Now button:
        await contentPublishDialog.clickOnPublishNowButton();
        return await contentPublishDialog.waitForDialogClosed();
    },
    async doUnPublishInWizard() {
        let contentUnpublishDialog = new ContentUnpublishDialog();
        let contentWizardPanel = new ContentWizardPanel();
        // 1. Click on Unpublish menu item:
        await contentWizardPanel.clickOnUnpublishMenuItem();
        await contentUnpublishDialog.waitForDialogOpened();
        // 2. Click on Unpublish button:
        await contentUnpublishDialog.clickOnUnpublishButton();
        return await contentUnpublishDialog.waitForDialogClosed();
    },
    async doAddArticleContent(siteName, article) {
        let contentWizardPanel = new ContentWizardPanel();
        // 1. Select the site
        await this.findAndSelectItem(siteName);
        // 2. Open article-wizard:
        await this.openContentWizard(article.contentType);
        // 3.Type the data and save all
        await contentWizardPanel.typeData(article);
        await contentWizardPanel.waitAndClickOnSave();
        await this.doCloseCurrentBrowserTab();
        await this.doSwitchToContentBrowsePanel();
        return await this.getBrowser().pause(500);
    },
    async findAndSelectItem(name) {
        try {
            let browsePanel = new BrowsePanel();
            await this.typeNameInFilterPanel(name);
            await browsePanel.waitForRowByNameVisible(name);
            await browsePanel.clickOnRowByName(name);
            await browsePanel.waitForSpinnerNotVisible(appConst.longTimeout);
            return await browsePanel.pause(200);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_select_item');
            throw new Error(`Select the item in grid, screenshot:${screenshot} ` + err);
        }
    },
    async saveScreenshotUniqueName(namePart) {
        let screenshotName = appConst.generateRandomName(namePart);
        await this.saveScreenshot(screenshotName);
        return screenshotName;
    },
    async findAndSelectItemByDisplayName(displayName) {
        try {
            let browsePanel = new BrowsePanel();
            await this.typeNameInFilterPanel(displayName);
            await browsePanel.waitForContentByDisplayNameVisible(displayName);
            await browsePanel.pause(200);
            await browsePanel.clickOnRowByDisplayName(displayName);
            await browsePanel.waitForSpinnerNotVisible(appConst.longTimeout);
            return await browsePanel.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_select_item');
            throw new Error(`Select the item in grid, screenshot:${screenshot} ` + err);
        }
    },

    // find the content, select it and click 'Delete' menu item in the modal dialog
    async doDeleteContent(name) {
        let browsePanel = new BrowsePanel();
        let deleteContentDialog = new DeleteContentDialog();
        await this.findAndSelectItem(name);
        // Open modal dialog:
        await browsePanel.clickOnArchiveButton();
        await deleteContentDialog.waitForDialogOpened();
        // Click on 'Delete' menu item in the modal dialog:
        await deleteContentDialog.clickOnDeleteMenuItem();
        return await deleteContentDialog.waitForDialogClosed();
    },
    async doDeleteContentByDisplayName(displayName) {
        let browsePanel = new BrowsePanel();
        let deleteContentDialog = new DeleteContentDialog();
        await this.findAndSelectItemByDisplayName(displayName);
        // Open modal dialog:
        await browsePanel.clickOnArchiveButton();
        await deleteContentDialog.waitForDialogOpened();
        // Click on 'Delete' menu item in the modal dialog:
        await deleteContentDialog.clickOnDeleteMenuItem();
        return await deleteContentDialog.waitForDialogClosed();
    },
    async selectContentAndOpenWizard(name) {
        await this.findAndSelectItem(name);
        return await this.doClickOnEditAndOpenContent(name);
    },
    async doClickOnEditAndOpenContent(displayName) {
        let browsePanel = new BrowsePanel();
        let contentWizardPanel = new ContentWizardPanel();
        await browsePanel.waitForEditButtonEnabled();
        await browsePanel.clickOnEditButton();
        //switch to the opened wizard:
        await this.switchToContentTabWindow(displayName);
        await contentWizardPanel.waitForOpened();
        await contentWizardPanel.waitForDisplayNameInputFocused();
        await contentWizardPanel.pause(100);
    },
    async findContentAndClickCheckBox(displayName) {
        let browsePanel = new BrowsePanel();
        await this.typeNameInFilterPanel(displayName);
        await browsePanel.waitForContentByDisplayNameVisible(displayName);
        return await browsePanel.clickCheckboxAndSelectRowByDisplayName(displayName);
    },
    async selectSiteAndOpenNewWizard(siteName, contentType) {
        let browsePanel = new BrowsePanel();
        let newContentDialog = new NewContentDialog();
        await this.findAndSelectItem(siteName);
        await browsePanel.waitForNewButtonEnabled();
        await browsePanel.clickOnNewButton();
        await newContentDialog.waitForOpened();
        return await this.clickOnItemInNewContentDialog(contentType);
    },
    async clickOnItemInNewContentDialog(contentType) {
        let newContentDialog = new NewContentDialog();
        let contentWizard = new ContentWizardPanel();
        await newContentDialog.waitForOpened();
        await newContentDialog.typeSearchText(contentType);
        await newContentDialog.clickOnContentType(contentType);
        await this.doSwitchToNewWizard();
        await contentWizard.waitForOpened();
        await contentWizard.waitForDisplayNameInputFocused();
        return contentWizard;
    },
    // Open delete dialog, click on 'Delete' button then type a number to delete
    async doDeleteNowAndConfirm(numberOfContents) {
        let browsePanel = new BrowsePanel();
        let deleteContentDialog = new DeleteContentDialog();
        let confirmValueDialog = new ConfirmValueDialog();
        //1. Open Delete Content dialog:
        await browsePanel.clickOnArchiveButton();
        await deleteContentDialog.waitForDialogOpened();
        //2. Click on Delete button
        await deleteContentDialog.clickOnDeleteMenuItem();
        //3. wait for Confirm dialog is loaded:
        await confirmValueDialog.waitForDialogOpened();
        //4. Type required number:
        await confirmValueDialog.typeNumberOrName(numberOfContents);
        //Click on Confirm button:
        await confirmValueDialog.clickOnConfirmButton();
        return await deleteContentDialog.waitForDialogClosed();
    },
    async typeNameInFilterPanel(name) {
        try {
            let browsePanel = new BrowsePanel();
            let filterPanel = new FilterPanel();
            let result = await filterPanel.isPanelVisible();
            if (!result) {
                await browsePanel.clickOnSearchButton();
                await filterPanel.waitForOpened();
            }
            await filterPanel.typeSearchText(name);
            await browsePanel.waitForSpinnerNotVisible(appConst.longTimeout);
            return await browsePanel.pause(300);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_filter_panel');
            throw new Error('Filter Panel-  error : ' + err);
        }
    },

    async openFilterPanel() {
        try {
            let browsePanel = new BrowsePanel();
            let filterPanel = new FilterPanel();
            await browsePanel.clickOnSearchButton();
            return await filterPanel.waitForOpened();
        } catch (err) {
            throw new Error('Error when opening Filter Panel! ' + err);
        }
    },

    async openProjectSelectionDialogAndSelectContext(context) {
        try {
            let browsePanel = new BrowsePanel();
            return await browsePanel.selectContext(context);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_select_context');
            throw new Error(`Error occurred while selecting the context, screenshot: ${screenshot}` + err);
        }
    },

    async doLogout() {
        let launcherPanel = new LauncherPanel();
        let loginPage = new LoginPage();
        let isDisplayed = await launcherPanel.isPanelOpened();
        if (isDisplayed) {
            await launcherPanel.clickOnLogoutLink();
        }
        return await loginPage.waitForPageLoaded();
    },
    async navigateToContentStudioApp(userName, password) {
        try {
            await this.clickOnContentStudioLink(userName, password);
            await this.doSwitchToContentBrowsePanelAndSelectDefaultContext();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_navigate_cs');
            throw new Error(`Error occurred after clicking on Content Studio link in Launcher Panel,  screenshot:${screenshot}  ` + err);
        }
    },
    async navigateToContentStudioAppMobile(userName, password) {
        await this.navigateToContentStudioApp(userName, password);
        //close content studio menu :
        await this.closeContentStudioMenu();
    },
    async navigateToContentStudioWithProjects(userName, password) {
        try {
            await this.clickOnContentStudioLink(userName, password);
            console.log('testUtils:switching to Content Browse panel...');
            let browsePanel = new BrowsePanel();
            await this.getBrowser().switchWindow("Content Studio - Enonic XP Admin");
            return await browsePanel.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_navigate_to_studio');
            throw new Error(`Error when navigating to Content Studio, screenshot: ${screenshot} ` + err);
        }
    },
    async clickOnContentStudioLink(userName, password) {
        let launcherPanel = new LauncherPanel();
        let result = await launcherPanel.isDisplayed(1500);
        console.log('Launcher Panel is opened, click on the `Content Studio` link...');
        if (result) {
            await launcherPanel.clickOnContentStudioLink();
        } else {
            console.log('Login Page is opened, type a password and name...');
            return await this.doLoginAndClickOnContentStudio(userName, password);
        }
    },
    async navigateToContentStudioCloseProjectSelectionDialog(userName, password) {
        try {
            await this.clickOnContentStudioLink(userName, password);
            await this.switchToTab(appConst.BROWSER_XP_TITLES.CONTENT_STUDIO);
            await this.closeProjectSelectionDialog();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_navigate_to_studio');
            throw new Error(`Error when navigating to Content Studio. Screenshot: ${screenshot}` + err);
        }
    },
    // Clicks on Cancel button and switches to Default project
    async closeProjectSelectionDialog() {
        let projectSelectionDialog = new ProjectSelectionDialog();
        let isLoaded = await projectSelectionDialog.isDialogLoaded();
        if (isLoaded) {
            await projectSelectionDialog.pause(200);
            await projectSelectionDialog.clickOnCloseButton();
            await projectSelectionDialog.waitForDialogClosed();
            return await this.getBrowser().pause(200);
        }
    },
    async doLoginAndClickOnContentStudio(userName, password) {
        let loginPage = new LoginPage();
        await loginPage.doLogin(userName, password);
        let launcherPanel = new LauncherPanel();
        return await launcherPanel.clickOnContentStudioLink();

    },
    async doSwitchToContentBrowsePanel() {
        try {
            let browsePanel = new BrowsePanel();
            await this.switchToTab(appConst.BROWSER_XP_TITLES.CONTENT_STUDIO);
            console.log('switched to content browse panel...');
            await browsePanel.waitForGridLoaded(appConst.longTimeout);
            return browsePanel;
        } catch (err) {
            throw new Error('Error when switching to Content Studio App ' + err);
        }
    },
    async switchToTab(title) {
        let handles = await this.getBrowser().getWindowHandles();
        for (const handle of handles) {
            await this.getBrowser().switchToWindow(handle);
            let currentTitle = await this.getBrowser().getTitle();
            if (currentTitle === title) {
                return handle;
            }
        }
        throw new Error('Browser tab with title ' + title + ' was not found');
    },
    async switchToTabContains(text) {
        let handles = await this.getBrowser().getWindowHandles();
        for (const handle of handles) {
            await this.getBrowser().switchToWindow(handle);
            let currentTitle = await this.getBrowser().getTitle();
            if (currentTitle.includes(text)) {
                return handle;
            }
        }
        throw new Error('Browser tab with title ' + text + ' was not found');
    },
    async doSwitchToContentBrowsePanelAndSelectDefaultContext() {
        try {
            let projectSelectionDialog = new ProjectSelectionDialog();
            let browsePanel = new BrowsePanel();
            await this.switchToTab(appConst.BROWSER_XP_TITLES.CONTENT_STUDIO);
            console.log('switched to content browse panel...');
            let isLoaded = await projectSelectionDialog.isDialogLoaded();
            if (isLoaded) {
                await projectSelectionDialog.selectContext('Default');

                await projectSelectionDialog.waitForDialogClosed();
                return await this.getBrowser().pause(200);
            }
            await browsePanel.waitForGridLoaded(appConst.longTimeout);
            return browsePanel;
        } catch (err) {
            throw new Error('Error when navigating to Content Studio(selecting Default context)' + err);
        }
    },
    async doSwitchToHome() {
        console.log('testUtils:switching to Home page...');
        let homePage = new HomePage();
        await this.switchToTab(appConst.BROWSER_XP_TITLES.XP_HOME);
        return await homePage.waitForLoaded(appConst.mediumTimeout);

    },
    async doCloseWindowTabAndSwitchToBrowsePanel() {
        await this.getBrowser().closeWindow();
        return await this.doSwitchToContentBrowsePanel();
    },

    async saveAndCloseWizard() {
        let contentWizardPanel = new ContentWizardPanel();
        await contentWizardPanel.waitAndClickOnSave();
        await contentWizardPanel.pause(300);
        return await this.doCloseWindowTabAndSwitchToBrowsePanel();
    },

    async switchToContentTabWindow(contentDisplayName) {
        try {
            await this.switchToTabContains(contentDisplayName);
            let contentWizardPanel = new ContentWizardPanel();
            return await contentWizardPanel.waitForSpinnerNotVisible();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_switch_window');
            await this.getBrowser().pause(1000);
            await this.getBrowser().switchWindow(contentDisplayName);
        }
    },
    async doPressBackspace() {
        await this.getBrowser().keys('\uE003');
        return await this.getBrowser().pause(200);
    },
    doPressTabKey() {
        return this.getBrowser().keys('Tab');
    },
    doPressEnter() {
        return this.getBrowser().keys('Enter');
    },

    async doSwitchToNewWizard() {
        try {
            let contentWizardPanel = new ContentWizardPanel();
            await this.doSwitchToNewTab();
            return await contentWizardPanel.waitForOpened();
        } catch (err) {
            throw new Error('Error when switching to the new wizard tab ' + err);
        }
    },
    async doSwitchToNewTab() {
        try {
            console.log('testUtils:switching to the new wizard tab...');
            let tabs = await this.getBrowser().getWindowHandles();
            await this.getBrowser().switchToWindow(tabs[tabs.length - 1]);
        } catch (err) {
            throw new Error('Error when switching to the new browser tab ' + err);
        }
    },

    async doSwitchToTabByIndex(index) {
        try {
            let tabs = await this.getBrowser().getWindowHandles();
            await this.getBrowser().switchToWindow(tabs[index]);
        } catch (err) {
            throw new Error('Error occurred during switching to the new browser tab ' + err);
        }
    },
    async doSwitchToNextTab() {
        let tabs = await this.getBrowser().getWindowHandles();
        return await this.getBrowser().switchToWindow(tabs[tabs.length - 1]);
    },
    async doSwitchToPrevTab() {
        try {
            let tabs = await this.getBrowser().getWindowHandles();
            return await this.getBrowser().switchToWindow(tabs[tabs.length - 2]);
        } catch (err) {
            throw new Error('Error occurred while switching to the new browser tab' + err);
        }
    },
    async doCloseWindowTabByTitle(title) {
        try {
            let arrayId = await this.getBrowser().getWindowHandles();
            for (const item of arrayId) {
                let result = await this.switchAndCheckTitle(item, title);
                if (result) {
                    await this.getBrowser().closeWindow();
                }
            }
            await this.doSwitchToHome();
        } catch (err) {
            throw new Error('Error occurred during switching to the new browser tab ' + err);
        }
    },
    async doCloseAllWindowTabsAndSwitchToHome() {
        let handles = await this.getBrowser().getWindowHandles();
        for (const item of handles) {
            let result = await this.switchAndCheckTitle(item, "Enonic XP Home");
            if (!result) {
                await this.getBrowser().closeWindow();
            }
        }
        return this.doSwitchToHome();
    },
    async switchAndCheckTitle(handle, reqTitle) {
        try {
            await this.getBrowser().switchToWindow(handle);
            let title = await this.getBrowser().getTitle();
            return title.includes(reqTitle);
        } catch (err) {
            console.log('Error occurred during  checking the  title' + err);
            throw new Error("Error  " + err);
        }
    },
    async saveScreenshot(name, that) {
        try {
            let screenshotsDir = path.join(__dirname, '/../build/reports/screenshots/');
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir, {recursive: true});
            }
            await this.getBrowser().saveScreenshot(screenshotsDir + name + '.png');
            console.log('screenshot is saved ' + name);
        } catch (err) {
            return console.log('screenshot was not saved ' + err);
        }
    },
    async openDependencyWidgetInBrowsePanel() {
        let browsePanel = new BrowsePanel();
        let browseDependenciesWidget = new BrowseDependenciesWidget();
        let browseContextWindow = new BrowseContextWindowPanel();
        await browsePanel.openContextWindow();
        await browseContextWindow.openDependenciesWidget();
        return await browseDependenciesWidget.waitForWidgetLoaded();
    },
    isStringEmpty(str) {
        return (!str || 0 === str.length);
    },
    sendRequestGetHeaders() {
        return this.getBrowser().executeAsync(
            'var callback = arguments[arguments.length - 1];' +
            'var xhr = new XMLHttpRequest();' +
            "xhr.open('GET', '', true);" +
            "xhr.onreadystatechange = function() {" +
            '  if (xhr.readyState == 4) {' +
            '    callback(xhr.getAllResponseHeaders());' +
            '  }' +
            '};' +
            'xhr.send();');
    },
    async openContentStudioMenu() {
        let result = await this.isContentStudioMenuOpened();
        if (!result) {
            await this.waitForElementDisplayed(lib.APP_MODE_SWITCHER_TOGGLER);
            await this.clickOnElement(lib.APP_MODE_SWITCHER_TOGGLER);
            return await this.getBrowser().pause(200);
        }
    },
    async closeContentStudioMenu() {
        let result = await this.isContentStudioMenuOpened();
        if (result) {
            await this.waitForElementDisplayed(lib.APP_MODE_SWITCHER_TOGGLER);
            await this.clickOnElement(lib.APP_MODE_SWITCHER_TOGGLER);
            return await this.getBrowser().pause(200);
        }
    },
    async isContentStudioMenuOpened() {
        let element = await this.getBrowser().$("//div[contains(@id,'AppWrapper')]");
        let atrValue = await element.getAttribute("class");
        return atrValue.includes('sidebar-expanded');
    },
    async openSettingsPanel() {
        try {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            await this.openContentStudioMenu();
            await this.waitForElementDisplayed(lib.WIDGET_SIDEBAR.SETTINGS_BUTTON, appConst.mediumTimeout);
            await this.clickOnElement(lib.WIDGET_SIDEBAR.SETTINGS_BUTTON);
            await this.getBrowser().pause(300);
            await settingsBrowsePanel.waitForGridLoaded(appConst.mediumTimeout);
            return settingsBrowsePanel;
        } catch (err) {
            await this.saveScreenshotUniqueName('err_open_settings');
            throw new Error('Settings Panel was not opened: ' + err);
        }
    },
    async switchToContentMode() {
        await this.clickOnElement(lib.WIDGET_SIDEBAR.MODE_CONTENT_BUTTON);
        await this.getBrowser().pause(200);
        return new ContentBrowsePanel();
    },
    generateRandomName(part) {
        return part + Math.round(Math.random() * 1000000);
    },
    async navigateToUsersApp(userName, password) {
        try {
            let launcherPanel = new LauncherPanel();
            let isDisplayed = await launcherPanel.isDisplayed(appConst.mediumTimeout);
            if (isDisplayed) {
                console.log('Launcher Panel is opened, click on the `Users` link...');
                await launcherPanel.pause(300);
                await launcherPanel.clickOnUsersLink();
            } else {
                console.log('Login Page is opened, type a password and name...');
                await this.doLoginAndClickOnUsersLink(userName, password);
            }
            await this.doSwitchToUsersApp();
        } catch (err) {
            await this.saveScreenshotUniqueName('err_navigate_to_users');
            throw new Error('error when navigate to Users app ' + err);
        }
    },
    async navigateToApplications(userName, password) {
        try {
            let launcherPanel = new LauncherPanel();
            let isDisplayed = await launcherPanel.isDisplayed(appConst.mediumTimeout);
            if (isDisplayed) {
                console.log('Launcher Panel is opened, click on the `Users` link...');
                await launcherPanel.pause(300);
                await launcherPanel.clickOnApplicationsLink();
            } else {
                console.log('Login Page is opened, type a password and name...');
                let loginPage = new LoginPage();
                await loginPage.doLogin(userName, password);
                await launcherPanel.clickOnApplicationsLink();
            }
            await this.doSwitchToApplicationsBrowsePanel();
        } catch (err) {
            await this.saveScreenshotUniqueName('err_navigate_to_users');
            throw new Error('error when navigate to Applications app ' + err);
        }
    },
    async doLoginAndClickOnUsersLink(userName, password) {
        let loginPage = new LoginPage();
        await loginPage.doLogin(userName, password);
        let launcherPanel = new LauncherPanel();
        await launcherPanel.pause(700);
        await launcherPanel.clickOnUsersLink();
        return await loginPage.pause(1000);
    },
    async doSwitchToUsersApp() {
        try {
            console.log('testUtils:switching to users app...');
            let browsePanel = new UserBrowsePanel();
            await this.getBrowser().switchWindow('Users - Enonic XP Admin');
            console.log('switched to Users app...');
            await browsePanel.waitForSpinnerNotVisible();
            return browsePanel.waitForUsersGridLoaded(appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_switch_to_users_app');
            throw new Error(`Error during switching to Users App , screenshot:${screenshot} ` + err);
        }
    },
    async addSystemUser(userData) {
        let userWizard = new UserWizard();
        // 1. Select System ID Provider folder:
        await this.clickOnSystemOpenUserWizard();
        // 2. Type the data:
        await userWizard.typeData(userData);
        await userWizard.clickOnRolesAndGroupsLink()
        await this.saveScreenshot(appConst.generateRandomName('user'));
        // 3. Save the data and close the wizard:
        return await this.saveAndCloseUserWizard(userData.displayName);
    },
    async selectAndDeleteUserItem(name) {
        let userBrowsePanel = new UserBrowsePanel();
        let confirmationDialog = new ConfirmationDialog();
        await this.findAndSelectUserItem(name);
        await userBrowsePanel.waitForDeleteButtonEnabled();
        await userBrowsePanel.clickOnDeleteButton();
        await confirmationDialog.waitForDialogOpened();
        await confirmationDialog.clickOnYesButton();
        return await userBrowsePanel.waitForSpinnerNotVisible();
    },
    async typeNameInUserFilterPanel(name) {
        let browsePanel = new UserBrowsePanel();
        let filterPanel = new PrincipalFilterPanel();
        await browsePanel.clickOnSearchButton();
        await filterPanel.waitForOpened();
        await filterPanel.typeSearchText(name);
        await browsePanel.pause(300);
        return await browsePanel.waitForSpinnerNotVisible();
    },
    async findAndSelectUserItem(name) {
        let userBrowsePanel = new UserBrowsePanel();
        await this.typeNameInUserFilterPanel(name);
        await userBrowsePanel.pause(400);
        await userBrowsePanel.waitForRowByNameVisible(name);
        await userBrowsePanel.clickOnRowByName(name);
        return await userBrowsePanel.pause(300);
    },
    // Click on 'Save' button and close the wizard:
    async saveAndCloseUserWizard(displayName) {
        let wizardPanel = new UserWizard();
        let browsePanel = new UserBrowsePanel();
        await wizardPanel.waitAndClickOnSave();
        //await wizardPanel.waitForNotificationMessage();
        await wizardPanel.pause(2000);
        //Click on Close icon and close the wizard:
        return await browsePanel.closeTabAndWaitForGrid(displayName);
    },
    async clickOnSystemOpenUserWizard() {
        let browsePanel = new UserBrowsePanel();
        let userWizard = new UserWizard();
        let newPrincipalDialog = new NewPrincipalDialog();
        await browsePanel.clickOnRowByName('system');
        await browsePanel.waitForNewButtonEnabled();
        await browsePanel.clickOnNewButton();
        await newPrincipalDialog.waitForDialogLoaded();
        await newPrincipalDialog.clickOnItem('User');
        return await userWizard.waitForOpened();
    },
    async typeNameInUsersFilterPanel(name) {
        let browsePanel = new UserBrowsePanel();
        let principalFilterPanel = new PrincipalFilterPanel();
        await browsePanel.clickOnSearchButton();
        await principalFilterPanel.waitForOpened();
        await principalFilterPanel.typeSearchText(name);
        await browsePanel.pause(700);
        return await browsePanel.waitForSpinnerNotVisible();
    },
    async showLauncherPanel() {
        let launcherPanel = new LauncherPanel();
        let selector = "//button[contains(@class,'launcher-button')]";
        try {
            await this.getBrowser().pause(100);
            await this.clickOnElement(selector);
            return await launcherPanel.waitForPanelDisplayed();
        } catch (err) {
            await this.handleError('Launcher Panel should be loaded!', 'err_launcher_panel', err);
        }

    },
    async getDisplayedElements(selector) {
        let elements = await this.getBrowser().$$(selector);
        if (elements.length === 0) {
            return [];
        }
        let pr = elements.map(el => el.isDisplayed());
        return await Promise.all(pr).then(result => {
            return elements.filter((el, i) => result[i]);
        });
    },
    waitUntilDisplayed(selector, ms) {
        return this.getBrowser().waitUntil(() => {
            return this.getDisplayedElements(selector).then(result => {
                return result.length > 0;
            })
        }, {timeout: ms, timeoutMsg: 'Timeout exception. Element ' + selector + ' still not visible in: ' + ms});
    },
    async scheduleContent(contentName, date) {
        let contentBrowsePanel = new ContentBrowsePanel();
        let dateTimeRange = new DateTimeRange("//div[contains(@id,'ContentPublishDialog')]");
        await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
        let contentPublishDialog = new ContentPublishDialog();
        await contentPublishDialog.clickOnAddScheduleIcon();
        await dateTimeRange.typeOnlineFrom(date);
        await contentPublishDialog.clickOnScheduleButton();
        return await contentPublishDialog.waitForDialogClosed();
    },
    async openWizardDependencyWidget() {
        let contentWizard = new ContentWizardPanel();
        let wizardDependenciesWidget = new WizardDependenciesWidget();
        let wizardContextWindow = new WizardContextPanel();
        await contentWizard.openContextWindow();
        await wizardContextWindow.openDependenciesWidget();
        await wizardDependenciesWidget.waitForWidgetLoaded();
        return wizardDependenciesWidget;
    },
    async openResourceInDraft(res) {
        let currentUrl = await this.getBrowser().getUrl();
        let base = currentUrl.substring(0, currentUrl.indexOf('admin'));
        let url = base + 'admin/site/preview/default/draft/' + res;
        await this.loadUrl(url);
        return await this.getBrowser().pause(2000);
    },
    async loadServiceURL(serviceName, appName) {
        let currentUrl = await this.getBrowser().getUrl();
        let base = currentUrl.substring(0, currentUrl.indexOf('admin'));
        let url = base + `/site/default/draft/_/service/${appName}/${serviceName}`;
        await this.loadUrl(url);
        return await this.getBrowser().pause(2000);
    },
    async openResourceInMaster(res) {
        let currentUrl = await this.getBrowser().getUrl();
        let base = currentUrl.substring(0, currentUrl.indexOf('admin'));
        let url = base + 'admin/site/preview/default/master/' + res;
        await this.loadUrl(url);
        return await this.getBrowser().pause(2000);
    },
    loadUrl(url) {
        return this.getBrowser().url(url);
    },
    async getIdOfHtmlAreas() {
        let selector = lib.FORM_VIEW + lib.TEXT_AREA;
        let elems = await this.getBrowser().$$(selector);
        let ids = [];
        for (const item of elems) {
            ids.push(await item.getAttribute('id'));
        }
        return ids;
    },
    async openEditSettingDialog() {
        let propertiesWidgetItem = new PropertiesWidgetItem();
        let editSettingsDialog = new EditSettingDialog();
        // 3. Click on Edit Settings :
        await propertiesWidgetItem.clickOnEditSettingsButton();
        await editSettingsDialog.waitForLoaded();
        return editSettingsDialog;
    },
    async doSwitchToApplicationsBrowsePanel() {
        let appBrowsePanel = new AppBrowsePanel();
        console.log('testUtils:switching to Applications app...');
        await this.getBrowser().switchWindow(appConst.BROWSER_XP_TITLES.APPLICATIONS_TITLE);
        console.log('switched to Applications app...');
        await appBrowsePanel.waitForSpinnerNotVisible();
        return await appBrowsePanel.waitForGridLoaded(appConst.mediumTimeout);
    },
    async saveScreen(name) {
        await this.getBrowser().saveScreen();
    }
};
