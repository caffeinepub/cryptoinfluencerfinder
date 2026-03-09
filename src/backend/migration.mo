import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Int "mo:core/Int";

module {
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

  type UserProfile = {
    name : Text;
  };

  type OldActor = {
    userInfluencers : Map.Map<Principal, Map.Map<Text, Influencer>>;
    userSearchQueries : Map.Map<Principal, Map.Map<Text, SearchQuery>>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  public func run(old : OldActor) : OldActor {
    old;
  };
};
