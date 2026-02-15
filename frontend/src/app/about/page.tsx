'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin,
  Compass,
  Users,
  Heart,
  Star,
  Map,
  PlusCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

type SectionContent = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: string;
};
type SectionItems = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: { icon: React.ComponentType<{ className?: string }>; text: string }[];
};
type Section = SectionContent | SectionItems;

const sections: Section[] = [
  {
    icon: MapPin,
    title: 'What is Community Tourist Assistant?',
    content:
      'Community Tourist Assistant (CTA) is a crowd-sourced tourism platform for Devon. We help visitors and locals discover the best of the region — beaches, heritage sites, restaurants, and hidden gems — through recommendations from the community, not just guidebooks.',
  },
  {
    icon: Heart,
    title: 'Our mission',
    content:
      "To make Devon's best places easy to find and to give everyone a voice in sharing what they love. Whether you're a visitor planning a trip or a local who knows a secret spot, CTA brings that knowledge together in one place.",
  },
  {
    icon: Compass,
    title: 'How it works',
    items: [
      { icon: Map, text: 'Browse places on the map or as a list, filter by category and ratings.' },
      { icon: Star, text: "Read reviews and see photos from people who've been there." },
      { icon: PlusCircle, text: 'Submit your favourite places so others can discover them.' },
      { icon: ShieldCheck, text: 'Content is moderated so listings stay accurate and helpful.' },
    ],
  },
  {
    icon: Users,
    title: 'For visitors & locals',
    content:
      'Visitors get honest, up-to-date tips from people who know the area. Locals can share their favourite spots and earn recognition for helping others explore Devon. Everyone benefits from a single, community-driven guide.',
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50/80">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-14"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            About Community Tourist Assistant
          </h1>
          <p className="text-lg text-slate-600">
            Crowd-sourced discovery for Devon
          </p>
        </motion.header>

        <div className="space-y-12">
          {sections.map((section, i) => {
            const Icon = section.icon;
            return (
              <motion.section
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 md:p-8"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-3">
                      {section.title}
                    </h2>
                    {'content' in section && (
                      <p className="text-slate-600 leading-relaxed">
                        {section.content}
                      </p>
                    )}
                    {'items' in section && (
                      <ul className="space-y-3">
                        {section.items.map((item, j) => {
                          const ItemIcon = item.icon;
                          return (
                            <li key={j} className="flex gap-3 text-slate-600">
                              <ItemIcon className="h-5 w-5 shrink-0 text-primary-500 mt-0.5" />
                              <span>{item.text}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </motion.section>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-14 text-center"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to home
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
