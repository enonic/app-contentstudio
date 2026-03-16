import {type EmulatorDevice} from '../../../../../app/view/context/extension/emulator/EmulatorDevice';
import {defineEvent} from './definedEvent';

export const EmulatedDeviceEvent = defineEvent<EmulatorDevice>('emulated');
