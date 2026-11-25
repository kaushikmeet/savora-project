import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { list } from 'postcss';
import { ShoppingListsService } from '../../../core/services/shopping-lists.service';
import { ShoppingList } from '../../../core/models/shopping-list.model';
import { HouseholdService } from '../../../core/services/household.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { Household } from '../../../core/models/household.model';


@Component({
  selector: 'app-shopping-lists',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './shopping-lists.html',
  styleUrl: './shopping-lists.css',
})
export class ShoppingLists {
  private readonly service = inject(ShoppingListsService);
  private readonly fb = inject(FormBuilder);
  private readonly householdService = inject(HouseholdService);
  private readonly catalogService = inject(CatalogService);
  readonly households = signal<Household[]>([]);
  readonly householdsLoading = signal(false);

  readonly lists = signal<ShoppingList[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly showForm = signal(false);
  readonly editingList = signal<ShoppingList | null>(null);

  readonly activeLists = computed(() =>
    this.lists().filter((list) => list.status === 'ACTIVE'),
  );

  readonly completedLists = computed(() =>
    this.lists().filter((list) => list.status === 'COMPLETED'),
  );

  readonly form = this.fb.nonNullable.group({
    householdId: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', Validators.maxLength(500)],
  });

ngOnInit(): void {
  this.loadHouseholds();
  this.loadLists();
}

loadLists():void{
 this.loading.set(true);
 this.error.set('');
 
 this.service.getLists().subscribe({
  next:(lists)=>{
    this.lists.set(lists);
    this.loading.set(false);
  },
  error:(err)=>{
    this.error.set(
      err?.error?.message || 'Unbale to load shopping list.'
    );
  },
 });
}

openCreateForm():void{
  this.editingList.set(null);
  this.form.reset({
    householdId: this.households()[0]?.id ?? '',
    name:'',
    description:''
  });
  this.showForm.set(true);  
}

openEditForm(list: ShoppingList):void{
  this.editingList.set(list);
  this.form.reset({
    householdId: list.householdId,
    name: list.name,
    description:list.description ?? ''
  });
  this.showForm.set(true);
}

closeForm():void{
  this.showForm.set(false);
  this.editingList.set(null);
  this.form.reset();
}

saveList():void{
  if(this.form.invalid || this.saving()){
    this.form.markAllAsTouched();
    return;
  }
  const value = this.form.getRawValue();
  const editing = this.editingList();
  this.saving.set(true);
  this.error.set('');

  const request = editing ? this.service.updateList(editing.id,{
    name: value.name.trim(),
    description: value.description.trim() || null
  }):
  this.service.createList({
    householdId: value.householdId,
    name: value.name.trim(),
    description: value.description.trim() || undefined
  });
  request.subscribe({
    next:()=>{
      this.saving.set(false);
      this.closeForm();
      this.loadLists();
    },
    error:(err)=>{
      this.error.set(
        err?.error?.message || 'Unable to save shopping list.'
      );
      this.saving.set(false);
    },
  });
}

completeList(list: ShoppingList):void{
  if(!confirm(`Mark "${list.name}" as completed?`)) return;
  this.service.updateList(list.id,{
    status: 'COMPLETED',
  }).subscribe({
    next:()=>{
      this.loadLists();
    },
    error:(err)=>{
      this.error.set(
        err?.error?.message || 'Unable to complete list.',
      );
    },
  });
}

deleteList(list: ShoppingList):void{
     if (!confirm(`Delete "${list.name}" and all its items?`)) return;

    this.service.deleteList(list.id).subscribe({
      next: () => this.loadLists(),
      error: (err) =>
        this.error.set(
          err?.error?.message || 'Unable to delete list.',
        ),
    });
}

getItemCount(list: ShoppingList):number{
  return list.items?.length ?? 0;
}

getPurchasedCount(list: ShoppingList):number{
  return list.items?.filter((item)=> item.isPurchased).length ?? 0;
}

loadHouseholds(): void {
  this.householdsLoading.set(true);

  this.householdService.getHouseholds().subscribe({
    next: (members) => {
      const activeHouseholds = members
        .filter(
          (member) =>
            member.status === 'ACTIVE' && !!member.household,
        )
        .map((member) => member.household);

      this.households.set(activeHouseholds);
      this.householdsLoading.set(false);

      // Preselect the first active household for a new list.
      if (
        activeHouseholds.length > 0 &&
        !this.editingList() &&
        !this.form.controls.householdId.value
      ) {
        this.form.controls.householdId.setValue(
          activeHouseholds[0].id,
        );
      }
    },
    error: () => {
      this.error.set('Unable to load your households.');
      this.householdsLoading.set(false);
    },
  });
}
}
