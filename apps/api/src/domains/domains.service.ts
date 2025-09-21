import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type DomainResponse = { id: string; name: string; slug: string };

@Injectable()
export class DomainsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<DomainResponse[]> {
    const domains = await this.prisma.domain.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
    return domains;
  }

  async findById(id: string): Promise<DomainResponse> {
    const domain = await this.prisma.domain.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    });
    if (!domain) throw new NotFoundException('Domain not found');
    return domain;
  }
}
