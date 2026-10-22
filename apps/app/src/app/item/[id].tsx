import { useLocalSearchParams } from 'expo-router';
import { ItemScreen } from '@/features/detail/ItemScreen';

export default function ItemRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ItemScreen id={id} />;
}
