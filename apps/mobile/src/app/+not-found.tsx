import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function NotFoundScreen() {
  return (
    <PlaceholderScreen
      title="Not found"
      description="This screen doesn't exist."
      links={[{ label: 'Go home', href: '/' }]}
    />
  );
}
