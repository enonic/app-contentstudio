import {defineEvent} from './definedEvent';
import {EmulatorDevice} from '../../../../../app/view/context/widget/emulator/EmulatorDevice';

export const EmulatedDeviceEvent = defineEvent<EmulatorDevice>('emulated');
