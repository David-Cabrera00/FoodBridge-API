import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './interfaces/category.interface';

@Controller('categories')
export class CategoriesController {
  private categories: Category[] = [];

  @Get()
  findAll(): Category[] {
    return this.categories;
  }

  @Get(':id')
  findOne(@Param('id') id: string): Category | undefined {
    return this.categories.find((category) => category.id === id);
  }

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    const newCategory: Category = {
      id: Date.now().toString(),
      ...createCategoryDto,
    };

    this.categories.push(newCategory);

    return newCategory;
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = this.categories.find((item) => item.id === id);

    if (!category) {
      return {
        message: 'Category not found',
      };
    }

    Object.assign(category, updateCategoryDto);

    return category;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const index = this.categories.findIndex((category) => category.id === id);

    if (index === -1) {
      return {
        message: 'Category not found',
      };
    }

    const deletedCategory = this.categories.splice(index, 1);

    return deletedCategory[0];
  }
}
