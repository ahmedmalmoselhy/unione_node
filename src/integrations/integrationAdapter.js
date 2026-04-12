/**
 * Integration Adapter Interface
 * All third-party integrations should implement this interface
 */

class IntegrationAdapter {
  /**
   * Initialize the integration with configuration
   * @param {object} config - Integration configuration
   */
  initialize(config) {
    throw new Error('Method not implemented');
  }

  /**
   * Test the integration connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    throw new Error('Method not implemented');
  }

  /**
   * Sync data to the integration
   * @param {object} data - Data to sync
   * @returns {Promise<boolean>} Sync status
   */
  async sync(data) {
    throw new Error('Method not implemented');
  }

  /**
   * Get integration status
   * @returns {Promise<object>} Status information
   */
  async getStatus() {
    throw new Error('Method not implemented');
  }
}

export default IntegrationAdapter;
