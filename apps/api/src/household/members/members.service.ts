import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { MemberResponse } from '@recipe-manager/shared';
import type { CreateMemberDto } from './dto/create-member.dto';
import type { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async listMembers(householdId: string): Promise<MemberResponse[]> {
    const users = await this.prisma.user.findMany({
      where: { householdId },
    });
    return users.map((u) => this.toMemberResponse(u));
  }

  async createMember(householdId: string, dto: CreateMemberDto): Promise<MemberResponse> {
    const user = await this.prisma.user.create({
      data: {
        householdId,
        name: dto.name,
        passwordHash: null,
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.username !== undefined && { username: dto.username }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.dateOfBirth !== undefined && { dateOfBirth: new Date(dto.dateOfBirth) }),
      },
    });
    return this.toMemberResponse(user);
  }

  async getMember(householdId: string, memberId: string): Promise<MemberResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id: memberId, householdId },
    });
    if (!user) {
      throw new NotFoundException('Member not found');
    }
    return this.toMemberResponse(user);
  }

  async updateMember(
    householdId: string,
    memberId: string,
    dto: UpdateMemberDto,
  ): Promise<MemberResponse> {
    const existing = await this.prisma.user.findFirst({
      where: { id: memberId, householdId },
    });
    if (!existing) {
      throw new NotFoundException('Member not found');
    }

    const data: Record<string, unknown> = { ...dto };
    if (data.dateOfBirth && typeof data.dateOfBirth === 'string') {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }

    const user = await this.prisma.user.update({
      where: { id: memberId },
      data,
    });
    return this.toMemberResponse(user);
  }

  async deleteMember(householdId: string, memberId: string): Promise<void> {
    const existing = await this.prisma.user.findFirst({
      where: { id: memberId, householdId },
    });
    if (!existing) {
      throw new NotFoundException('Member not found');
    }
    await this.prisma.user.delete({ where: { id: memberId } });
  }

  private toMemberResponse(user: {
    id: string;
    name: string;
    email: string | null;
    username: string | null;
    passwordHash: string | null;
    gender: string | null;
    dateOfBirth: Date | null;
  }): MemberResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      gender: user.gender as MemberResponse['gender'],
      dateOfBirth: user.dateOfBirth instanceof Date
        ? user.dateOfBirth.toISOString().split('T')[0]
        : null,
      canLogin: !!user.passwordHash,
    };
  }
}
