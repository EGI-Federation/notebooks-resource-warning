import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ResourceUsage } from './model';

const DEFAULT_REFRESH_RATE = 6000;

/**
 * Initialization data for the resource_warning extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'resource_warning:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  activate: async (app: JupyterFrontEnd) => {
    const refreshRate = DEFAULT_REFRESH_RATE;
    const model = new ResourceUsage.Model({ refreshRate });
    model.refresh();
  }
};

export default plugin;
