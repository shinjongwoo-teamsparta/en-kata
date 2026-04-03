import { z } from "zod";
import shortCodeData from "@en-kata/core/data/short-codes.json";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { kysely } from "~/server/db";

const shortCodeLanguages = Object.keys(shortCodeData) as [string, ...string[]];

export const gameResultRouter = createTRPCRouter({
  save: protectedProcedure
    .input(
      z.object({
        mode: z.enum(["word", "phrase", "code", "paragraph"]),
        difficulty: z.enum(["easy", "medium", "hard"]),
        duration: z.number().int().positive(),
        language: z.enum(shortCodeLanguages).optional(),
        wpm: z.number().int().min(0),
        cpm: z.number().int().min(0),
        accuracy: z.number().min(0).max(100),
        totalChars: z.number().int().min(0),
        correctChars: z.number().int().min(0),
        totalWords: z.number().int().min(0),
        completedWords: z.number().int().min(0),
        mistakeMap: z.record(z.string(), z.number()),
        wpmTimeline: z.array(
          z.object({ second: z.number(), wpm: z.number() }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id as string;
      return ctx.db.gameResult.create({
        data: {
          userId,
          ...input,
        },
      });
    }),

  // Get user's recent results
  getRecent: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id as string;
      return ctx.db.gameResult.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  // Get stats for dashboard
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id as string;

    // Best WPM per mode
    const bestByMode = await ctx.db.gameResult.groupBy({
      by: ["mode"],
      where: { userId },
      _max: { wpm: true },
      _count: true,
    });

    // Recent 30 days results for trend chart
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentResults = await ctx.db.gameResult.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        mode: true,
        wpm: true,
        accuracy: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Overall stats
    const overall = await ctx.db.gameResult.aggregate({
      where: { userId },
      _avg: { wpm: true, accuracy: true },
      _max: { wpm: true },
      _count: true,
    });

    return {
      bestByMode,
      recentResults,
      overall: {
        avgWpm: Math.round(overall._avg.wpm ?? 0),
        avgAccuracy: Math.round(overall._avg.accuracy ?? 0),
        bestWpm: overall._max.wpm ?? 0,
        totalGames: overall._count,
      },
    };
  }),

  // Leaderboard: top scores per mode/difficulty/duration
  getLeaderboard: publicProcedure
    .input(
      z.object({
        mode: z.enum(["word", "phrase", "code", "paragraph"]),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        duration: z.number().int().positive().optional(),
        period: z.enum(["all", "week", "month"]).default("all"),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ input }) => {
      // Best WPM per user via DISTINCT ON, sorted and limited in DB
      let query = kysely
        .selectFrom("game_results as gr")
        .innerJoin("users as u", "u.id", "gr.user_id")
        .where("gr.mode", "=", input.mode)
        .distinctOn("gr.user_id")
        .orderBy("gr.user_id")
        .orderBy("gr.wpm", "desc")
        .select([
          "gr.id",
          "gr.user_id as userId",
          "gr.wpm",
          "gr.cpm",
          "gr.accuracy",
          "gr.completed_words as completedWords",
          "gr.duration",
          "gr.difficulty",
          "gr.created_at as createdAt",
          "u.name as userName",
          "u.image as userImage",
        ]);

      if (input.difficulty) {
        query = query.where("gr.difficulty", "=", input.difficulty);
      }
      if (input.duration) {
        query = query.where("gr.duration", "=", input.duration);
      }
      if (input.period !== "all") {
        const since = new Date();
        if (input.period === "week") since.setDate(since.getDate() - 7);
        else since.setDate(since.getDate() - 30);
        query = query.where("gr.created_at", ">=", since);
      }

      // Wrap to re-sort by wpm DESC and apply limit
      const ranked = await kysely
        .selectFrom(query.as("best"))
        .selectAll()
        .orderBy("wpm", "desc")
        .limit(input.limit)
        .execute();

      return ranked.map((r, i) => ({
        rank: i + 1,
        userId: r.userId,
        userName: r.userName ?? "Anonymous",
        userImage: r.userImage,
        wpm: r.wpm,
        cpm: r.cpm,
        accuracy: r.accuracy,
        completedWords: r.completedWords,
        duration: r.duration,
        difficulty: r.difficulty,
        createdAt: r.createdAt,
      }));
    }),
});
