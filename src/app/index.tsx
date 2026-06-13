import { Redirect } from 'expo-router';
import { useStore } from '@/store/useStore';

export default function Index() {
  const onboarded = useStore((s) => s.onboarded);
  return <Redirect href={onboarded ? '/(tabs)/discover' : '/onboarding'} />;
}
