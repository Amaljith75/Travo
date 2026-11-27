import { Alert, Linking } from 'react-native';
import { whatsAppLink, type Operator } from '@travo/core';

/**
 * Opens WhatsApp / dialer for an operator. Demo operators have placeholder
 * numbers, so we explain instead of messaging a stranger's phone.
 */
export async function contactOperator(operator: Operator | null | undefined, channel: 'whatsapp' | 'call', message: string) {
  if (!operator) return;
  if (operator.isDemo) {
    Alert.alert(
      'Demo operator',
      `${operator.businessName} is sample data with a placeholder number, so we won’t open ${channel === 'whatsapp' ? 'WhatsApp' : 'the dialer'}. Real operators added in the admin dashboard can be contacted directly.`,
    );
    return;
  }
  const url = channel === 'whatsapp' ? whatsAppLink(operator.whatsapp, message) : `tel:${operator.phone.replace(/\s/g, '')}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open', channel === 'whatsapp' ? 'WhatsApp does not seem to be installed.' : 'Calling is not available on this device.');
  }
}
