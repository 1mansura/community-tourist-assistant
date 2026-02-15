import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | Community Tourist Assistant',
  description:
    'Learn what Community Tourist Assistant is: a crowd-sourced tourism platform for Devon where visitors and locals discover and share the best places.',
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
