import { useLocalSearchParams } from 'expo-router';
import { DetailSheet } from '@/features/detail/DetailSheet';

export default function ItemRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DetailSheet id={id} />;
}
