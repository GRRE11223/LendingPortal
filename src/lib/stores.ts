import { BrokerStore } from './store';

// Create singleton instances
export const brokerStore = new BrokerStore();

// Export all stores
export const stores = {
  broker: brokerStore,
} as const; 