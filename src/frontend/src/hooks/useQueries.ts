import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Influencer, SearchQuery } from "../backend.d";
import { useActor } from "./useActor";

export function useGetSavedInfluencers() {
  const { actor, isFetching } = useActor();
  return useQuery<Influencer[]>({
    queryKey: ["savedInfluencers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSavedInfluencers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSearchHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<SearchQuery[]>({
    queryKey: ["searchHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSearchHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveInfluencer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (influencer: Influencer) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveInfluencer(influencer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedInfluencers"] });
      toast.success("Influencer saved");
    },
    onError: () => {
      toast.error("Failed to save influencer");
    },
  });
}

export function useRemoveInfluencer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.removeInfluencer(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedInfluencers"] });
      toast.success("Influencer removed");
    },
    onError: () => {
      toast.error("Failed to remove influencer");
    },
  });
}

export function useSaveSearchQuery() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (searchQuery: SearchQuery) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveSearchQuery(searchQuery);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["searchHistory"] });
    },
  });
}
