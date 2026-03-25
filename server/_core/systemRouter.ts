import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./trpc";
import { addSubscription, removeSubscription, VAPID_PUBLIC_KEY } from "../webpush";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  // Web Push: obter chave pública VAPID
  vapidPublicKey: publicProcedure.query(() => ({
    key: VAPID_PUBLIC_KEY,
  })),

  // Web Push: registrar subscription
  subscribePush: protectedProcedure
    .input(z.object({
      endpoint: z.string().url(),
      p256dh: z.string(),
      auth: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      addSubscription(String(ctx.user.id), {
        endpoint: input.endpoint,
        keys: { p256dh: input.p256dh, auth: input.auth },
      });
      return { success: true };
    }),

  // Web Push: remover subscription
  unsubscribePush: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ ctx, input }) => {
      removeSubscription(String(ctx.user.id), input.endpoint);
      return { success: true };
    }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
