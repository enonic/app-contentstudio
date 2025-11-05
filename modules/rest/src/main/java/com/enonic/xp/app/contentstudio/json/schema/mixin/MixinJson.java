package com.enonic.xp.app.contentstudio.json.schema.mixin;

import java.time.Instant;

import com.google.common.base.Preconditions;

import com.enonic.xp.app.contentstudio.json.ItemJson;
import com.enonic.xp.app.contentstudio.json.form.FormJson;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.formfragment.CmsFormFragmentResolver;
import com.enonic.xp.schema.mixin.MixinDescriptor;

import static com.google.common.base.Strings.nullToEmpty;

public class MixinJson
    implements ItemJson
{
    private final MixinDescriptor mixin;

    private final Boolean isOptional;

    private final LocaleMessageResolver localeMessageResolver;

    private final CmsFormFragmentResolver inlineMixinResolver;

    public MixinJson( final Builder builder )
    {
        Preconditions.checkNotNull( builder.localeMessageResolver );
        Preconditions.checkNotNull( builder.inlineMixinResolver );

        this.mixin = builder.mixin;
        this.isOptional = builder.isOptional;
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

    public Boolean getIsOptional()
    {
        return isOptional;
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
        private MixinDescriptor mixin;

        private Boolean isOptional = false;

        private LocaleMessageResolver localeMessageResolver;

        private CmsFormFragmentResolver inlineMixinResolver;

        private Builder()
        {
        }

        public Builder setMixin( final MixinDescriptor mixin )
        {
            this.mixin = mixin;
            return this;
        }

        public Builder setOptional( final Boolean optional )
        {
            isOptional = optional;
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

        private void validate()
        {
            Preconditions.checkNotNull( localeMessageResolver );
            Preconditions.checkNotNull( inlineMixinResolver );
        }

        public MixinJson build()
        {
            validate();
            return new MixinJson( this );
        }
    }

}
