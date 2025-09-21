import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DomainsService } from './domains.service';

@ApiTags('Domains')
@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Get()
  @ApiOperation({ summary: 'List domains' })
  @ApiResponse({ status: 200, description: 'Return list of domains' })
  findAll() {
    return this.domainsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a domain by id' })
  @ApiResponse({ status: 200, description: 'Return domain' })
  findById(@Param('id') id: string) {
    return this.domainsService.findById(id);
  }
}
