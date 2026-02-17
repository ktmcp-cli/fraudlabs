import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured } from './config.js';
import {
  screenOrder,
  submitFeedback,
  sendSmsVerification,
  verifySmsCode
} from './api.js';

const program = new Command();

// ============================================================
// Helpers
// ============================================================

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('FraudLabs Pro API key not configured.');
    console.log('\nRun the following to configure:');
    console.log(chalk.cyan('  fraudlabs config set --api-key <key>'));
    process.exit(1);
  }
}

function formatRisk(score) {
  if (!score && score !== 0) return chalk.gray('N/A');
  const num = parseFloat(score);
  if (num >= 75) return chalk.red(score);
  if (num >= 40) return chalk.yellow(score);
  return chalk.green(score);
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('fraudlabs')
  .description(chalk.bold('FraudLabs Pro CLI') + ' - Fraud detection from your terminal')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--api-key <key>', 'FraudLabs Pro API key')
  .action((options) => {
    if (options.apiKey) {
      setConfig('apiKey', options.apiKey);
      printSuccess('API key set');
    } else {
      printError('No options provided. Use --api-key');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const apiKey = getConfig('apiKey');
    console.log(chalk.bold('\nFraudLabs Pro CLI Configuration\n'));
    console.log('API Key: ', apiKey ? chalk.green('*'.repeat(8) + apiKey.slice(-4)) : chalk.red('not set'));
    console.log('');
  });

// ============================================================
// ORDER SCREENING
// ============================================================

const orderCmd = program.command('order').description('Order fraud screening');

orderCmd
  .command('screen')
  .description('Screen an order for fraud')
  .option('--ip <address>', 'Customer IP address')
  .option('--order-id <id>', 'Order ID')
  .option('--amount <amount>', 'Order amount')
  .option('--currency <code>', 'Currency code (e.g. USD, EUR)')
  .option('--quantity <n>', 'Order quantity')
  .option('--payment-method <method>', 'Payment method (creditcard|paypal|googlepay|applepay)')
  .option('--email <email>', 'Customer email')
  .option('--first-name <name>', 'Customer first name')
  .option('--last-name <name>', 'Customer last name')
  .option('--phone <phone>', 'Customer phone')
  .option('--bill-address <addr>', 'Billing address')
  .option('--bill-city <city>', 'Billing city')
  .option('--bill-state <state>', 'Billing state')
  .option('--bill-country <code>', 'Billing country code')
  .option('--bill-zip <zip>', 'Billing ZIP')
  .option('--ship-address <addr>', 'Shipping address')
  .option('--ship-city <city>', 'Shipping city')
  .option('--ship-state <state>', 'Shipping state')
  .option('--ship-country <code>', 'Shipping country code')
  .option('--ship-zip <zip>', 'Shipping ZIP')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const result = await withSpinner('Screening order for fraud...', () =>
        screenOrder({
          ipAddress: options.ip,
          orderId: options.orderId,
          amount: options.amount,
          currency: options.currency,
          quantity: options.quantity,
          paymentMethod: options.paymentMethod,
          email: options.email,
          firstName: options.firstName,
          lastName: options.lastName,
          phone: options.phone,
          billingAddress: options.billAddress,
          billingCity: options.billCity,
          billingState: options.billState,
          billingCountry: options.billCountry,
          billingZip: options.billZip,
          shippingAddress: options.shipAddress,
          shippingCity: options.shipCity,
          shippingState: options.shipState,
          shippingCountry: options.shipCountry,
          shippingZip: options.shipZip
        })
      );
      if (options.json) { printJson(result); return; }

      console.log(chalk.bold('\nFraud Screening Result\n'));
      console.log('Fraud ID:        ', chalk.cyan(result.fraudlabspro_id || result.request_id || 'N/A'));
      console.log('Status:          ', result.fraudlabspro_status === 'APPROVE' ? chalk.green(result.fraudlabspro_status) : result.fraudlabspro_status === 'REJECT' ? chalk.red(result.fraudlabspro_status) : chalk.yellow(result.fraudlabspro_status || 'N/A'));
      console.log('Score:           ', formatRisk(result.fraudlabspro_score));
      console.log('Risk:            ', result.fraudlabspro_risk ? formatRisk(result.fraudlabspro_risk) : 'N/A');

      if (result.ip_geolocation) {
        const geo = result.ip_geolocation;
        console.log('\nIP Geolocation:');
        console.log('  Country:       ', geo.ip_country || 'N/A');
        console.log('  City:          ', geo.ip_city || 'N/A');
        console.log('  ISP:           ', geo.ip_isp || 'N/A');
        console.log('  Is Proxy:      ', geo.is_proxy ? chalk.red('Yes') : chalk.green('No'));
        console.log('  Is VPN:        ', geo.is_vpn ? chalk.red('Yes') : chalk.green('No'));
      }

      if (result.email_validation) {
        const email = result.email_validation;
        console.log('\nEmail Validation:');
        console.log('  Is Valid:      ', email.is_valid ? chalk.green('Yes') : chalk.red('No'));
        console.log('  Is Disposable: ', email.is_disposable ? chalk.red('Yes') : chalk.green('No'));
      }
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

orderCmd
  .command('feedback')
  .description('Submit feedback on a screened order')
  .requiredOption('--id <fraud-id>', 'FraudLabs Pro fraud ID')
  .requiredOption('--action <action>', 'Feedback action (APPROVE|REJECT|REJECT_BLACKLIST)')
  .option('--note <note>', 'Additional notes')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const result = await withSpinner('Submitting feedback...', () =>
        submitFeedback({
          fraudId: options.id,
          action: options.action,
          note: options.note
        })
      );
      if (options.json) { printJson(result); return; }
      printSuccess(`Feedback submitted for ${options.id}`);
      console.log('Action: ', options.action);
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// SMS VERIFICATION
// ============================================================

const smsCmd = program.command('sms').description('SMS verification operations');

smsCmd
  .command('send')
  .description('Send SMS verification code')
  .requiredOption('--phone <number>', 'Phone number (with country code)')
  .option('--country-code <code>', 'Country code (e.g. US, GB)')
  .option('--type <type>', 'Message type (SMS|VOICE)', 'SMS')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const result = await withSpinner('Sending SMS verification...', () =>
        sendSmsVerification({
          tel: options.phone,
          countryCode: options.countryCode,
          mesgType: options.type
        })
      );
      if (options.json) { printJson(result); return; }
      printSuccess('SMS verification code sent');
      if (result.request_id) console.log('Request ID: ', result.request_id);
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

smsCmd
  .command('verify')
  .description('Verify an SMS OTP code')
  .requiredOption('--phone <number>', 'Phone number')
  .requiredOption('--otp <code>', 'OTP verification code')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const result = await withSpinner('Verifying OTP...', () =>
        verifySmsCode({
          tel: options.phone,
          otp: options.otp
        })
      );
      if (options.json) { printJson(result); return; }
      if (result.result === 'found') {
        printSuccess('OTP verification successful');
      } else {
        printError('OTP verification failed: ' + (result.result || 'Invalid code'));
      }
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
