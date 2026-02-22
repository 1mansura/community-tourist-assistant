'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface LeaderboardEntry {
  id: number;
  username: string;
  points: number;
  contributionCount: number;
}

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const data = await api.get<LeaderboardEntry[] | { results: LeaderboardEntry[] }>('/users/leaderboard/');
    if (Array.isArray(data)) return data;
    return (data as { results: LeaderboardEntry[] }).results ?? [];
  } catch {
    return [];
  }
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const board = await getLeaderboard();
      setLeaders(board);
    } catch {
      // keep showing stale data if reload fails
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // Refresh every 30 seconds so points stay current
    const interval = setInterval(() => void loadData(), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-600 mt-2">
            Top contributors to our community
          </p>
        </div>

        {loading && leaders.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        )}

        {!loading && leaders.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500">No contributors yet. Be the first!</p>
          </div>
        )}

        {leaders.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {leaders.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold
                    ${index === 0 ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${index === 1 ? 'bg-gray-100 text-gray-600' : ''}
                    ${index === 2 ? 'bg-orange-100 text-orange-700' : ''}
                    ${index > 2 ? 'bg-gray-50 text-gray-500' : ''}
                  `}>
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {user.username}
                    </p>
                    <p className="text-sm text-gray-500">
                      {user.contributionCount} contribution{user.contributionCount !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-primary-600">{user.points}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 bg-primary-50 rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-primary-900 mb-2">
            Want to climb the ranks?
          </h2>
          <p className="text-primary-700 mb-4">
            Submit places, write reviews, and help the community grow!
          </p>
          <Link
            href="/assets/submit"
            className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Submit a Place
          </Link>
        </div>
      </div>
    </div>
  );
}
