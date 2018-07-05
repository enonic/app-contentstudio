/**
 * Created on 12/2/2017.
 */
const launcherPanel = require('../page_objects/launcher.panel');
const homePage = require('../page_objects/home.page');
const loginPage = require('../page_objects/login.page');
const browsePanel = require('../page_objects/browsepanel/content.browse.panel');
const wizard = require('../page_objects/wizardpanel/content.wizard.panel');
const filterPanel = require("../page_objects/browsepanel/content.filter.panel");
const confirmationDialog = require("../page_objects/confirmation.dialog");
const appConst = require("./app_const");
const newContentDialog = require('../page_objects/browsepanel/new.content.dialog');
const contentWizardPanel = require('../page_objects/wizardpanel/content.wizard.panel');
const webDriverHelper = require("./WebDriverHelper");
const issueListDialog = require('../page_objects/issue/issue.list.dialog');
const createIssueDialog = require('../page_objects/issue/create.issue.dialog');
const deleteContentDialog = require('../page_objects/delete.content.dialog');
const confirmContentDeleteDialog = require('../page_objects/confirm.content.delete.dialog');
const insertLinkDialog = require('../page_objects/wizardpanel/insert.link.modal.dialog.cke');
const contentPublishDialog = require('../page_objects/content.publish.dialog');
const contentDetailsPanel = require('../page_objects/browsepanel/detailspanel/details.panel');

