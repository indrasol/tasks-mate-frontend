export interface Organization {
    name: string;
    project_count: number;
    member_count: number;
    description: string;
    designation: string;
    role: string;
    org_id: string; // Organization ID is required
    created_by: string; // Username of creator
    created_at?: string; // Creation date as ISO string
    is_invite?: boolean; // Optional field to indicate if this is an invite
    invitation_id?: string; // Optional field for invitation ID if this is an invite
}

export interface OrganizationInvitation {
  id: string;
  org_id: string;
  org_name: string;
  role: string;
  invited_by: string;
  invited_at: string;
  email: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export type BackendOrg = {
    org_id: string;
    name: string;
    plan?: string;
    billing_email?: string;
    project_count?: number;
    member_count?: number;
    description?: string;
    designation?: string;
    role?: string;
    created_by?: string;
    created_at?: string;
};


export type BackendOrgMember = {
    // user_id: UUID = Field(..., description="User ID (UUID)", example="b3c1e2d4-1234-5678-9abc-def012345678")
    // org_id: str = Field(..., description="Organization ID (UUID)", example="a1b2c3d4-5678-1234-9abc-def012345678")
    // designation: Optional[str] = Field(None, description="Designation ID (UUID)", example="d1e2f3g4-5678-1234-9abc-def012345678")
    // role: Optional[str] = Field(None, description="Role ID (UUID)", example="r1e2f3g4-5678-1234-9abc-def012345678")
    // invited_by: Optional[str] = Field(None, description="Inviter's User ID (UUID)", example="b3c1e2d4-1234-5678-9abc-def012345678")
    // is_active: Optional[bool] = Field(True, description="Is the member active?", example=True)
    // invited_at: Optional[datetime] = Field(None, description="When the invite was sent")
    // accepted_at: Optional[datetime] = Field(None, description="When the invite was accepted")
    // updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    // deleted_at: Optional[datetime] = Field(None, description="When the member was deleted")
    // delete_reason: Optional[str] = Field(None, description="Reason for deletion")
    // deleted_by: Optional[str] = Field(None, description="Who deleted the member")
    id?:string; // Unique identifier for the member
    user_id: string; // User ID (UUID)
    org_id: string; // Organization ID (UUID) 
    email:string;
    designation?: string; // Designation ID (UUID)
    role?: string; // Role ID (UUID)
    invited_by?: string; // Inviter's User ID (UUID)
    is_active?: boolean; // Is the member active?
    invited_at?: string; // When the invite was sent (ISO date string)
    accepted_at?: string; // When the invite was accepted (ISO date string)
    updated_at?: string; // Last update timestamp (ISO date string)
    deleted_at?: string; // When the member was deleted (ISO date string)
    delete_reason?: string; // Reason for deletion
    deleted_by?: string; // Who deleted the member

};

export type OrgMember = {
    id: string; // Unique identifier for the member
    email: string; // Username of the member
    role: string; // Role of the member in the organization
    designation?: string; // Designation of the member, optional
    project_count?: number; // Number of projects the member is associated with, optional
    joined_at?: string; // Date when the member joined the organization, optional
};


export type BackendOrgMemberInvite = {
    // user_id: UUID = Field(..., description="User ID (UUID)", example="b3c1e2d4-1234-5678-9abc-def012345678")
    // org_id: str = Field(..., description="Organization ID (UUID)", example="a1b2c3d4-5678-1234-9abc-def012345678")
    // designation: Optional[str] = Field(None, description="Designation ID (UUID)", example="d1e2f3g4-5678-1234-9abc-def012345678")
    // role: Optional[str] = Field(None, description="Role ID (UUID)", example="r1e2f3g4-5678-1234-9abc-def012345678")
    // invited_by: Optional[str] = Field(None, description="Inviter's User ID (UUID)", example="b3c1e2d4-1234-5678-9abc-def012345678")
    // is_active: Optional[bool] = Field(True, description="Is the member active?", example=True)
    // invited_at: Optional[datetime] = Field(None, description="When the invite was sent")
    // accepted_at: Optional[datetime] = Field(None, description="When the invite was accepted")
    // updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    // deleted_at: Optional[datetime] = Field(None, description="When the member was deleted")
    // delete_reason: Optional[str] = Field(None, description="Reason for deletion")
    // deleted_by: Optional[str] = Field(None, description="Who deleted the member")
    id?:string; // Unique identifier for the member
    email: string; // User ID (UUID)
    org_id: string; // Organization ID (UUID) 
    designation?: string; // Designation ID (UUID)
    role?: string; // Role ID (UUID)
    invited_by?: string; // Inviter's User ID (UUID)
    invited_status?: string; // Inviter's User ID (UUID)
    is_cancelled?: boolean; // Is the member active?
    sent_at?: string; // When the invite was sent (ISO date string)
    expires_at?: string; // When the invite was sent (ISO date string)
    cancel_date?: string; // When the invite was sent (ISO date string)
    created_at?: string; // When the invite was accepted (ISO date string)
    updated_at?: string; // Last update timestamp (ISO date string)
    accepted_at?: string; // When the member was deleted (ISO date string)
    accepted_by?: string; // Who deleted the member
};

export type OrgMemberInvite = {
    id: string; // Unique identifier for the member
    email: string; // Username of the member
    role: string; // Role of the member in the organization
    designation?: string; // Designation of the member, optional
    sent_at?: string; // Date when the member joined the organization, optional
};



