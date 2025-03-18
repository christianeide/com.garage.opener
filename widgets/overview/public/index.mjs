'use strict';
const { createElement, useState, useEffect } = React;

const { render } = ReactDOM;
const html = htm.bind(createElement);

function WidgetApp() {
  const [Homey, setHomey] = useState(null);
  const [statusGarageDoor, setStatusGarageDoor] = useState(false);

  useEffect(() => {
    window.onHomeyReady = (homeyInstance) => {
      setHomey(homeyInstance);
      homeyInstance.ready();
    };

    // Cleanup
    return () => {
      window.onHomeyReady = undefined;
    };
  }, []);

  // Effect for events from homey app
  useEffect(() => {
    if (!Homey) {
      return;
    }

    // Get initial status
    Homey.api('GET', '/', {})
      .then((openStatus) => {
        setStatusGarageDoor(openStatus);
      })
      .catch(console.error);

    // Listen for device changes
    Homey.on('device_changed', (data) => {
      setStatusGarageDoor(data.state);
    });

    // Cleanup listener when component unmounts
    return () => {
      Homey.off('device_changed');
    };
  }, [Homey]);

  const handleGarageToggle = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      // Call the appropriate endpoint based on current state
      const endpoint = statusGarageDoor ? '/close' : '/open';
      await Homey.api('POST', endpoint, {});
    } catch (error) {
      console.error('Failed to toggle garage door:', error);
    }
  };

  const handleDelayNotification = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await Homey.api('POST', '/delay', {});
    } catch (error) {
      console.error('Failed to delay notification:', error);
    }
  };

  return html`
    <div class="opener-wrapper">
      <div
        class="opener-card opener-card--large ${statusGarageDoor
          ? 'opener-card--open'
          : 'opener-card--closed'}"
        onClick=${handleGarageToggle}
      >
        <label class="opener-label">
          <div class="opener-switch">
            <input type="checkbox" checked=${statusGarageDoor} />
            <span class="opener-switch__slider"></span>
          </div>
          <p>
            Garasjeporten er<br />
            <span class="opener-card__value">
              ${statusGarageDoor ? 'Åpen' : 'Lukket'}
            </span>
          </p>
        </label>
      </div>
      <div
        class="opener-card opener-card--wide ${statusGarageDoor
          ? ''
          : 'opener-card--disabled'}"
        onClick=${handleDelayNotification}
      >
        <p>
          Utsett varsel <br />
          <span class="homey-text-bold opener-hours">2 timer</span>
        </p>
      </div>
    </div>
  `;
}

render(html`<${WidgetApp} />`, document.getElementById('app'));
