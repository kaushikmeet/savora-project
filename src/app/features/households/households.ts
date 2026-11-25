import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';



import {
  Household,
  HouseholdInvitationResponse,
  HouseholdMember,
}  from '../../core/models/household.model';
import { HouseholdService } from '../../core/services/household.service';

@Component({
  selector: 'app-households',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './households.html',
})
export class Households {
  private readonly householdService = inject(HouseholdService);

  households = signal<HouseholdMember[]>([]);
  selectedHousehold = signal<Household | null>(null);
  members = signal<HouseholdMember[]>([]);
  invitations = signal<HouseholdInvitationResponse[]>([]);

  loading = signal(false);
  submitting = signal(false);

  error = signal('');
  success = signal('');

  householdName = '';
  householdDescription = '';

  inviteEmail = '';

  showCreateForm = false;
  showInviteForm = false;

  constructor() {
    this.loadHouseholds();
  }

  loadHouseholds(): void {
  this.loading.set(true);
  this.error.set('');

  this.householdService.getHouseholds().subscribe({
    next: (households: HouseholdMember[]) => {
      this.households.set(households);

      if (households.length > 0) {
        this.selectHousehold(households[0]);
      } else {
        this.selectedHousehold.set(null);
        this.members.set([]);
      }

      this.loading.set(false);
    },
    error: (err) => {
      this.error.set(
        err.error?.message || 'Failed to load households.',
      );
      this.loading.set(false);
    },
  });
}

  selectHousehold(member: HouseholdMember): void {
    const household = member.household;
    this.selectedHousehold.set(household);
    this.loadMembers(household.id);
    this.loadInvitations();
  }

  loadMembers(householdId: string): void {
    this.householdService.getMembers(householdId).subscribe({
      next: (members) => {
        this.members.set(members);
      },
      error: (err) => {
        this.error.set(
          err.error?.message || 'Failed to load household members.',
        );
      },
    });
  }

  createHousehold(): void {
  const name = this.householdName.trim();

  if (!name) {
    this.error.set('Household name is required.');
    return;
  }

  this.submitting.set(true);
  this.error.set('');
  this.success.set('');

  this.householdService.createHousehold({
    name,
    description: this.householdDescription.trim() || undefined,
  }).subscribe({
    next: () => {
      this.householdName = '';
      this.householdDescription = '';
      this.showCreateForm = false;
      this.submitting.set(false);

      this.success.set('Household created successfully.');
      this.loadHouseholds();
    },
    error: (err) => {
      this.error.set(
        err.error?.message || 'Failed to create household.',
      );
      this.submitting.set(false);
    },
  });
}

loadInvitations(): void {
  const household = this.selectedHousehold();

  if (!household) {
    this.invitations.set([]);
    return;
  }

  this.householdService.getInvitations(household.id).subscribe({
    next: (invitations) => {
      this.invitations.set(invitations);
    },
    error: (err) => {
      this.error.set(
        err.error?.message || 'Failed to load invitations.',
      );
    },
  });
}

  inviteMember(): void {
  const email = this.inviteEmail.trim().toLowerCase();
  const household = this.selectedHousehold();

  if (!household) {
    this.error.set('Please select a household.');
    return;
  }

  if (!email || !this.isValidEmail(email)) {
    this.error.set('Please enter a valid email address.');
    return;
  }

  this.submitting.set(true);
  this.error.set('');
  this.success.set('');

  this.householdService.inviteMember(household.id, { email }).subscribe({
    next: (response) => {
      this.inviteEmail = '';
      this.showInviteForm = false;
      this.submitting.set(false);

      this.success.set(
        `Invitation sent to ${response.email}.`,
      );

      // Reload pending invitations if you have implemented that API.
      this.loadInvitations();
    },
    error: (err) => {
      this.error.set(
        err.error?.message || 'Failed to send invitation.',
      );
      this.submitting.set(false);
    },
  });
}

  removeMember(member: HouseholdMember): void {
    const household = this.selectedHousehold();

    if (!household) {
      return;
    }

    if (!confirm('Remove this member from the household?')) {
      return;
    }

    this.error.set('');
    this.success.set('');

    this.householdService
      .removeMember(household.id, member.id)
      .subscribe({
        next: () => {
          this.success.set('Member removed successfully.');
          this.loadMembers(household.id);
        },
        error: (err) => {
          this.error.set(
            err.error?.message || 'Failed to remove member.',
          );
        },
      });
  }

  leaveHousehold(): void {
    const household = this.selectedHousehold();

    if (!household) {
      return;
    }

    if (!confirm('Are you sure you want to leave this household?')) {
      return;
    }

    this.householdService.leaveHousehold(household.id).subscribe({
      next: () => {
        this.success.set('You left the household.');
        this.loadHouseholds();
      },
      error: (err) => {
        this.error.set(
          err.error?.message || 'Failed to leave household.',
        );
      },
    });
  }

  isOwner(member: HouseholdMember): boolean {
    return member.role === 'OWNER';
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  memberName(member: HouseholdMember): string {
    return member.user?.fullName
      || member.invitedEmail
      || 'Invited member';
  }

  memberEmail(member: HouseholdMember): string {
    return member.user?.email
      || member.invitedEmail
      || '';
  }

  memberInitials(member: HouseholdMember): string {
    return this.memberName(member)
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  onHouseholdChange(householdId: string): void {
    const household = this.households().find(
      (h) => h.id === householdId,
    );

    if (household) {
      this.selectHousehold(household);
    }
  }

  clearMessages(): void {
    this.error.set('');
    this.success.set('');
  }

  revokeInvitation(invitationId: string): void {
  const household = this.selectedHousehold();

  if (!household) return;

  this.householdService
    .revokeInvitation(household.id, invitationId)
    .subscribe({
      next: () => {
        this.success.set('Invitation revoked successfully.');
        this.loadInvitations();
      },
      error: (err) => {
        this.error.set(
          err.error?.message || 'Failed to revoke invitation.',
        );
      },
    });
}
}