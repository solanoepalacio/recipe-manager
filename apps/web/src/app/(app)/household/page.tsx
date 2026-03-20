'use client';
import { useQuery } from '@tanstack/react-query';
import type { HouseholdResponse } from '@recipe-manager/shared';
import { UserType } from '@recipe-manager/shared';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

function computeAge(dateOfBirth: string): number {
  return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / 31557600000);
}

function AgentBadge() {
  return (
    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-[4px] bg-purple-50 text-purple-600">
      Agente
    </span>
  );
}

function MemberSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-subtle animate-pulse">
      <div className="w-[40px] h-[40px] rounded-full bg-subtle shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-4 bg-subtle rounded w-1/3" />
        <div className="h-3 bg-subtle rounded w-1/5" />
      </div>
    </div>
  );
}

export default function HouseholdPage() {
  const { data: household, isLoading } = useQuery({
    queryKey: queryKeys.household.detail,
    queryFn: () => api.get<HouseholdResponse>('/household'),
  });

  return (
    <div className="px-5 py-6 space-y-4">
      {/* Heading */}
      {isLoading ? (
        <div className="h-6 w-40 bg-subtle rounded animate-pulse" />
      ) : (
        <h1
          className="text-[20px] font-semibold text-foreground"
          style={{ letterSpacing: '-0.3px' }}
        >
          {household?.name ?? ''}
        </h1>
      )}

      {/* Members list */}
      <div className="space-y-1">
        {isLoading ? (
          <>
            <MemberSkeleton />
            <MemberSkeleton />
            <MemberSkeleton />
          </>
        ) : (
          household?.members.map((member) => {
            const isAgent = member.userType === UserType.Agent;
            const initial = member.name.charAt(0).toUpperCase();
            const subtext = isAgent
              ? 'Bot'
              : member.dateOfBirth
              ? `${computeAge(member.dateOfBirth)} anos`
              : '';
            return (
              <div
                key={member.id}
                className="flex items-center gap-4 py-3 border-b border-subtle"
              >
                {/* Avatar */}
                <div className="w-[40px] h-[40px] rounded-full bg-subtle flex items-center justify-center shrink-0">
                  <span className="text-[16px] font-semibold text-secondary">
                    {initial}
                  </span>
                </div>

                {/* Info */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-foreground">
                      {member.name}
                    </span>
                    {isAgent && <AgentBadge />}
                  </div>
                  {subtext && (
                    <span className="text-[13px] text-secondary">
                      {subtext}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
