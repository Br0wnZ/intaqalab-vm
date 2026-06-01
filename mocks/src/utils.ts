/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';
import * as path from 'path';

import type { PaginatedApiResponse, RequestPaginationParams } from './utils.model';

/**
 *
 * @param fixturePath  relative path to src/
 * @param fixtureName file name extension included.
 * @returns file content of the fixture.
 */
export function getFixture<T = any>(fixturePath: string, fixtureName: string): T {
  const fixturePath2 = path.join(__dirname, ...fixturePath.split('/'));
  const fullFilePath = `${fixturePath2}${path.sep}${fixtureName}`;
  const content = fs.readFileSync(fullFilePath, { encoding: 'utf8' });
  return JSON.parse(content) as T;
}

export function dateStr(date: Date = new Date()) {
  const pad = (n: number) => n.toString().padStart(2, '0');

  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}

export function paginate<T>(allData: T[], params: RequestPaginationParams): PaginatedApiResponse<T> {
  const { pageSize, page } = params;
  const totalElements = allData.length;

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedData = allData.slice(startIndex, endIndex);

  return {
    page,
    pageSize,
    totalElements,
    items: paginatedData,
  };
}

export function searchableByName<T extends { name: string }, Q extends { name?: string }>(
  allData: T[],
  params: Q,
): T[] {
  if (params.name === undefined || params.name.trim() === '') {
    return allData;
  }
  const name = params.name?.toLocaleLowerCase();
  return allData.filter((e) => e.name.toLocaleLowerCase().includes(name));
}

export function searchableByExactCategory<T extends { category: string }, Q extends { category?: string }>(
  allData: T[],
  params: Q,
): T[] {
  if (params.category === undefined || params.category.trim() === '') {
    return allData;
  }
  const category = params.category;
  return allData.filter((e) => e.category === category);
}

export function getPagination(req: any): RequestPaginationParams {
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 25;
  return { page, pageSize };
}
