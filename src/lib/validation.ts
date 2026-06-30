import { z } from "zod";

export const outcomeSchema = z.enum(["HOME_TEAM", "DRAW", "AWAY_TEAM"]);

export const predictionInputSchema = z.object({
  matchId: z.string().min(1, "matchId is required"),
  pickedTeam: outcomeSchema,
});

export const championPickInputSchema = z.object({
  team: z.string().min(1, "team is required").max(60),
});

export const adminMatchEditSchema = z.object({
  matchId: z.string().min(1),
  winner: z.union([outcomeSchema, z.null()]).optional(),
  homeScore: z.union([z.number().int().min(0), z.null()]).optional(),
  awayScore: z.union([z.number().int().min(0), z.null()]).optional(),
  homePenalties: z.union([z.number().int().min(0), z.null()]).optional(),
  awayPenalties: z.union([z.number().int().min(0), z.null()]).optional(),
  status: z
    .enum([
      "SCHEDULED",
      "TIMED",
      "IN_PLAY",
      "PAUSED",
      "FINISHED",
      "SUSPENDED",
      "POSTPONED",
      "CANCELLED",
    ])
    .optional(),
});

export const adminChampionEditSchema = z.object({
  uid: z.string().min(1),
  team: z.union([z.string().min(1).max(60), z.null()]),
});

export const adminDeleteUserSchema = z.object({
  uid: z.string().min(1),
});

export type PredictionInput = z.infer<typeof predictionInputSchema>;
export type ChampionPickInput = z.infer<typeof championPickInputSchema>;
export type AdminMatchEdit = z.infer<typeof adminMatchEditSchema>;
export type AdminChampionEdit = z.infer<typeof adminChampionEditSchema>;
export type AdminDeleteUser = z.infer<typeof adminDeleteUserSchema>;
