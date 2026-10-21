import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';
import { IntIdPipe } from '../common/pipes/id.pipes.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto.js';
import { OrdersService } from './orders.service.js';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Riwayat order (filter from/to WIB inklusif, customer_id)' })
  list(@Query() query: ListOrdersQueryDto) {
    return this.orders.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail order beserta item' })
  findOne(@Param('id', new IntIdPipe('Pesanan tidak ditemukan')) id: number) {
    return this.orders.findOne(id);
  }

  @Post()
  @ResponseMessage('Pesanan berhasil dibuat')
  @ApiOperation({
    summary: 'Buat transaksi penjualan (atomik)',
    description:
      'Harga & total dihitung server. 409 jika stok kurang (errors["items.N.quantity"]), ' +
      '422 jika input / produk / pelanggan tidak valid. Gagal satu item = seluruh order batal.',
  })
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthUser) {
    return this.orders.create(dto, user.id);
  }
}
