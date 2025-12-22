import { create } from "zustand";
import { persist } from "zustand/middleware";

// Username word lists
const ADJECTIVES = [
  "Confused",
  "Sleepy",
  "Happy",
  "Grumpy",
  "Silly",
  "Brave",
  "Clever",
  "Curious",
  "Daring",
  "Eager",
  "Fancy",
  "Gentle",
  "Hasty",
  "Jolly",
  "Kind",
  "Lively",
  "Merry",
  "Noble",
  "Peppy",
  "Quick",
  "Rapid",
  "Swift",
  "Tender",
  "Upbeat",
  "Vivid",
  "Witty",
  "Zesty",
  "Bouncy",
  "Calm",
  "Dizzy",
  "Fluffy",
  "Giddy",
  "Humble",
  "Icy",
  "Jazzy",
  "Keen",
  "Lucky",
  "Mighty",
  "Neat",
  "Odd",
  "Perky",
  "Quirky",
  "Rosy",
  "Snappy",
  "Tricky",
  "Unique",
  "Vibrant",
  "Wacky",
  "Youthful",
  "Zippy",
];

const PLANTS = [
  "Lily",
  "Rose",
  "Daisy",
  "Tulip",
  "Orchid",
  "Maple",
  "Oak",
  "Pine",
  "Fern",
  "Ivy",
  "Cactus",
  "Bamboo",
  "Cedar",
  "Elm",
  "Fig",
  "Ginger",
  "Holly",
  "Iris",
  "Jasmine",
  "Kale",
  "Lavender",
  "Mint",
  "Nettle",
  "Olive",
  "Palm",
  "Quince",
  "Reed",
  "Sage",
  "Thyme",
  "Umber",
  "Violet",
  "Willow",
  "Yarrow",
  "Zinnia",
  "Acacia",
  "Basil",
  "Clover",
  "Dill",
  "Eucalyptus",
  "Foxglove",
  "Gardenia",
  "Hibiscus",
  "Juniper",
  "Kumquat",
  "Lotus",
  "Magnolia",
  "Nutmeg",
  "Orchid",
  "Peony",
  "Rosemary",
];

function generateUsername() {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const plant = PLANTS[Math.floor(Math.random() * PLANTS.length)];
  const number = Math.floor(Math.random() * 1000) + 1;
  return `${adjective} ${plant} ${number}`;
}

function generateUserId() {
  return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const useUserStore = create(
  persist(
    (set, get) => ({
      // User identity
      userId: null,
      username: null,
      isAuthenticated: false,
      authUser: null,

      // Initialize user (call on app start)
      initUser: () => {
        const { userId, username } = get();
        if (!userId) {
          set({ userId: generateUserId() });
        }
        if (!username) {
          set({ username: generateUsername() });
        }
      },

      // Set username
      setUsername: (username) => {
        const trimmed = username.trim().slice(0, 30);
        if (trimmed.length >= 2) {
          set({ username: trimmed });
        }
      },

      // Generate new random username
      regenerateUsername: () => {
        set({ username: generateUsername() });
      },

      // Set authenticated user
      setAuthUser: (user) => {
        if (user) {
          set({
            isAuthenticated: true,
            authUser: user,
            userId: user.id,
            username:
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              get().username,
          });
        } else {
          set({
            isAuthenticated: false,
            authUser: null,
          });
        }
      },

      // Clear auth
      clearAuth: () => {
        set({
          isAuthenticated: false,
          authUser: null,
        });
      },
    }),
    {
      name: "triviamania-user",
      partialize: (state) => ({
        userId: state.userId,
        username: state.username,
      }),
    }
  )
);
