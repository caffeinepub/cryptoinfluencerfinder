import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";
import Migration "migration";

// Apply data migration on upgrade
(with migration = Migration.run)
actor {
  module Influencer {
    public func compareBySavedAt(a : Influencer, b : Influencer) : Order.Order {
      Int.compare(b.savedAt, a.savedAt);
    };
  };

  module SearchQuery {
    public func compareByCreatedAt(a : SearchQuery, b : SearchQuery) : Order.Order {
      Int.compare(b.createdAt, a.createdAt);
    };
  };

  type Influencer = {
    id : Text;
    handle : Text;
    followers : Nat;
    avgEngagement : Float;
    alignmentScore : Nat;
    niche : Text;
    exampleTweetUrls : [Text];
    savedAt : Int;
  };

  type SearchQuery = {
    id : Text;
    projectDescriptions : [Text];
    niches : [Text];
    minFollowers : Nat;
    minEngagement : Float;
    createdAt : Int;
  };

  public type UserProfile = {
    name : Text;
  };

  // Initialize access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Store influencers per user
  let userInfluencers = Map.empty<Principal, Map.Map<Text, Influencer>>();
  
  // Store search queries per user
  let userSearchQueries = Map.empty<Principal, Map.Map<Text, SearchQuery>>();

  // Store user profiles
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Stable X API token
  var xApiToken : ?Text = null;

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // X API token management
  public shared ({ caller }) func setXApiToken(token : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set X API token");
    };
    xApiToken := ?token;
  };

  public query ({ caller }) func getXApiTokenStatus() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can get token status");
    };
    switch (xApiToken) {
      case (?_) { true };
      case (null) { false };
    };
  };

  // HTTP outcall to X API
  public shared ({ caller }) func fetchXApiRaw(queryStr : Text) : async { #ok : Text; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can fetch X API");
    };

    switch (xApiToken) {
      case (null) { return #err("No X API token configured") };
      case (?token) {
        let url = "https://api.twitter.com/2/tweets/search/recent?query=" # queryStr # "&max_results=20&tweet.fields=public_metrics%2Cauthor_id%2Ccreated_at%2Ctext&expansions=author_id&user.fields=public_metrics%2Cdescription%2Cusername%2Cname";
        let headers = [{ name = "Authorization"; value = "Bearer " # token }];
        try {
          let response = await OutCall.httpGetRequest(url, headers, transform);
          #ok(response);
        } catch (error) {
          #err("HTTP outcall failed: " # error.message());
        };
      };
    };
  };

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Helper to get or create user's influencer map
  private func getUserInfluencerMap(user : Principal) : Map.Map<Text, Influencer> {
    switch (userInfluencers.get(user)) {
      case (?map) { map };
      case (null) {
        let newMap = Map.empty<Text, Influencer>();
        userInfluencers.add(user, newMap);
        newMap;
      };
    };
  };

  // Helper to get or create user's search query map
  private func getUserSearchQueryMap(user : Principal) : Map.Map<Text, SearchQuery> {
    switch (userSearchQueries.get(user)) {
      case (?map) { map };
      case (null) {
        let newMap = Map.empty<Text, SearchQuery>();
        userSearchQueries.add(user, newMap);
        newMap;
      };
    };
  };

  // Influencer management
  public shared ({ caller }) func saveInfluencer(influencer : Influencer) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save influencers");
    };

    let updatedInfluencer : Influencer = {
      id = influencer.id;
      handle = influencer.handle;
      followers = influencer.followers;
      avgEngagement = influencer.avgEngagement;
      alignmentScore = influencer.alignmentScore;
      niche = influencer.niche;
      exampleTweetUrls = influencer.exampleTweetUrls;
      savedAt = Time.now();
    };
    
    let userMap = getUserInfluencerMap(caller);
    userMap.add(influencer.id, updatedInfluencer);
  };

  public query ({ caller }) func getSavedInfluencers() : async [Influencer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view saved influencers");
    };

    let userMap = getUserInfluencerMap(caller);
    userMap.values().toArray().sort(Influencer.compareBySavedAt);
  };

  public shared ({ caller }) func removeInfluencer(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove influencers");
    };

    let userMap = getUserInfluencerMap(caller);
    switch (userMap.get(id)) {
      case (null) { Runtime.trap("Influencer not found") };
      case (?_) {
        userMap.remove(id);
      };
    };
  };

  // Search query management
  public shared ({ caller }) func saveSearchQuery(searchQuery : SearchQuery) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save search queries");
    };

    let updatedQuery : SearchQuery = {
      id = searchQuery.id;
      projectDescriptions = searchQuery.projectDescriptions;
      niches = searchQuery.niches;
      minFollowers = searchQuery.minFollowers;
      minEngagement = searchQuery.minEngagement;
      createdAt = Time.now();
    };
    
    let userMap = getUserSearchQueryMap(caller);
    userMap.add(searchQuery.id, updatedQuery);
  };

  public query ({ caller }) func getSearchHistory() : async [SearchQuery] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view search history");
    };

    let userMap = getUserSearchQueryMap(caller);
    let orderedSearches = userMap.values().toArray().sort(SearchQuery.compareByCreatedAt);
    orderedSearches.sliceToArray(0, Int.min(20, orderedSearches.size()));
  };
};
