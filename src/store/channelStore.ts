// src/store/channelStore.ts
import { create } from "zustand";
import type { RunChannelEvent } from "../lib/types";
import { listRunChannelEvents, sendRunChannelMessage } from "../lib/api";

interface ChannelState {
    messagesByRunId: Record<string, RunChannelEvent[]>;
    lastTsByRunId: Record<string, number | null>;
    sendingByRunId: Record<string, boolean>;
    unreadByRunId: Record<string, number>;
    activeRunId: string | null;

    // Selectors
    getMessagesForRun: (runId?: string) => RunChannelEvent[];

    // Mutators
    appendMessages: (runId: string, events: RunChannelEvent[]) => void;
    resetMessages: (runId: string) => void;

    // Async actions
    fetchNewEvents: (runId: string) => Promise<void>;
    sendMessage: (runId: string, text: string) => Promise<void>;

    setActiveRunId: (runId: string | null) => void;
    markRead: (runId: string) => void;
    getUnreadForRun: (runId?: string) => number;

}

export const useChannelStore = create<ChannelState>((set, get) => ({
    messagesByRunId: {},
    lastTsByRunId: {},
    sendingByRunId: {},
    unreadByRunId: {},
    activeRunId: null,

    getMessagesForRun: (runId) => {
        if (!runId) return [];
        return get().messagesByRunId[runId] ?? [];
    },

    getUnreadForRun: (runId) => {
        if (!runId) return 0;
        return get().unreadByRunId[runId] ?? 0;
    },

    setActiveRunId: (runId) =>
        set((state) => ({
            activeRunId: runId,
            // if you want to auto-clear when we focus:
            unreadByRunId: runId
                ? { ...state.unreadByRunId, [runId]: 0 }
                : state.unreadByRunId,
        })),

    markRead: (runId) =>
        set((state) => ({
            unreadByRunId: {
                ...state.unreadByRunId,
                [runId]: 0,
            },
        })),

    appendMessages: (runId, events) =>
        set((state) => {
            if (!events.length) return state;

            const prev = state.messagesByRunId[runId] ?? [];
            const existingIds = new Set(prev.map((e) => e.id));
            const fresh = events.filter((e) => e.id && !existingIds.has(e.id));
            if (!fresh.length) return state;

            const merged = [...prev, ...fresh];

            const prevTs = state.lastTsByRunId[runId] ?? 0;
            const maxTs = merged.reduce(
                (acc, ev) => (ev.ts != null ? Math.max(acc, ev.ts) : acc),
                prevTs
            );

            // 🔔 count non-user fresh events as "unread" if this run is not active
            const isActive = state.activeRunId === runId;
            const nonUserFresh = fresh.filter((ev) => ev.type !== "user.message");
            const addUnread = isActive ? 0 : nonUserFresh.length;
            const currentUnread = state.unreadByRunId[runId] ?? 0;

            return {
                messagesByRunId: {
                    ...state.messagesByRunId,
                    [runId]: merged,
                },
                lastTsByRunId: {
                    ...state.lastTsByRunId,
                    [runId]: maxTs || prevTs || null,
                },
                unreadByRunId: {
                    ...state.unreadByRunId,
                    [runId]: currentUnread + addUnread,
                },
            };
        }),

    resetMessages: (runId) =>
        set((state) => ({
            messagesByRunId: {
                ...state.messagesByRunId,
                [runId]: [],
            },
            lastTsByRunId: {
                ...state.lastTsByRunId,
                [runId]: null,
            },
            unreadByRunId: {
                ...state.unreadByRunId,
                [runId]: 0,
            },
        })),


    fetchNewEvents: async (runId: string) => {
        const { lastTsByRunId, appendMessages } = get();
        const sinceTs = lastTsByRunId[runId] ?? undefined;

        try {
            const events = await listRunChannelEvents(runId, sinceTs);
            if (events && events.length) {
                appendMessages(runId, events);
            }
        } catch (err) {
            console.error("Failed to fetch channel events for run", runId, err);
        }
    },

    sendMessage: async (runId: string, text: string) => {
        if (!text.trim()) return;
        const { sendingByRunId } = get();
        if (sendingByRunId[runId]) return;

        set((state) => ({
            sendingByRunId: {
                ...state.sendingByRunId,
                [runId]: true,
            },
        }));

        try {
            await sendRunChannelMessage(runId, { text });
            // We *could* optimistically insert a "user" message here if we want.
            // For now we rely on backend logging inbound messages if/when you add that.
        } catch (err) {
            console.error("Failed to send channel message for run", runId, err);
        } finally {
            set((state) => ({
                sendingByRunId: {
                    ...state.sendingByRunId,
                    [runId]: false,
                },
            }));
        }
    },
}));
