'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { HouseholdResponse } from '@recipe-manager/shared';

export default function HouseholdPage() {
  const { user } = useAuth();

  const { data: household } = useQuery({
    queryKey: queryKeys.household.detail(),
    queryFn: () => api.get<HouseholdResponse>('/api/household'),
  });

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-semibold text-foreground mb-6">
        {household?.name ?? '—'}
      </h1>

      <div className="flex flex-col gap-1">
        {household?.members.map((member) => {
          const isCurrentUser = member.id === user?.id;
          return (
            <div
              key={member.id}
              className="flex items-center justify-between py-3 border-b border-border last:border-0"
            >
              <span className="text-sm text-foreground">
                {member.name}
                {isCurrentUser && (
                  <span className="text-secondary ml-1">(tú)</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
