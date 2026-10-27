import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/constants';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users')
  async findAll(
    @Query('role') role?: Role,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.usersService.findAll({
      role,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('users/:id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post('users')
  async create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Put('users/:id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.update(id, body);
  }

  @Delete('users/:id')
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  @Get('monitoring/active-sessions')
  async getActiveSessions() {
    return this.usersService.getActiveSessions();
  }
}
