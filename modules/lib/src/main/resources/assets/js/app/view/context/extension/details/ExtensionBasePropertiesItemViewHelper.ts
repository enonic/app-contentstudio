import {GetPrincipalsByKeysRequest} from '@enonic/lib-admin-ui/security/GetPrincipalsByKeysRequest';
import {type Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {UrlHelper} from '../../../../util/UrlHelper';
import {ExtensionPropertiesItemViewHelper} from './ExtensionPropertiesItemViewHelper';
import {type Application} from '@enonic/lib-admin-ui/application/Application';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DateTimeFormatter} from '@enonic/lib-admin-ui/ui/treegrid/DateTimeFormatter';
import {ExtensionPropertiesItemViewValue} from './ExtensionPropertiesItemViewValue';
import {PropertiesWizardStepFormType} from './PropertiesWizardStepFormFactory';
import Q from 'q';
import {AccessControlHelper} from '../../../../wizard/AccessControlHelper';
import {ProjectHelper} from '../../../../settings/data/project/ProjectHelper';
import {ProjectContext} from '../../../../project/ProjectContext';
import {GetContentPermissionsByIdRequest} from '../../../../resource/GetContentPermissionsByIdRequest';
import {type AccessControlList} from '../../../../access/AccessControlList';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {AuthHelper} from '@enonic/lib-admin-ui/auth/AuthHelper';
import {PermissionsHelper} from '../../../../access/PermissionsHelper';

