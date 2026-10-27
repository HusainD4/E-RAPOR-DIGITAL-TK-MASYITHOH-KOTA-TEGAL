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
import { SchoolsService } from './schools.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/constants';

import { CreateSchoolDto, UpdateSchoolDto } from './dto/school.dto';

@Controller('api/v1/admin/schools')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get()
  async findAll() {
    return this.schoolsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.schoolsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMINISTRATOR)
  async create(@Body() body: CreateSchoolDto) {
    return this.schoolsService.create(body);
  }

  @Put(':id')
  @Roles(Role.ADMINISTRATOR)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateSchoolDto,
  ) {
    return this.schoolsService.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRATOR)
  async delete(@Param('id') id: string) {
    return this.schoolsService.delete(id);
  }
}
