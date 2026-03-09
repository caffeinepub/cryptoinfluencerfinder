import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Influencer {
    id: string;
    alignmentScore: bigint;
    avgEngagement: number;
    exampleTweetUrls: Array<string>;
    niche: string;
    savedAt: bigint;
    handle: string;
    followers: bigint;
}
export interface UserProfile {
    name: string;
}
export interface SearchQuery {
    id: string;
    createdAt: bigint;
    niches: Array<string>;
    minEngagement: number;
    minFollowers: bigint;
    projectDescriptions: Array<string>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getSavedInfluencers(): Promise<Array<Influencer>>;
    getSearchHistory(): Promise<Array<SearchQuery>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removeInfluencer(id: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveInfluencer(influencer: Influencer): Promise<void>;
    saveSearchQuery(searchQuery: SearchQuery): Promise<void>;
}
