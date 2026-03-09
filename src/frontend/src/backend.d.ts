import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface SearchQuery {
    id: string;
    createdAt: bigint;
    niches: Array<string>;
    minEngagement: number;
    minFollowers: bigint;
    projectDescriptions: Array<string>;
}
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
export interface http_header {
    value: string;
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    fetchXApiRaw(queryStr: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getSavedInfluencers(): Promise<Array<Influencer>>;
    getSearchHistory(): Promise<Array<SearchQuery>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getXApiTokenStatus(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    removeInfluencer(id: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveInfluencer(influencer: Influencer): Promise<void>;
    saveSearchQuery(searchQuery: SearchQuery): Promise<void>;
    setXApiToken(token: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
