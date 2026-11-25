
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  Household,
  HouseholdMember,
  CreateHouseholdRequest,
  InviteMemberRequest,
  HouseholdInvitationResponse,
} from '../models/household.model';

@Injectable({
  providedIn: 'root',
})
export class HouseholdService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/households`;

  // GET /households
  // Returns household membership records with nested household.
  getHouseholds(): Observable<HouseholdMember[]> {
    return this.http.get<HouseholdMember[]>(this.apiUrl);
  }

  // POST /households
  // Returns the created household.
  createHousehold(
    dto: CreateHouseholdRequest,
  ): Observable<Household> {
    return this.http.post<Household>(this.apiUrl, dto);
  }

  // GET /households/:id
  getHousehold(id: string): Observable<Household> {
    return this.http.get<Household>(
      `${this.apiUrl}/${id}`,
    );
  }

  // GET /households/:id/members
  getMembers(id: string): Observable<HouseholdMember[]> {
    return this.http.get<HouseholdMember[]>(
      `${this.apiUrl}/${id}/members`,
    );
  }

  // POST /households/:id/invitations
  inviteMember(
    id: string,
    dto: InviteMemberRequest,
  ): Observable<HouseholdInvitationResponse> {
    return this.http.post<HouseholdInvitationResponse>(
      `${this.apiUrl}/${id}/invitations`,
      dto,
    );
  }

  // DELETE /households/:id/members/:memberId
  removeMember(
    householdId: string,
    memberId: string,
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${householdId}/members/${memberId}`,
    );
  }

  // POST /households/:id/leave
  // Keep this only if the NestJS leave endpoint exists.
  leaveHousehold(id: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/${id}/leave`,
      {},
    );
  }

  getInvitations(householdId: string): Observable<HouseholdInvitationResponse[]> {
  return this.http.get<HouseholdInvitationResponse[]>(
    `${this.apiUrl}/${householdId}/invitations`,
  );
}

revokeInvitation(
  householdId: string,
  invitationId: string,
): Observable<void> {
  return this.http.delete<void>(
    `${this.apiUrl}/${householdId}/invitations/${invitationId}`,
  );
}
}
