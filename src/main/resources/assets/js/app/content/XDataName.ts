import ApplicationKey = api.application.ApplicationKey;

export class XDataName
    extends api.application.ApplicationBasedName {

    constructor(name: string) {
        api.util.assertNotNull(name, `XData name can't be null`);
        let parts = name.split(api.application.ApplicationBasedName.SEPARATOR);
        super(ApplicationKey.fromString(parts[0]), parts[1]);
    }

    equals(o: api.Equitable): boolean {
        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, XDataName)) {
            return false;
        }

        return super.equals(o);
    }
}
