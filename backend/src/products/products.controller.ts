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
import { IntIdPipe } from '../common/pipes/id.pipes.js';
import { ListProductsQueryDto } from './dto/list-products-query.dto.js';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto.js';
import { ProductsService } from './products.service.js';

const ProductId = () => Param('id', new IntIdPipe('Produk tidak ditemukan'));

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List produk aktif (pagination, search nama/kode, sort)' })
  list(@Query() query: ListProductsQueryDto) {
    return this.products.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail produk' })
  findOne(@ProductId() id: number) {
    return this.products.findOne(id);
  }

  @Post()
  @ResponseMessage('Produk berhasil dibuat')
  @ApiOperation({ summary: 'Tambah produk (409 jika kode sudah dipakai)' })
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Put(':id')
  @ResponseMessage('Produk berhasil diperbarui')
  @ApiOperation({ summary: 'Update produk (payload lengkap)' })
  update(@ProductId() id: number, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete produk (riwayat order tetap utuh)' })
  remove(@ProductId() id: number): Promise<void> {
    return this.products.remove(id);
  }
}
