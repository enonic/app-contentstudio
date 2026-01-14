/**
 * Created on 6/30/2017.
 */
const appConst = require('./app_const');
module.exports = {
    generateRandomName: function (part) {
        return part + Math.round(Math.random() * 1000000);
    },

    buildShortcut: function (displayName, targetDisplayName, parameters) {
        return {
            contentType: appConst.contentTypes.SHORTCUT,
            displayName: displayName,
            data: {
                targetDisplayName: targetDisplayName
            },
            parameters: parameters
        };
    },
    buildHtmlArea: function (displayName, type, ...texts) {
        return {
            contentType: type,
            displayName: displayName,
            data: {
                texts: texts
            },
        };
    },
    buildSite: function (displayName, description, applications, controller) {
        return {
            contentType: appConst.contentTypes.SITE,
            displayName: displayName,

            data: {
                description: description,
                applications: applications,
                controller: controller,
            },
        };
    },
    buildPageTemplate: function (displayName, supports, controllerDisplayName) {
        return {
            contentType: appConst.contentTypes.PAGE_TEMPLATE,
            displayName: displayName,

            data: {
                supports: supports,
                controllerDisplayName: controllerDisplayName
            },
        };
    },
    buildFolder: function (displayName, owner, language) {
        return {
            contentType: appConst.contentTypes.FOLDER,
            displayName: displayName,
            name:displayName,

            settings: {
                owner: owner,
                language: language
            },
        };
    },
    buildContentWithImageSelector: function (displayName, contentType, images) {
        return {
            contentType: contentType,
            displayName: displayName,

            data: {
                images: images,
            },
        };
    },
    buildArticleContent: function (displayName, title, body, contentType) {
        return {
            contentType: contentType,
            displayName: displayName,

            data: {
                title: title,
                body: body,
            },
        };
    },

    buildUser: function (displayName, password, email, roles) {
        return {
            displayName: displayName,
            password: password,
            email: email,
            roles: roles,
        };
    },
    buildRole: function (displayName, description, members) {
        return {
            displayName: displayName,
            description: description,
            members: members,
        };
    },
    buildGroup: function (displayName, description, members, roles) {
        return {
            displayName: displayName,
            description: description,
            members: members,
            roles: roles,
        };
    },
    generateEmail: (userName) => {
        return userName + '@gmail.com'
    },
};
