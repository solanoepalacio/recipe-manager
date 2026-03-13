'use client';

import React, { useState } from 'react';
import type { MemberResponse, AdminUserResponse } from '@recipe-manager/shared';
import { HouseholdList } from '@/components/admin/HouseholdList';
import { CreateHouseholdModal } from '@/components/admin/CreateHouseholdModal';
import { EditUserModal } from '@/components/admin/EditUserModal';
import { ApiTokensModal } from '@/components/admin/ApiTokensModal';
import { PasswordResetModal } from '@/components/admin/PasswordResetModal';
import { Button } from '@/components/ui/Button';

export default function AdminPage() {
  const [showCreateHousehold, setShowCreateHousehold] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserResponse | null>(null);
  const [passwordResetUserId, setPasswordResetUserId] = useState<string | null>(null);
  const [apiTokensUserId, setApiTokensUserId] = useState<string | null>(null);

  function handleEditUser(member: MemberResponse) {
    // Convert MemberResponse to AdminUserResponse shape for EditUserModal
    const adminUser: AdminUserResponse = {
      id: member.id,
      name: member.name,
      email: member.email ?? null,
      username: member.username ?? null,
      gender: member.gender ?? null,
      dateOfBirth: member.dateOfBirth ?? null,
      householdId: '',
      householdName: '',
      canLogin: member.canLogin,
      createdAt: '',
      updatedAt: '',
    };
    setEditingUser(adminUser);
  }

  return (
    <div className="px-5 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Hogares</h2>
        <Button onClick={() => setShowCreateHousehold(true)}>
          Nueva casa
        </Button>
      </div>

      <HouseholdList
        onEditUser={handleEditUser}
        onPasswordReset={(userId) => setPasswordResetUserId(userId)}
        onApiTokens={(userId) => setApiTokensUserId(userId)}
      />

      <CreateHouseholdModal
        isOpen={showCreateHousehold}
        onClose={() => setShowCreateHousehold(false)}
      />

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}

      {passwordResetUserId && (
        <PasswordResetModal
          userId={passwordResetUserId}
          onClose={() => setPasswordResetUserId(null)}
        />
      )}

      {apiTokensUserId && (
        <ApiTokensModal
          userId={apiTokensUserId}
          onClose={() => setApiTokensUserId(null)}
        />
      )}
    </div>
  );
}
