import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the resource_warning extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'resource_warning:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension resource_warning is activated!');
  }
};

export default plugin;
