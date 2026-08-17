import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CategoryService } from '../../../core/services/category.service';
import { TagService } from '../../../core/services/tag.service';

@Component({
    selector: 'app-category-subnav',
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './category-subnav.component.html',
    styleUrl: './category-subnav.component.scss',
})
export class CategorySubnavComponent implements OnInit {
    private readonly categoryService = inject(CategoryService);
    private readonly tagService = inject(TagService);

    readonly categoryCount = computed(() => this.categoryService.categories().length);
    readonly tagCount = computed(() => this.tagService.tags().length);

    ngOnInit(): void {
        if (!this.categoryService.categories().length) {
            this.categoryService.getCategories().subscribe({ error: () => {} });
        }
        if (!this.tagService.tags().length) {
            this.tagService.loadTags().subscribe({ error: () => {} });
        }
    }
}
