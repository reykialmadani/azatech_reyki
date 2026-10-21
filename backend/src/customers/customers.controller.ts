import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';
import { UuidPipe } from '../common/pipes/id.pipes.js';
import { CustomersService } from './customers.service.js';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto.js';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto.js';

const CustomerId = () => Param('id', new UuidPipe('Pelanggan tidak ditemukan'));

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List pelanggan aktif (pagination, search nama / no. HP)' })
  list(@Query() query: ListCustomersQueryDto) {
    return this.customers.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail pelanggan' })
  findOne(@CustomerId() id: string) {
    return this.customers.findOne(id);
  }

  @Post()
  @ResponseMessage('Pelanggan berhasil dibuat')
  @ApiOperation({ summary: 'Tambah pelanggan' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customers.create(dto);
  }

  @Put(':id')
  @ResponseMessage('Pelanggan berhasil diperbarui')
  @ApiOperation({ summary: 'Update pelanggan (payload lengkap)' })
  update(@CustomerId() id: string, @Body() dto: UpdateCustomerDto) {
    return this.customers.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete pelanggan (riwayat order tetap utuh)' })
  remove(@CustomerId() id: string): Promise<void> {
    return this.customers.remove(id);
  }
}
