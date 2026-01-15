import { PaymentStatusCode } from '../../PaymentStatusCode';

/**
 * Processor Configuration
 * -----------------------
 * Allows configuring the return status code for each processor.
 * This is useful for testing and interview scenarios where you want
 * to simulate different processor behaviors.
 *
 * Usage:
 *   // Set Provider 1 to always return success
 *   ProcessorConfig.set_provider_1_response(PaymentStatusCode.SUCCESS);
 *
 *   // Set Provider 2 to simulate card declined
 *   ProcessorConfig.set_provider_2_response(PaymentStatusCode.CARD_ISSUER_BLOCK);
 *
 *   // Set with delay simulation
 *   ProcessorConfig.set_provider_3_response(PaymentStatusCode.SUCCESS, 2000);
 *
 *   // Reset all to default (SUCCESS)
 *   ProcessorConfig.reset_all();
 */

export interface ProcessorResponse {
  status_code: PaymentStatusCode;
  delay_ms?: number;
  transaction_id_prefix?: string;
}

class ProcessorConfigStore {
  private provider_1_response: ProcessorResponse = {
    status_code: PaymentStatusCode.SUCCESS,
    transaction_id_prefix: 'provider_1_txn',
  };

  private provider_2_response: ProcessorResponse = {
    status_code: PaymentStatusCode.SUCCESS,
    transaction_id_prefix: 'provider_2_txn',
  };

  private provider_3_response: ProcessorResponse = {
    status_code: PaymentStatusCode.SUCCESS,
    transaction_id_prefix: 'provider_3_txn',
  };

  private provider_4_response: ProcessorResponse = {
    status_code: PaymentStatusCode.SUCCESS,
    transaction_id_prefix: 'provider_4_txn',
  };

  // Provider 1
  set_provider_1_response(
    status_code: PaymentStatusCode,
    delay_ms?: number,
    transaction_id_prefix?: string
  ): void {
    this.provider_1_response = {
      status_code,
      delay_ms,
      transaction_id_prefix: transaction_id_prefix || 'provider_1_txn',
    };
  }

  get_provider_1_response(): ProcessorResponse {
    return { ...this.provider_1_response };
  }

  // Provider 2
  set_provider_2_response(
    status_code: PaymentStatusCode,
    delay_ms?: number,
    transaction_id_prefix?: string
  ): void {
    this.provider_2_response = {
      status_code,
      delay_ms,
      transaction_id_prefix: transaction_id_prefix || 'provider_2_txn',
    };
  }

  get_provider_2_response(): ProcessorResponse {
    return { ...this.provider_2_response };
  }

  // Provider 3
  set_provider_3_response(
    status_code: PaymentStatusCode,
    delay_ms?: number,
    transaction_id_prefix?: string
  ): void {
    this.provider_3_response = {
      status_code,
      delay_ms,
      transaction_id_prefix: transaction_id_prefix || 'provider_3_txn',
    };
  }

  get_provider_3_response(): ProcessorResponse {
    return { ...this.provider_3_response };
  }

  // Provider 4
  set_provider_4_response(
    status_code: PaymentStatusCode,
    delay_ms?: number,
    transaction_id_prefix?: string
  ): void {
    this.provider_4_response = {
      status_code,
      delay_ms,
      transaction_id_prefix: transaction_id_prefix || 'provider_4_txn',
    };
  }

  get_provider_4_response(): ProcessorResponse {
    return { ...this.provider_4_response };
  }

  // Reset all providers to default (SUCCESS)
  reset_all(): void {
    this.provider_1_response = {
      status_code: PaymentStatusCode.SUCCESS,
      transaction_id_prefix: 'provider_1_txn',
    };
    this.provider_2_response = {
      status_code: PaymentStatusCode.SUCCESS,
      transaction_id_prefix: 'provider_2_txn',
    };
    this.provider_3_response = {
      status_code: PaymentStatusCode.SUCCESS,
      transaction_id_prefix: 'provider_3_txn',
    };
    this.provider_4_response = {
      status_code: PaymentStatusCode.SUCCESS,
      transaction_id_prefix: 'provider_4_txn',
    };
  }

  // Set all providers to the same response
  set_all_responses(
    status_code: PaymentStatusCode,
    delay_ms?: number
  ): void {
    this.set_provider_1_response(status_code, delay_ms);
    this.set_provider_2_response(status_code, delay_ms);
    this.set_provider_3_response(status_code, delay_ms);
    this.set_provider_4_response(status_code, delay_ms);
  }
}

// Singleton instance
export const ProcessorConfig = new ProcessorConfigStore();

// Helper function to simulate delay
export async function simulate_delay(delay_ms?: number): Promise<void> {
  if (delay_ms && delay_ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay_ms));
  }
}

export default ProcessorConfig;