module.exports = {
    xpTabs: {},
    setTextInCKE: function (id, text) {
        let script = `CKEDITOR.instances['${id}'].setData('${text}')`;
        return webDriverHelper.browser.execute(script).then(() => {
            let script2 = `CKEDITOR.instances['${id}'].fire('change')`;
            return webDriverHelper.browser.execute(script2);
        })
    },
    clickOnElement: function (selector) {
        return webDriverHelper.browser.click(selector).then(() => {
            console.log('clicked on ' + selector);
        })
    },
    isElementDisplayed: function (selector) {
        return webDriverHelper.browser.isVisible(selector).catch((err) => {
            console.log('Error, when checking the element ' + selector + '  ' + err);
        })
    },
    switchToFrameBySrc: function (src) {
        let selector = `//iframe[contains(@src,'${src}')]`;
        return webDriverHelper.browser.element(selector).then(result => {
            console.log('############## ' + result.value);
            return webDriverHelper.browser.frame(result.value);
        });
    },
    getTitle: function () {
        return webDriverHelper.browser.getTitle();
    },

    getTextInCKE: function (id) {
        let script = `return CKEDITOR.instances['${id}'].getData()`;
        return webDriverHelper.browser.execute(script);
    },
    insertUrlLinkInCke: function (text, url) {
        return insertLinkDialog.typeText(text).then(() => {
            return insertLinkDialog.typeUrl(url);
        }).then(() => {
            return insertLinkDialog.clickOnInsertButton();
        }).pause(700);

    },
    insertDownloadLinkInCke: function (text, contentDisplayName) {
        return insertLinkDialog.typeText(text).then(() => {
            return insertLinkDialog.selectTargetInDownloadTab(contentDisplayName);
        }).then(() => {
            this.saveScreenshot('download_link_dialog');
            return insertLinkDialog.clickOnInsertButton();
        }).pause(700);

    },
    insertEmailLinkInCke: function (text, email) {
        return insertLinkDialog.typeText(text).then(() => {
            return insertLinkDialog.fillEmailForm(email);
        }).then(() => {
            this.saveScreenshot('email_link_dialog');
            return insertLinkDialog.clickOnInsertButton();
        }).pause(700);
    },

    insertContentLinkInCke: function (text, contentDisplayName) {
        return insertLinkDialog.typeText(text).then(() => {
            return insertLinkDialog.selectTargetInContentTab(contentDisplayName);
        }).then(() => {
            this.saveScreenshot('content_link_dialog');
            return insertLinkDialog.clickOnInsertButton();
        }).pause(700);

    },
    doCloseCurrentBrowserTab: function () {
        return webDriverHelper.browser.getTitle().then(title => {
            if (title != 'Enonic XP Home') {
                return webDriverHelper.browser.close();
            }
        })
    },
    openIssuesListDialog: function () {
        return browsePanel.clickOnShowIssuesListButton().then(() => {
            return issueListDialog.waitForDialogVisible();
        })
    },
    openCreateIssueDialog: function () {
        return browsePanel.clickOnShowIssuesListButton().then(() => {
            return issueListDialog.waitForDialogVisible(500);
        }).then(() => {
            return issueListDialog.clickOnNewIssueButton();
        }).then(() => {
            return createIssueDialog.waitForDialogLoaded();
        });
    },
    openPublishMenuAndClickOnCreateIssue: function () {
        return browsePanel.openShowPublishMenuAndClickOnCreateIssue().then(() => {
            return createIssueDialog.waitForDialogLoaded();
        })
    },
    openDetailsPanel: function () {
        return contentDetailsPanel.isPanelVisible().then(result => {
            if (!result) {
                return browsePanel.clickOnDetailsPanelToggleButton();
            }
        }).then(() => {
            return contentDetailsPanel.waitForDetailsPanelLoaded();
        })
    },

    openContentWizard: function (contentType) {
        return browsePanel.waitForNewButtonEnabled(appConst.TIMEOUT_3).then(() => {
            return browsePanel.clickOnNewButton();
        }).then(() => {
            return newContentDialog.waitForOpened();
        }).then(() => {
            return newContentDialog.clickOnContentType(contentType);
        }).then(() => {
            return this.doSwitchToNewWizard();
        }).then(() => {
            return contentWizardPanel.waitForOpened();
        })
    },
    openContentInWizard: function (contentName) {
        return this.findAndSelectItem(contentName).then(() => {
            return browsePanel.clickOnEditButton();
        }).then(() => {
            return this.doSwitchToNewWizard();
        }).then(() => {
            return contentWizardPanel.waitForOpened();
        })
    },

    doAddShortcut: function (shortcut) {
        return this.openContentWizard(appConst.contentTypes.SHORTCUT).then(() => {
            return contentWizardPanel.typeData(shortcut);
        }).then(() => {
            return contentWizardPanel.waitAndClickOnSave();
        }).then(() => {
            return this.doCloseWizardAndSwitchToGrid()
        }).pause(1000);
    },
    doAddFolder: function (folder) {
        return this.openContentWizard(appConst.contentTypes.FOLDER).then(() => {
            return contentWizardPanel.typeData(folder);
        }).then(() => {
            return contentWizardPanel.waitAndClickOnSave();
        }).then(() => {
            return this.doCloseWizardAndSwitchToGrid()
        }).pause(1000);
    },
    doCloseWizardAndSwitchToGrid: function () {
        return this.doCloseCurrentBrowserTab().then(() => {
            return this.doSwitchToContentBrowsePanel();
        });
    },
    doAddSite: function (site) {
        return this.openContentWizard(appConst.contentTypes.SITE).then(() => {
            return contentWizardPanel.typeData(site);
        }).then(() => {
            return contentWizardPanel.waitAndClickOnSave();
        }).pause(1000).then(() => {
            if (site.data.controller) {
                return contentWizardPanel.selectPageDescriptor(site.data.controller);
            }
        }).then(() => {
            return this.doCloseCurrentBrowserTab();
        }).then(() => {
            return this.doSwitchToContentBrowsePanel();
        }).pause(2000);
    },
    doOpenSiteWizard: function () {
        return this.openContentWizard(appConst.contentTypes.SITE);
    },
    doOpenPageTemplateWizard: function (siteName) {
        return this.typeNameInFilterPanel(siteName).then(() => {
            return browsePanel.waitForContentDisplayed(siteName);
        }).pause(700).then(() => {
            return browsePanel.clickOnExpanderIcon(siteName);
        }).pause(700).then(() => {
            return browsePanel.clickCheckboxAndSelectRowByDisplayName('Templates');
        }).pause(500).then(() => {
            return browsePanel.clickOnNewButton();
        }).then(() => {
            return newContentDialog.clickOnContentType(appConst.contentTypes.PAGE_TEMPLATE);
        }).then(() => {
            return this.doSwitchToNewWizard();
        }).then(() => {
            return contentWizardPanel.waitForOpened();
        });
    },
    doAddPageTemplate: function (siteName, template) {
        return this.doOpenPageTemplateWizard(siteName).then(() => {
            return contentWizardPanel.typeData(template);
        }).then(() => {
            //autosaving should be here:
            return contentWizardPanel.selectPageDescriptor(template.data.controllerDisplayName);
        }).then(() => {
            this.saveScreenshot(template.displayName + '_created');
            return this.doCloseCurrentBrowserTab();
        }).then(() => {
            return this.doSwitchToContentBrowsePanel();
        }).pause(2000);
    },
    doPublish: function () {
        return browsePanel.clickOnPublishButton().then(() => {
            return contentPublishDialog.waitForDialogVisible();
        }).then(() => {
            return contentPublishDialog.clickOnPublishButton();
        }).then(() => {
            return contentPublishDialog.waitForDialogClosed();
        })
    }
    ,
    doAddArticleContent: function (siteName, article) {
        return this.findAndSelectItem(siteName).then(() => {
            return this.openContentWizard(article.contentType);
        }).then(() => {
            return contentWizardPanel.typeData(article);
        }).then(() => {
            return contentWizardPanel.waitAndClickOnSave();
        }).then(() => {
            return this.doCloseCurrentBrowserTab();
        }).then(() => {
            this.doSwitchToContentBrowsePanel();
        }).pause(2000);
    },
    findAndSelectItem: function (name) {
        return this.typeNameInFilterPanel(name).then(() => {
            return browsePanel.waitForRowByNameVisible(name);
        }).pause(500).then(() => {
            return browsePanel.clickOnRowByName(name);
        });
    },
    findAndSelectContentByDisplayName: function (displayName) {
        return this.typeNameInFilterPanel(displayName).then(() => {
            return browsePanel.waitForContentByDisplayNameVisible(displayName);
        }).pause(400).then(() => {
            return browsePanel.clickOnRowByDisplayName(displayName);
        });
    },
    doDeleteContent: function (name) {
        return this.findAndSelectItem(name).then(() => {
            return browsePanel.clickOnDeleteButton();
        }).pause(500).then(() => {
            return deleteContentDialog.clickOnDeleteButton();
        }).then(() => {
            return deleteContentDialog.waitForDialogClosed();
        }).pause(500);
    },
    selectContentAndOpenWizard: function (name) {
        return this.findAndSelectItem(name).then(() => {
            return browsePanel.waitForEditButtonEnabled();
        }).then(() => {
            return browsePanel.clickOnEditButton();
        }).then(() => {
            return this.doSwitchToNewWizard();
        }).then(() => {
            return contentWizardPanel.waitForOpened();
        })
    },
    findContentAndClickCheckBox: function (displayName) {
        return this.typeNameInFilterPanel(displayName).pause(400).then(() => {
            return browsePanel.waitForContentByDisplayNameVisible(displayName);
        }).then(() => {
            return browsePanel.clickCheckboxAndSelectRowByDisplayName(displayName);
        }).pause(400);
    }
    ,
    selectSiteAndOpenNewWizard: function (siteName, contentType) {
        return this.findAndSelectItem(siteName).then(() => {
            return browsePanel.waitForNewButtonEnabled();
        }).then(() => {
            return browsePanel.clickOnNewButton();
        }).then(() => {
            return newContentDialog.waitForOpened();
        }).then(() => {
            return newContentDialog.typeSearchText(contentType);
        }).then(() => {
            return newContentDialog.clickOnContentType(contentType);
        }).then(() => {
            return this.doSwitchToNewWizard();
        }).then(() => {
            return contentWizardPanel.waitForOpened();
        });
    },
    clickOnDeleteAndConfirm: function (numberOfContents) {
        return browsePanel.clickOnDeleteButton().then(() => {
            return deleteContentDialog.waitForDialogVisible(1000);
        }).then(() => {
            return deleteContentDialog.clickOnDeleteButton();
        }).then(() => {
            return confirmContentDeleteDialog.waitForDialogVisible();
        }).then(() => {
            return confirmContentDeleteDialog.typeNumberOfContent(numberOfContents);
        }).pause(700).then(() => {
            return confirmContentDeleteDialog.clickOnConfirmButton();
        }).then(() => {
            return deleteContentDialog.waitForDialogClosed();
        })
    },
    typeNameInFilterPanel: function (name) {
        return filterPanel.isPanelVisible().then((result) => {
            if (!result) {
                return browsePanel.clickOnSearchButton().then(() => {
                    return filterPanel.waitForOpened();
                })
            }
            return;
        }).then(() => {
            return filterPanel.typeSearchText(name);
        }).catch((err) => {
            throw new Error(err);
        }).then(() => {
            return browsePanel.waitForSpinnerNotVisible(appConst.TIMEOUT_3);
        }).pause(300);
    },
    selectAndDeleteItem: function (name) {
        return this.findAndSelectItem(name).pause(500).then(() => {
            return browsePanel.waitForDeleteButtonEnabled();
        }).then(result => {
            return browsePanel.clickOnDeleteButton();
        }).then(() => {
            return confirmationDialog.waitForDialogVisible(appConst.TIMEOUT_3);
        }).then(result => {
            if (!result) {
                throw new Error('Confirmation dialog is not loaded!')
            }
            return confirmationDialog.clickOnYesButton();
        }).then(() => {
            return browsePanel.waitForSpinnerNotVisible();
        })
    },
    confirmDelete: () => {
        return confirmationDialog.waitForDialogVisible(appConst.TIMEOUT_3).then(() => {
            return confirmationDialog.clickOnYesButton();
        }).then(() => {
            return browsePanel.waitForSpinnerNotVisible();
        });
    },
    navigateToContentStudioApp: function () {
        return launcherPanel.waitForPanelVisible(appConst.TIMEOUT_3).then((result) => {
            if (result) {
                console.log("Launcher Panel is opened, click on the `Content Studio` link...");
                return launcherPanel.clickOnContentStudioLink();
            } else {
                console.log("Login Page is opened, type a password and name...");
                return this.doLoginAndClickOnContentStudio();
            }
        }).then(() => {
            return this.doSwitchToContentBrowsePanel();
        }).catch(err => {
            console.log('tried to navigate to Content Studio app, but: ' + err);
            this.saveScreenshot(appConst.generateRandomName("err_navigate_to_studio"));
            throw new Error('error when navigated to studio ' + err);
        })
    },
    doLoginAndClickOnContentStudio: function () {
        return loginPage.doLogin().pause(900).then(() => {
            return homePage.waitForXpTourVisible(appConst.TIMEOUT_2);
        }).then(result => {
            if (result) {
                return homePage.doCloseXpTourDialog();
            }
        }).then(() => {
            return launcherPanel.clickOnContentStudioLink().pause(1000);
        })
    },
    doSwitchToContentBrowsePanel: function () {
        console.log('testUtils:switching to Content Studio app...');
        return webDriverHelper.browser.getTitle().then(title => {
            if (title != "Content Studio - Enonic XP Admin") {
                return this.switchToStudioTabWindow();
            }
        })
    },
    doSwitchToHome: function () {
        console.log('testUtils:switching to Home page...');
        return webDriverHelper.browser.getTabIds().then(tabs => {
            let prevPromise = Promise.resolve(false);
            tabs.some(tabId => {
                prevPromise = prevPromise.then((isHome) => {
                    if (!isHome) {
                        return this.switchAndCheckTitle(tabId, "Enonic XP Home");
                    }
                    return false;
                });
            });
            return prevPromise;
        }).then(() => {
            return homePage.waitForLoaded(appConst.TIMEOUT_3);
        });
    },
    doSwitchToNewWizard: function () {
        console.log('testUtils:switching to the new wizard tab...');
        return webDriverHelper.browser.getTabIds().then(tabs => {
            this.xpTabs = tabs;
            return webDriverHelper.browser.switchTab(this.xpTabs[this.xpTabs.length - 1]);
        }).then(() => {
            return contentWizardPanel.waitForOpened();
        });
    },
    switchAndCheckTitle: function (tabId, reqTitle) {
        return webDriverHelper.browser.switchTab(tabId).then(() => {
            return webDriverHelper.browser.getTitle().then(title => {
                return title.includes(reqTitle);
            })
        });
    },

    doLoginAndSwitchToContentStudio: function () {
        return loginPage.doLogin().pause(1000).then(() => {
            return homePage.waitForXpTourVisible(appConst.TIMEOUT_3);
        }).then(result => {
            if (result) {
                return homePage.doCloseXpTourDialog();
            }
        }).then(() => {
            return launcherPanel.clickOnContentStudioLink().pause(1000);
        }).then(() => {
            return this.doSwitchToContentBrowsePanel();
        }).catch((err) => {
            throw new Error(err);
        })
    },
    doCloseWindowTabAndSwitchToBrowsePanel: function () {
        return webDriverHelper.browser.close().pause(300).then(() => {
            return this.doSwitchToContentBrowsePanel();
        })
    },

    saveAndCloseWizard: function (displayName) {
        return wizard.waitAndClickOnSave().pause(300).then(() => {
            return this.doCloseWindowTabAndSwitchToBrowsePanel()
        })
    },
    switchToStudioTabWindow: function () {
        return webDriverHelper.browser.getTabIds().then(tabs => {
            let prevPromise = Promise.resolve(false);
            tabs.some(tabId => {
                prevPromise = prevPromise.then((isStudio) => {
                    if (!isStudio) {
                        return this.switchAndCheckTitle(tabId, "Content Studio - Enonic XP Admin");
                    }
                    return true;
                });
            });
            return prevPromise;
        }).then(() => {
            return browsePanel.waitForGridLoaded(appConst.TIMEOUT_5);
        });
    },
    switchToContentTabWindow: function (contentDisplayName) {
        return webDriverHelper.browser.getTabIds().then(tabs => {
            let prevPromise = Promise.resolve(false);
            tabs.some(tabId => {
                prevPromise = prevPromise.then((isStudio) => {
                    if (!isStudio) {
                        return this.switchAndCheckTitle(tabId, contentDisplayName);
                    }
                    return true;
                });
            });
            return prevPromise;
        }).pause(300);
    },
    doPressBackspace: function () {
        return webDriverHelper.browser.keys('\uE003');
    },
    doCloseAllWindowTabsAndSwitchToHome: function () {
        return webDriverHelper.browser.getTabIds().then(tabIds => {
            let result = Promise.resolve();
            tabIds.forEach(tabId => {
                result = result.then(() => {
                    return this.switchAndCheckTitle(tabId, "Enonic XP Home");
                }).then(result => {
                    if (!result) {
                        return webDriverHelper.browser.close().then(() => {
                            console.log(tabId + ' was closed');
                        });
                    }
                });
            });
            return result;
        }).then(() => {
            return this.doSwitchToHome();
        });
    },
    saveScreenshot: function (name) {
        var path = require('path')
        var screenshotsDir = path.join(__dirname, '/../build/screenshots/');
        return webDriverHelper.browser.saveScreenshot(screenshotsDir + name + '.png').then(() => {
            return console.log('screenshot saved ' + name);
        }).catch(err => {
            return console.log('screenshot was not saved ' + screenshotsDir + 'utils  ' + err);
        })
    }
};
