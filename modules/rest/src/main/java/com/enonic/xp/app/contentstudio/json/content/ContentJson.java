package com.enonic.xp.app.contentstudio.json.content;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.enonic.xp.app.contentstudio.json.content.attachment.AttachmentJson;
import com.enonic.xp.app.contentstudio.json.content.attachment.AttachmentListJson;
import com.enonic.xp.app.contentstudio.json.content.page.PageJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.ComponentNameResolver;
import com.enonic.xp.app.contentstudio.rest.resource.content.ContentIconUrlResolver;
import com.enonic.xp.app.contentstudio.rest.resource.content.ContentListTitleResolver;
import com.enonic.xp.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.AccessControlEntriesJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.AccessControlEntryJson;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ExtraData;
import com.enonic.xp.content.ValidationErrors;
import com.enonic.xp.data.PropertyArrayJson;
import com.enonic.xp.data.PropertyTreeJson;
import com.enonic.xp.security.Principals;

@SuppressWarnings("UnusedDeclaration")
public final class ContentJson
    extends ContentSummaryJson
{
    private final List<PropertyArrayJson> data;

    private final List<AttachmentJson> attachments;

    private final List<ExtraDataJson> extraData;

    private final List<ValidationErrorJson> validationErrors;

    private final PageJson pageJson;

    private final AccessControlEntriesJson accessControlList;

    private final boolean inheritPermissions;

    public ContentJson( final Content content, final ContentIconUrlResolver iconUrlResolver,
                        final ContentPrincipalsResolver contentPrincipalsResolver, final ComponentNameResolver componentNameResolver,
                        final ContentListTitleResolver contentListTitleResolver, final List<ValidationErrorJson> localizedValidationErrors )
    {
        super( content, iconUrlResolver, contentListTitleResolver );
        this.data = PropertyTreeJson.toJson( content.getData() );
        this.attachments = AttachmentListJson.toJson( content.getAttachments() );

        this.extraData = new ArrayList<>();
        for ( ExtraData item : content.getAllExtraData() )
        {
            this.extraData.add( new ExtraDataJson( item ) );
        }

        this.pageJson = content.hasPage() ? new PageJson( content.getPage(), componentNameResolver ) : null;

        final Principals principals = contentPrincipalsResolver.resolveAccessControlListPrincipals( content.getPermissions() );
        this.accessControlList = AccessControlEntriesJson.from( content.getPermissions(), principals );
        this.inheritPermissions = content.inheritsPermissions();
        this.validationErrors = localizedValidationErrors;
    }

    public List<PropertyArrayJson> getData()
    {
        return data;
    }

    public List<AttachmentJson> getAttachments()
    {
        return attachments;
    }

    public List<ExtraDataJson> getMeta()
    {
        return this.extraData;
    }

    public List<AccessControlEntryJson> getPermissions()
    {
        return this.accessControlList.getList();
    }

    public PageJson getPage()
    {
        return pageJson;
    }

    public boolean isInheritPermissions()
    {
        return inheritPermissions;
    }

    public List<ValidationErrorJson> getValidationErrors()
    {
        return validationErrors;
    }
}
