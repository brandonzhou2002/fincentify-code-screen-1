import { CardFundingType, CardNetwork } from '@prisma/client';

/**
 * Processor Creation Configuration
 * ---------------------------------
 * Allows configuring the behavior of processor creation for testing.
 * This is useful for interview scenarios where you want to simulate
 * different processor behaviors during card addition.
 *
 * Usage:
 *   // Set Provider 1 to succeed with specific metadata
 *   ProcessorCreationConfig.set_provider_1_config({
 *     should_succeed: true,
 *     detected_issuer: 'TEST BANK',
 *     detected_funding_type: CardFundingType.DEBIT,
 *     detected_network: CardNetwork.VISA,
 *   });
 *
 *   // Set Provider 2 to fail
 *   ProcessorCreationConfig.set_provider_2_config({
 *     should_succeed: false,
 *   });
 */

export interface ProcessorCreationResponse {
  should_succeed: boolean;
  delay_ms?: number;
  detected_issuer?: string;
  detected_funding_type?: CardFundingType;
  detected_network?: CardNetwork;
  processor_external_id_prefix?: string;
}

class ProcessorCreationConfigStore {
  private provider_1_config: ProcessorCreationResponse = {
    should_succeed: true,
    detected_issuer: 'TEST BANK',
    detected_funding_type: CardFundingType.DEBIT,
    detected_network: CardNetwork.VISA,
    processor_external_id_prefix: 'prov1',
  };

  private provider_2_config: ProcessorCreationResponse = {
    should_succeed: true,
    detected_issuer: 'TEST BANK',
    detected_funding_type: CardFundingType.DEBIT,
    detected_network: CardNetwork.VISA,
    processor_external_id_prefix: 'prov2',
  };

  private provider_3_config: ProcessorCreationResponse = {
    should_succeed: true,
    detected_issuer: 'TEST BANK',
    detected_funding_type: CardFundingType.DEBIT,
    detected_network: CardNetwork.VISA,
    processor_external_id_prefix: 'prov3',
  };

  private provider_4_config: ProcessorCreationResponse = {
    should_succeed: true,
    detected_issuer: 'TEST BANK',
    detected_funding_type: CardFundingType.DEBIT,
    detected_network: CardNetwork.VISA,
    processor_external_id_prefix: 'prov4',
  };

  // Provider 1
  set_provider_1_config(config: Partial<ProcessorCreationResponse>): void {
    this.provider_1_config = { ...this.provider_1_config, ...config };
  }

  get_provider_1_config(): ProcessorCreationResponse {
    return { ...this.provider_1_config };
  }

  // Provider 2
  set_provider_2_config(config: Partial<ProcessorCreationResponse>): void {
    this.provider_2_config = { ...this.provider_2_config, ...config };
  }

  get_provider_2_config(): ProcessorCreationResponse {
    return { ...this.provider_2_config };
  }

  // Provider 3
  set_provider_3_config(config: Partial<ProcessorCreationResponse>): void {
    this.provider_3_config = { ...this.provider_3_config, ...config };
  }

  get_provider_3_config(): ProcessorCreationResponse {
    return { ...this.provider_3_config };
  }

  // Provider 4
  set_provider_4_config(config: Partial<ProcessorCreationResponse>): void {
    this.provider_4_config = { ...this.provider_4_config, ...config };
  }

  get_provider_4_config(): ProcessorCreationResponse {
    return { ...this.provider_4_config };
  }

  // Reset all to default
  reset_all(): void {
    const default_config: ProcessorCreationResponse = {
      should_succeed: true,
      detected_issuer: 'TEST BANK',
      detected_funding_type: CardFundingType.DEBIT,
      detected_network: CardNetwork.VISA,
    };

    this.provider_1_config = { ...default_config, processor_external_id_prefix: 'prov1' };
    this.provider_2_config = { ...default_config, processor_external_id_prefix: 'prov2' };
    this.provider_3_config = { ...default_config, processor_external_id_prefix: 'prov3' };
    this.provider_4_config = { ...default_config, processor_external_id_prefix: 'prov4' };
  }

  // Set all to same config
  set_all_configs(config: Partial<ProcessorCreationResponse>): void {
    this.set_provider_1_config(config);
    this.set_provider_2_config(config);
    this.set_provider_3_config(config);
    this.set_provider_4_config(config);
  }
}

// Singleton instance
export const ProcessorCreationConfig = new ProcessorCreationConfigStore();

// Helper function to simulate delay
export async function simulate_delay(delay_ms?: number): Promise<void> {
  if (delay_ms && delay_ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay_ms));
  }
}

export default ProcessorCreationConfig;
