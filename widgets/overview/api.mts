import type Homey from 'homey/lib/Homey.d.ts';

export default {
  async getDeviceState({
    homey,
    query,
  }: {
    homey: Homey;
    query: { date: string };
  }) {
    try {
      //@ts-expect-error getCosts is defined in app.mts
      const costs = await homey.app.getGarageOpenState();

      return costs;
    } catch (error) {
      homey.log('api error:', error);

      return null;
    }
  },
  async open({ homey }: { homey: Homey }) {
    try {
      // @ts-expect-error callFlow is defined in app.mts
      await homey.app.callFlow('open');

      return { success: true };
    } catch (error) {
      homey.log('api error:', error);

      return null;
    }
  },
  async close({ homey }: { homey: Homey }) {
    try {
      // @ts-expect-error callFlow is defined in app.mts
      await homey.app.callFlow('close');

      return { success: true };
    } catch (error) {
      homey.log('api error:', error);
      return null;
    }
  },
  async delay({ homey }: { homey: Homey }) {
    try {
      // @ts-expect-error callFlow is defined in app.mts
      await homey.app.callFlow('delay');

      return { success: true };
    } catch (error) {
      homey.log('api error:', error);

      return null;
    }
  },
};
