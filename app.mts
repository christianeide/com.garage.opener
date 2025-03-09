import Homey from 'homey';
import { HomeyAPI } from 'homey-api';
import type { HomeyAPIV2 } from 'homey-api';

// Fix lacking typing in homey-api
type Device = HomeyAPIV2.ManagerDevices.Device & {
  on: (
    event: 'capability',
    callback: (event: {
      capabilityId: string;
      transactionId: string;
      transactionTime: number;
      value: number | string | boolean;
    }) => void,
  ) => Device;
  connect: () => Device;
  capabilitiesObj: {
    [key: string]: {
      value: boolean | string | number;
    };
  };
};

type ExtendedHomeyAPI = HomeyAPI & {
  devices: {
    getDevice: ({ id }: { id: string }) => Promise<Device>;
    getDevices: () => Promise<Record<string, HomeyAPIV2.ManagerDevices.Device>>;
  };
};

export default class GarageOpener extends Homey.App {
  homeyApi: ExtendedHomeyAPI | null = null;
  garageDevice: Device | null = null;

  /**
   * onInit is called when the app is initialized.
   */
  override async onInit() {
    process.env.TZ = this.homey.clock.getTimezone();

    this.homeyApi = await HomeyAPI.createAppAPI({
      homey: this.homey,
    });

    if (!this.homeyApi) {
      return;
    }

    this.garageDevice = await this.homeyApi.devices.getDevice({
      id: '0e86fad0-a164-4293-b765-a050b3519688', // Virtual button for "Status garasjedør"
    });

    this.garageDevice
      .on('capability', async (event) => {
        if (event.capabilityId === 'alarm_motion') {
          // Emit event to widget
          await this.homey.api.realtime('device_changed', {
            state: event.value,
            id: this.garageDevice?.id,
          });
        }
      })
      .connect();
  }

  async getGarageOpenState() {
    if (!this.garageDevice) {
      return false;
    }

    return this.garageDevice.capabilitiesObj.alarm_motion?.value;
  }

  async callFlow(event: 'close' | 'open' | 'delay') {
    // Loop all devices
    const devices = await this.homeyApi?.devices.getDevices();

    if (!devices) {
      return;
    }

    // Map of event types to device names/virtual buttons
    const eventToDeviceName = {
      open: '1. Åpne garasje',
      close: '2. Lukk garasje',
      delay: '3. Utsett varsel 2t',
    };

    const targetDeviceName = eventToDeviceName[event];

    for (const deviceElement of Object.values(devices)) {
      const device = deviceElement as Device;

      if (device.name === targetDeviceName) {
        try {
          await device.setCapabilityValue({
            capabilityId: 'button',
            value: true,
          });
        } catch (error) {
          console.error('Failed to trigger button:', error);
        }
        break; // Exit loop after finding and triggering the device
      }
    }
  }
}
