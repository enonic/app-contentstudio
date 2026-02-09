package com.enonic.app.contentstudio.json.schema.content;

import com.google.common.base.Preconditions;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.app.contentstudio.json.form.FormJson;
import com.enonic.app.contentstudio.rest.resource.schema.content.ContentTypeIconUrlResolver;
import com.enonic.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.app.contentstudio.rest.resource.schema.mixin.CmsFormFragmentResolver;
import com.enonic.xp.schema.content.ContentType;

@SuppressWarnings("UnusedDeclaration")
public class ContentTypeJson
    extends ContentTypeSummaryJson
{
    private final FormJson form;

    public ContentTypeJson( final Builder builder )
    {
        super( builder.contentType, builder.contentTypeIconUrlResolver, builder.localeMessageResolver, builder.request );
        this.form = new FormJson( builder.contentType.getForm(), builder.localeMessageResolver, builder.inlineMixinResolver );
    }

    public FormJson getForm()
    {
        return this.form;
    }

    public static Builder create()
    {
        return new Builder();
    }

    public static class Builder
    {
        private ContentType contentType;

        private ContentTypeIconUrlResolver contentTypeIconUrlResolver;

        private LocaleMessageResolver localeMessageResolver;

        private CmsFormFragmentResolver inlineMixinResolver;

        private HttpServletRequest request;

        private Builder()
        {

        }

        public Builder setContentType( final ContentType contentType )
        {
            this.contentType = contentType;
            return this;
        }

        public Builder setContentTypeIconUrlResolver( final ContentTypeIconUrlResolver contentTypeIconUrlResolver )
        {
            this.contentTypeIconUrlResolver = contentTypeIconUrlResolver;
            return this;
        }

        public Builder setLocaleMessageResolver( final LocaleMessageResolver localeMessageResolver )
        {
            this.localeMessageResolver = localeMessageResolver;
            return this;
        }

        public Builder setInlineMixinResolver( final CmsFormFragmentResolver inlineMixinResolver )
        {
            this.inlineMixinResolver = inlineMixinResolver;
            return this;
        }

        public Builder setRequest( final HttpServletRequest request )
        {
            this.request = request;
            return this;
        }

        private void validate()
        {
            Preconditions.checkNotNull( contentType );
            Preconditions.checkNotNull( localeMessageResolver );
            Preconditions.checkNotNull( contentTypeIconUrlResolver );
            Preconditions.checkNotNull( inlineMixinResolver );
            Preconditions.checkNotNull( request );
        }

        public ContentTypeJson build()
        {
            return new ContentTypeJson( this );
        }
    }
}
