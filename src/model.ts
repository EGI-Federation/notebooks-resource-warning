// We cannot easily import the model from the resource-usage extension
// So I'm taking some code from there for querying the usage api
//
// Code extracted from version:
// https://github.com/jupyter-server/jupyter-resource-usage/commit/41d88a2dc4bc9820f5801223d9830bd8f7c3d1d6
//
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { Notification } from '@jupyterlab/apputils';

import { VDomModel } from '@jupyterlab/apputils';

import { URLExt } from '@jupyterlab/coreutils';

import { ServerConnection } from '@jupyterlab/services';

import { Poll } from '@lumino/polling';

/**
 * A namespace for ResourcUsage statics.
 */
export namespace ResourceUsage {
  /**
   * A model for the resource usage items.
   */
  export class Model extends VDomModel {
    /**
     * Construct a new resource usage model.
     *
     * @param options The options for creating the model.
     */
    constructor(options: Model.IOptions) {
      super();
      this._poll = new Poll<Private.IMetricRequestResult | null>({
        factory: (): Promise<Private.IMetricRequestResult | null> =>
          Private.factory(),
        frequency: {
          interval: options.refreshRate,
          backoff: true
        },
        name: '@jupyterlab/statusbar:ResourceUsage#metrics'
      });
      this._poll.ticked.connect(poll => {
        const { payload, phase } = poll.state;
        if (phase === 'resolved') {
          this._updateMetricsValues(payload);
          return;
        }
      });
    }

    /**
     * A promise that resolves after the next request.
     */
    async refresh(): Promise<void> {
      await this._poll.refresh();
      await this._poll.tick;
    }

    /**
     * Dispose of the memory usage model.
     */
    dispose(): void {
      super.dispose();
      this._poll.dispose();
    }

    /**
     * Given the results of the metrics request, update model values.
     *
     * @param value The metric request result.
     */
    private _updateMetricsValues(
      value: Private.IMetricRequestResult | null
    ): void {
      if (value === null) {
        return;
      }

      const numBytes = value.pss ?? value.rss;
      const memoryLimits = value.limits.memory;
      const memoryLimit = memoryLimits?.pss ?? memoryLimits?.rss ?? null;
      const memoryPercent = memoryLimit
        ? Math.min(numBytes / memoryLimit, 1) * 100
        : 0;
      const memwarn = value.limits.memory?.warn;
      if (memwarn) {
        if (!this._previousWarn) {
          this._previousWarn = true;
          Notification.warning(
            'Memory usage reached ' + memoryPercent.toFixed() + '%.',
            { autoClose: 3000 }
          );
        }
      } else {
        this._previousWarn = false;
      }
      this.stateChanged.emit(void 0);
    }

    private _poll: Poll<Private.IMetricRequestResult | null>;
    private _previousWarn = false;
  }

  /**
   * A namespace for Model statics.
   */
  export namespace Model {
    /**
     * Options for creating a ResourceUsage model.
     */
    export interface IOptions {
      /**
       * The refresh rate (in ms) for querying the server.
       */
      refreshRate: number;
    }
  }
}

/**
 * enolfc: this code is directly extracted as is from jupyter-resource-usage
 */
/**
 * A namespace for module private statics.
 */
namespace Private {
  /**
   * Settings for making requests to the server.
   */
  const SERVER_CONNECTION_SETTINGS = ServerConnection.makeSettings();

  /**
   * The url endpoint for making requests to the server.
   */
  const METRIC_URL = URLExt.join(
    SERVER_CONNECTION_SETTINGS.baseUrl,
    'api/metrics/v1'
  );

  /**
   * The shape of a response from the metrics server extension.
   */
  export interface IMetricRequestResult {
    rss: number;
    pss?: number;
    cpu_percent?: number;
    cpu_count?: number;
    disk_total?: number;
    disk_used?: number;
    limits: {
      memory?: {
        rss: number;
        pss?: number;
        warn: boolean;
      };
      cpu?: {
        cpu: number;
        warn: boolean;
      };
      disk?: {
        max: number;
        warn: boolean;
      };
    };
  }

  /**
   * Make a request to the backend.
   */
  export const factory = async (): Promise<IMetricRequestResult | null> => {
    const request = ServerConnection.makeRequest(
      METRIC_URL,
      {},
      SERVER_CONNECTION_SETTINGS
    );
    const response = await request;

    if (response.ok) {
      return await response.json();
    }

    return null;
  };
}
