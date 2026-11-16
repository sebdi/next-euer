"use server";

import { getAuthorizedUser } from "@/lib/auth/session";
import { actionError, type ActionResult } from "@/lib/action-result";
import { getDistanceProvider, DistanceProviderError } from "@/lib/distance";
import { fahrtkostenCents, tripDistanceMeters } from "@/lib/distance/fare";
import { USER_ERROR, fieldErrorsFromZod, routeQuerySchema } from "@/lib/validation";

export async function calculateRouteAction(input: {
  origin: string;
  destination: string;
  rateCentsPerKm: number;
  roundTrip?: boolean;
}): Promise<
  ActionResult<{
    distanceMeters: number;
    amountCents: number;
    originLabel: string;
    destinationLabel: string;
    rateCentsPerKm: number;
    roundTrip: boolean;
  }>
> {
  const user = await getAuthorizedUser();
  if (!user) return actionError(USER_ERROR.unauthorized);

  const parsed = routeQuerySchema.safeParse(input);
  if (!parsed.success) {
    return actionError(USER_ERROR.validation, fieldErrorsFromZod(parsed.error));
  }

  try {
    const quote = await getDistanceProvider().distance({
      origin: parsed.data.origin,
      destination: parsed.data.destination,
    });
    const roundTrip = parsed.data.roundTrip;
    const amountCents = fahrtkostenCents(
      tripDistanceMeters(quote.distanceMeters, roundTrip),
      parsed.data.rateCentsPerKm,
    );
    return {
      ok: true,
      data: {
        distanceMeters: quote.distanceMeters,
        amountCents,
        originLabel: quote.originLabel,
        destinationLabel: quote.destinationLabel,
        rateCentsPerKm: parsed.data.rateCentsPerKm,
        roundTrip,
      },
    };
  } catch (error) {
    if (error instanceof DistanceProviderError) {
      return actionError(error.message);
    }
    return actionError("Die Entfernung konnte nicht berechnet werden.");
  }
}
