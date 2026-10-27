import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SecurityWhitelistService } from './security-whitelist.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators';
import { Role } from '../../common/constants';

@Controller('api/v1/admin/security/whitelists')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
export class SecurityWhitelistController {
  constructor(private readonly service: SecurityWhitelistService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      label: string;
      ipOrCidr?: string;
      domainOrOrigin?: string;
      port?: number;
    },
  ) {
    return this.service.create({ ...body, userId });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      label?: string;
      ipOrCidr?: string;
      domainOrOrigin?: string;
      port?: number;
      isActive?: boolean;
    },
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