export class ExtensionBasePropertiesItemViewHelper
    extends ExtensionPropertiesItemViewHelper {

    private application?: Application;

    private postfixUri: string;

    private static CACHED_PRINCIPALS: Map<string, Principal> = new Map<string, Principal>();

    constructor() {
        super();

        this.postfixUri = UrlHelper.getCmsRestUri('');
    }

    setApplication(app: Application): this {
        this.application = app;
        return this;
    }

    generateProps(): Q.Promise<Map<string, ExtensionPropertiesItemViewValue>> {
        return this.fetchPrincipals().then(() => {
            return this.doGenerateProps();
        });
    }

    protected getFetchedPrincipal(key: string): Principal | undefined {
        return ExtensionBasePropertiesItemViewHelper.CACHED_PRINCIPALS.get(key);
    }

    private fetchPrincipals(): Q.Promise<void> {
        const keys = Array.from(this.getPrincipalKeysToFetch()).filter(
            (key) => !ExtensionBasePropertiesItemViewHelper.CACHED_PRINCIPALS.has(key));
        const pKeys = keys.map(PrincipalKey.fromString);
        const fetchPromise = pKeys.length > 0
                             ? new GetPrincipalsByKeysRequest(pKeys).setPostfixUri(this.postfixUri).sendAndParse()
                             : Q<Principal[]>([]);

        return fetchPromise.then((principals) => {
            principals.forEach((p) => {
                ExtensionBasePropertiesItemViewHelper.CACHED_PRINCIPALS.set(p.getKey().toString(), p);
            });
        });
    }

    protected getPrincipalKeysToFetch(): Set<string> {
        const principalKeys: Set<string> = new Set<string>();

        if (this.item.getContentSummary().getCreator()) {
            principalKeys.add(this.item.getContentSummary().getCreator().toString());
        }

        if (this.item.getContentSummary().getModifier()) {
            principalKeys.add(this.item.getContentSummary().getModifier().toString());
        }

        if (this.item.getContentSummary().getOwner()) {
            principalKeys.add(this.item.getContentSummary().getOwner().toString());
        }

        return principalKeys;
    }

    protected doGenerateProps(): Map<string, ExtensionPropertiesItemViewValue> {
        const propsMap: Map<string, ExtensionPropertiesItemViewValue> = new Map<string, ExtensionPropertiesItemViewValue>();

        this.setPropsFieldId(propsMap);
        this.setPropsType(propsMap);
        this.setPropsApp(propsMap);
        this.setPropsCreated(propsMap);
        this.setPropsModified(propsMap);
        this.setPropsPublishFirstTime(propsMap);
        this.setPropsLang(propsMap);
        this.setPropsOwner(propsMap);

        return propsMap;
    }

    protected setPropsFieldId(propsMap: Map<string, ExtensionPropertiesItemViewValue>) {
        propsMap.set(i18n('field.id'), new ExtensionPropertiesItemViewValue(this.item.getId()));
    }

    protected setPropsType(propsMap: Map<string, ExtensionPropertiesItemViewValue>) {
        propsMap.set(i18n('field.type'), new ExtensionPropertiesItemViewValue(this.item.getType().getLocalName()
                                                                           ? this.item.getType().getLocalName()
                                                                           : this.item.getType().toString()));
    }

    protected setPropsApp(propsMap: Map<string, ExtensionPropertiesItemViewValue>) {
        propsMap.set(i18n('field.app'),
            new ExtensionPropertiesItemViewValue(this.application?.getDisplayName() || this.item.getType().getApplicationKey().getName()));
    }

    protected setPropsLang(propsMap: Map<string, ExtensionPropertiesItemViewValue>) {
        if (this.item.getLanguage()) {
            propsMap.set(i18n('field.lang'), new ExtensionPropertiesItemViewValue(this.item.getLanguage()));
        }
    }

    protected setPropsOwner(propsMap: Map<string, ExtensionPropertiesItemViewValue>) {
        const owner = this.item.getContentSummary().getOwner()?.toString();

        if (owner) {
            const displayName = this.getFetchedPrincipal(owner)?.getDisplayName();
            const title = displayName ? owner : '';
            propsMap.set(i18n('field.owner'), new ExtensionPropertiesItemViewValue(displayName, title));
        }
    }

    protected setPropsCreated(propsMap: Map<string, ExtensionPropertiesItemViewValue>) {
        const createdTime = this.item.getContentSummary().getCreatedTime();
        const creator = this.item.getContentSummary().getCreator()?.toString();

        if (createdTime && creator) {
            const displayName = this.getFetchedPrincipal(creator)?.getDisplayName();
            const createdByText = i18n('text.by', DateTimeFormatter.createHtml(createdTime), displayName || creator);

            propsMap.set(i18n('field.created'), new ExtensionPropertiesItemViewValue(createdByText));
        }
    }

    protected setPropsModified(propsMap: Map<string, ExtensionPropertiesItemViewValue>) {
        const modifiedTime = this.item.getContentSummary().getModifiedTime();
        const modifier = this.item.getContentSummary().getModifier()?.toString();

        if (modifiedTime && modifier) {
            const displayName = this.getFetchedPrincipal(modifier)?.getDisplayName();
            const modifiedByText = i18n('text.by', DateTimeFormatter.createHtml(modifiedTime), displayName || modifier);

            propsMap.set(i18n('field.modified'), new ExtensionPropertiesItemViewValue(modifiedByText));
        }
    }

    protected setPropsPublishFirstTime(propsMap: Map<string, ExtensionPropertiesItemViewValue>) {
        const publishFirstTime = this.item.getContentSummary().getPublishFirstTime();

        if (publishFirstTime) {
            propsMap.set(i18n('field.firstPublished'), new ExtensionPropertiesItemViewValue(DateTimeFormatter.createHtml(publishFirstTime)));
        }
    }

    protected isFormAllowed(type: PropertiesWizardStepFormType): Q.Promise<boolean> {
        if (type === PropertiesWizardStepFormType.SETTINGS) {
            return this.isEditSettingAllowed();
        }

        return super.isFormAllowed(type);
    }

    private isEditSettingAllowed(): Q.Promise<boolean> {
        return this.hasAdminAccessToSettings() ? Q.resolve(true) : this.hasFullAccess().catch(() => {
            NotifyManager.get().showWarning(i18n(''));
            return Q.resolve(false);
        });
    }

    private hasAdminAccessToSettings(): boolean {
        return PermissionsHelper.hasAdminPermissions() ||
               AuthHelper.isContentExpert() ||
               ProjectHelper.isProjectOwner(ProjectContext.get().getProject());
    }

    private hasFullAccess(): Q.Promise<boolean> {
        return new GetContentPermissionsByIdRequest(this.item.getContentId()).sendAndParse().then(
            (permissions: AccessControlList) => {
                return AccessControlHelper.hasFullAccess(permissions);
            });
    }
}
