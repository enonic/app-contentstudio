package com.enonic.xp.app.contentstudio.json.schema.mixin;

import java.time.Instant;

import com.google.common.base.Preconditions;

import com.enonic.xp.app.contentstudio.json.ItemJson;
import com.enonic.xp.app.contentstudio.json.form.FormJson;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.mixin.InlineMixinResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.mixin.MixinIconUrlResolver;
import com.enonic.xp.schema.mixin.Mixin;

import static com.google.common.base.Strings.nullToEmpty;

public class MixinJson
    implements ItemJson
{
    private final Mixin mixin;

    private final String iconUrl;

    private final LocaleMessageResolver localeMessageResolver;

    private final InlineMixinResolver inlineMixinResolver;

    public MixinJson( final Builder builder )
    {
        Preconditions.checkNotNull( builder.localeMessageResolver );

        this.mixin = builder.mixin;
        this.iconUrl = builder.iconUrlResolver.resolve( mixin );
        this.localeMessageResolver = builder.localeMessageResolver;
        this.inlineMixinResolver = builder.inlineMixinResolver;
    }

    public static Builder create()
    {
        return new Builder();
    }

    public String getName()
    {
        return mixin.getName() != null ? mixin.getName().toString() : null;
    }

    public String getDisplayName()
    {
        if ( !nullToEmpty( mixin.getDisplayNameI18nKey() ).isBlank() )
        {
            return localeMessageResolver.localizeMessage( mixin.getDisplayNameI18nKey(), mixin.getDisplayName() );
        }
        else
        {
            return mixin.getDisplayName();
        }
    }

    public String getDescription()
    {
        if ( !nullToEmpty( mixin.getDescriptionI18nKey() ).isBlank() )
        {
            return localeMessageResolver.localizeMessage( mixin.getDescriptionI18nKey(), mixin.getDescription() );
        }
        else
        {
            return mixin.getDescription();
        }
    }

    public Instant getCreatedTime()
    {
        return mixin.getCreatedTime();
    }

    public Instant getModifiedTime()
    {
        return mixin.getModifiedTime();
    }

    public String getIconUrl()
    {
        return iconUrl;
    }

    public FormJson getForm()
    {
        return new FormJson( mixin.getForm(), this.localeMessageResolver, this.inlineMixinResolver );
    }

    public String getCreator()
    {
        return mixin.getCreator() != null ? mixin.getCreator().toString() : null;
    }

    public String getModifier()
    {
        return mixin.getModifier() != null ? mixin.getModifier().toString() : null;
    }

    @Override
    public boolean getDeletable()
    {
        return false;
    }

    @Override
    public boolean getEditable()
    {
        return false;
    }

    public static final class Builder
    {
        private Mixin mixin;

        private MixinIconUrlResolver iconUrlResolver;

        private LocaleMessageResolver localeMessageResolver;

        private InlineMixinResolver inlineMixinResolver;

        private Builder()
        {
        }

        public Builder setMixin( final Mixin mixin )
        {
            this.mixin = mixin;
            return this;
        }

        public Builder setIconUrlResolver( final MixinIconUrlResolver iconUrlResolver )
        {
            this.iconUrlResolver = iconUrlResolver;
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

        private void validate()
        {
            Preconditions.checkNotNull( localeMessageResolver );
            Preconditions.checkNotNull( inlineMixinResolver );
            Preconditions.checkNotNull( iconUrlResolver );
        }

        public MixinJson build()
        {
            validate();
            return new MixinJson( this );
        }
    }

}
