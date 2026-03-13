'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AdminHouseholdResponse, MemberResponse, PaginatedResponse } from '@recipe-manager/shared';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/Button';

export interface HouseholdListProps {
  onEditUser: (member: MemberResponse) => void;
  onPasswordReset: (userId: string) => void;
  onApiTokens: (userId: string) => void;
}

function MemberRow({
  member,
  onEdit,
  onPasswordReset,
  onApiTokens,
}: {
  member: MemberResponse;
  onEdit: () => void;
  onPasswordReset: () => void;
  onApiTokens: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-border last:border-b-0">
      <span className="text-sm text-foreground">{member.name}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          aria-label="Editar usuario"
        >
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onPasswordReset}
          aria-label="Restablecer contraseña"
        >
          Contraseña
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onApiTokens}
          aria-label="Tokens de API"
        >
          Tokens
        </Button>
      </div>
    </div>
  );
}

function HouseholdRow({
  household,
  onEditUser,
  onPasswordReset,
  onApiTokens,
}: {
  household: AdminHouseholdResponse;
  onEditUser: (member: MemberResponse) => void;
  onPasswordReset: (userId: string) => void;
  onApiTokens: (userId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const count = household.memberCount;

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-3 text-left bg-background hover:bg-subtle"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">{household.name}</span>
          <span className="text-xs text-secondary">
            {count} {count === 1 ? 'miembro' : 'miembros'}
          </span>
        </div>
        <span
          className={[
            'text-secondary transition-transform duration-200',
            isOpen ? 'rotate-90' : '',
          ].join(' ')}
          aria-hidden="true"
        >
          ›
        </span>
      </button>

      {isOpen && (
        <div className="bg-background">
          {household.members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              onEdit={() => onEditUser(member)}
              onPasswordReset={() => onPasswordReset(member.id)}
              onApiTokens={() => onApiTokens(member.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function HouseholdList({
  onEditUser,
  onPasswordReset,
  onApiTokens,
}: HouseholdListProps) {
  const { data, isLoading } = useQuery<PaginatedResponse<AdminHouseholdResponse>>({
    queryKey: queryKeys.admin.households(),
    queryFn: () => api.get<PaginatedResponse<AdminHouseholdResponse>>('/api/admin/households'),
  });

  if (isLoading) {
    return (
      <div className="px-5 py-8 text-center text-secondary text-sm">
        Cargando hogares...
      </div>
    );
  }

  const households = data?.items ?? [];

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {households.map((household) => (
        <HouseholdRow
          key={household.id}
          household={household}
          onEditUser={onEditUser}
          onPasswordReset={onPasswordReset}
          onApiTokens={onApiTokens}
        />
      ))}
    </div>
  );
}
