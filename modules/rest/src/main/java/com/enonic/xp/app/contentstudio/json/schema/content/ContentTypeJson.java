package com.enonic.xp.app.contentstudio.json.schema.content;

import com.google.common.base.Preconditions;

import com.enonic.xp.app.contentstudio.json.form.FormJson;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.ContentTypeIconUrlResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.mixin.InlineMixinResolver;
import com.enonic.xp.inputtype.InputTypeResolver;
import com.enonic.xp.schema.content.ContentType;

@SuppressWarnings("UnusedDeclaration")
public class ContentTypeJson
    extends ContentTypeSummaryJson
{
    private final FormJson form;

    public ContentTypeJson( final Builder builder )
    {
        super( builder.contentType, builder.contentTypeIconUrlResolver, builder.localeMessageResolver );
        this.form = new FormJson( builder.contentType.getForm(), builder.localeMessageResolver, builder.inlineMixinResolver, builder.inputTypeResolver );
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

        private InlineMixinResolver inlineMixinResolver;

        private InputTypeResolver inputTypeResolver;

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

        public Builder setInlineMixinResolver( final InlineMixinResolver inlineMixinResolver )
        {
            this.inlineMixinResolver = inlineMixinResolver;
            return this;
        }

        public Builder setInputTypeResolver( final InputTypeResolver inputTypeResolver )
        {
            this.inputTypeResolver = inputTypeResolver;
            return this;
        }

        private void validate()
        {
            Preconditions.checkNotNull( contentType );
            Preconditions.checkNotNull( localeMessageResolver );
            Preconditions.checkNotNull( contentTypeIconUrlResolver );
            Preconditions.checkNotNull( inlineMixinResolver );
            Preconditions.checkNotNull( inputTypeResolver );
        }

        public ContentTypeJson build()
        {
            return new ContentTypeJson( this );
        }
    }
}
