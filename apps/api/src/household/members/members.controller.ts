import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { MemberResponse } from '@recipe-manager/shared';

@ApiTags('household')
@Controller('household/members')
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get()
  @ApiOperation({ summary: 'List all members of the household' })
  @ApiResponse({ status: 200, description: 'Members returned' })
  listMembers(@CurrentUser() user: { householdId: string }): Promise<MemberResponse[]> {
    return this.membersService.listMembers(user.householdId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a no-login member to the household' })
  @ApiResponse({ status: 201, description: 'Member created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  createMember(
    @CurrentUser() user: { householdId: string },
    @Body() dto: CreateMemberDto,
  ): Promise<MemberResponse> {
    return this.membersService.createMember(user.householdId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single household member' })
  @ApiResponse({ status: 200, description: 'Member returned' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  getMember(
    @CurrentUser() user: { householdId: string },
    @Param('id') id: string,
  ): Promise<MemberResponse> {
    return this.membersService.getMember(user.householdId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a household member' })
  @ApiResponse({ status: 200, description: 'Member updated' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  updateMember(
    @CurrentUser() user: { householdId: string },
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ): Promise<MemberResponse> {
    return this.membersService.updateMember(user.householdId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the household' })
  @ApiResponse({ status: 204, description: 'Member deleted' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async deleteMember(
    @CurrentUser() user: { householdId: string },
    @Param('id') id: string,
  ): Promise<void> {
    await this.membersService.deleteMember(user.householdId, id);
  }
}
