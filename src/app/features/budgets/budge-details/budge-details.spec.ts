import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgeDetails } from './budge-details';

describe('BudgeDetails', () => {
  let component: BudgeDetails;
  let fixture: ComponentFixture<BudgeDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgeDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BudgeDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
