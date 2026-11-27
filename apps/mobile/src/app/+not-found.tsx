import { View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState } from '../components/states';
import { colors } from '../theme/tokens';

export default function NotFound() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.cream }}>
      <EmptyState title="Page not found" message="This link may be out of date." action={{ label: 'Go home', onPress: () => router.replace('/') }} />
    </View>
  );
}
