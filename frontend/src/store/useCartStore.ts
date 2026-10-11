import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  code: string;
  name: string;
  category?: string;
  image?: string;
  quantity: number;
  maxQuantity: number; // Available stock
  selectedItemIds?: string[]; // 使用者自選的器材個體編號清單
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (code: string) => void;
  updateQuantity: (code: string, quantity: number) => void;
  updateSelectedItems: (code: string, selectedItemIds: string[]) => void;
  clearCart: () => void;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const { items } = get();
        const existingItem = items.find((i) => i.code === newItem.code);

        if (existingItem) {
          // If already exists, merge selectedItemIds if provided
          let mergedSelectedIds: string[] | undefined = undefined;
          if (newItem.selectedItemIds && newItem.selectedItemIds.length > 0) {
            const existingIds = existingItem.selectedItemIds || [];
            mergedSelectedIds = Array.from(new Set([...existingIds, ...newItem.selectedItemIds]));
          }

          const newQty = mergedSelectedIds
            ? Math.min(mergedSelectedIds.length, newItem.maxQuantity)
            : Math.min(existingItem.quantity + newItem.quantity, newItem.maxQuantity);

          set({
            items: items.map((i) =>
              i.code === newItem.code
                ? {
                    ...i,
                    quantity: newQty,
                    selectedItemIds: mergedSelectedIds || i.selectedItemIds,
                  }
                : i,
            ),
          });
        } else {
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (code) => {
        set({ items: get().items.filter((i) => i.code !== code) });
      },

      updateQuantity: (code, quantity) => {
        set({
          items: get().items.map((i) => {
            if (i.code === code) {
              // Ensure quantity is at least 1 and at most maxQuantity
              const safeQty = Math.max(1, Math.min(quantity, i.maxQuantity));
              return { ...i, quantity: safeQty };
            }
            return i;
          }),
        });
      },

      updateSelectedItems: (code, selectedItemIds) => {
        set({
          items: get().items.map((i) => {
            if (i.code === code) {
              const safeQty = Math.max(1, Math.min(selectedItemIds.length, i.maxQuantity));
              return { ...i, selectedItemIds, quantity: safeQty };
            }
            return i;
          }),
        });
      },

      clearCart: () => set({ items: [] }),

      itemCount: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),
    }),
    {
      name: "equipment-cart-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
