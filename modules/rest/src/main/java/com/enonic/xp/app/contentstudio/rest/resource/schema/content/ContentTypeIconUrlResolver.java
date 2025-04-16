package com.enonic.xp.app.contentstudio.rest.resource.schema.content;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.app.contentstudio.rest.resource.schema.IconUrlResolver;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeName;

public final class ContentTypeIconUrlResolver
    extends IconUrlResolver
{

    public static final String REST_SCHEMA_ICON_URL = ResourceConstants.REST_ROOT + "schema/content/icon/";

    private final ContentTypeIconResolver contentTypeIconResolver;

    public ContentTypeIconUrlResolver( final ContentTypeIconResolver contentTypeIconResolver, final HttpServletRequest request )
    {
        super( request );
        this.contentTypeIconResolver = contentTypeIconResolver;
    }

    public String resolve( final ContentType contentType )
    {
        final String baseUrl = REST_SCHEMA_ICON_URL + contentType.getName().toString();
        final Icon icon = contentTypeIconResolver.resolveIcon( contentType );
        return generateIconUrl( baseUrl, icon );
    }

    public String resolve( final ContentTypeName contentTypeName )
    {
        final String baseUrl = REST_SCHEMA_ICON_URL + contentTypeName.toString();
        final Icon icon = contentTypeIconResolver.resolveIcon( contentTypeName );
        return generateIconUrl( baseUrl, icon );
    }
}
