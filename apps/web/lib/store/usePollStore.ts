"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FamilyPoll, PollVote } from "@/lib/types";

interface PollState {
  activePoll: FamilyPoll | null;
  polls: FamilyPoll[];
  votes: PollVote[];

  loadActivePoll: (poll: FamilyPoll | null) => void;
  loadPolls: (polls: FamilyPoll[]) => void;
  loadVotes: (votes: PollVote[]) => void;
  addPoll: (poll: FamilyPoll) => void;
  castVoteLocal: (vote: PollVote) => void;
  closePollLocal: (pollId: string, result: string | null) => void;
  cancelPollLocal: (pollId: string) => void;
}

export const usePollStore = create<PollState>()(
  persist(
    (set) => ({
      activePoll: null,
      polls: [],
      votes: [],

      loadActivePoll: (activePoll) => set({ activePoll }),

      loadPolls: (polls) => set({ polls }),

      loadVotes: (votes) => set({ votes }),

      addPoll: (poll) =>
        set((s) => ({
          polls: [poll, ...s.polls],
          activePoll: poll.status === "active" ? poll : s.activePoll,
        })),

      castVoteLocal: (vote) =>
        set((s) => ({
          votes: [
            ...s.votes.filter(
              (v) => !(v.pollId === vote.pollId && v.profileId === vote.profileId)
            ),
            vote,
          ],
        })),

      closePollLocal: (pollId, result) =>
        set((s) => ({
          activePoll: s.activePoll?.id === pollId ? null : s.activePoll,
          polls: s.polls.map((p) =>
            p.id === pollId
              ? { ...p, status: "closed" as const, result: result ?? undefined, closedAt: new Date().toISOString() }
              : p
          ),
        })),

      cancelPollLocal: (pollId) =>
        set((s) => ({
          activePoll: s.activePoll?.id === pollId ? null : s.activePoll,
          polls: s.polls.map((p) =>
            p.id === pollId
              ? { ...p, status: "cancelled" as const, closedAt: new Date().toISOString() }
              : p
          ),
        })),
    }),
    {
      name: "family-rewards-poll-store",
      partialize: (state) => ({
        activePoll: state.activePoll,
      }),
    }
  )
);
