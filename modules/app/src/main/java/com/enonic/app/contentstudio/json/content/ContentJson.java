package com.enonic.app.contentstudio.json.content;

import java.util.ArrayList;
import java.util.List;

import com.enonic.app.contentstudio.json.content.attachment.AttachmentJson;
import com.enonic.app.contentstudio.json.content.attachment.AttachmentListJson;
import com.enonic.app.contentstudio.json.content.page.PageJson;
import com.enonic.app.contentstudio.rest.resource.content.ComponentDisplayNameResolver;
import com.enonic.app.contentstudio.rest.resource.content.ContentIconUrlResolver;
import com.enonic.app.contentstudio.rest.resource.content.ContentListTitleResolver;
import com.enonic.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.app.contentstudio.rest.resource.content.json.AccessControlEntriesJson;
import com.enonic.app.contentstudio.rest.resource.content.json.AccessControlEntryJson;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ExtraData;
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

    public ContentJson( final Content content, final Boolean hasChildren, final ContentIconUrlResolver iconUrlResolver,
                        final ContentPrincipalsResolver contentPrincipalsResolver,
                        final ComponentDisplayNameResolver componentDisplayNameResolver,
                        final ContentListTitleResolver contentListTitleResolver, final List<ValidationErrorJson> localizedValidationErrors )
    {
        super( content, hasChildren, iconUrlResolver, contentListTitleResolver );
        this.data = PropertyTreeJson.toJson( content.getData() );
        this.attachments = AttachmentListJson.toJson( content.getAttachments() );

        this.extraData = new ArrayList<>();
        for ( ExtraData item : content.getAllExtraData() )
        {
            this.extraData.add( new ExtraDataJson( item ) );
        }

        this.pageJson = content.getPage() != null ? new PageJson( content.getPage(), componentDisplayNameResolver ) : null;

        final Principals principals = contentPrincipalsResolver.resolveAccessControlListPrincipals( content.getPermissions() );
        this.accessControlList = AccessControlEntriesJson.from( content.getPermissions(), principals );
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

    public List<ValidationErrorJson> getValidationErrors()
    {
        return validationErrors;
    }
}
