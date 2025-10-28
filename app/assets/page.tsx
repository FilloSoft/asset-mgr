import { redirect } from 'next/navigation';

export default function AssetsPage() {
  redirect('/assets/overview');
  return null;
}

