import type { ActivityType, AIExplanation, AnalysisResult, ChatMessage } from "../types";

const ACTIVITY_LABEL: Record<ActivityType, string> = {
  hiking: "hiking",
  camping: "camping",
  fishing: "fishing",
  cycling: "cycling",
  beach: "beach activities",
  photography: "outdoor photography",
  traveling: "outdoor traveling",
  other: "outdoor activity"
};

const activityAdvice: Record<ActivityType, { tips: string[] }> = {
  hiking: {
    tips: [
      "Bring at least 2L of water per person and high-energy snacks",
      "Wear sturdy, broken-in hiking boots with good ankle support",
      "Check for trail closures or wildlife alerts in the area",
      "Carry a physical map and compass even if you use GPS",
      "Apply sunscreen every 2 hours even on cloudy days"
    ]
  },
  camping: {
    tips: [
      "Set up camp on high, level ground away from dry river beds",
      "Check local fire bans before starting any campfire",
      "Keep food secured in bear canisters or hanging bags",
      "Insulate sleeping bag with a thermal liner if temperatures drop",
      "Bring both rain fly and tarp for unexpected showers"
    ]
  },
  fishing: {
    tips: [
      "Check local fishing licenses and catch regulations first",
      "Wear polarized sunglasses to reduce surface glare",
      "Bring layered rain and wind protection (waterproof jacket",
      "Carry a first-aid kit including hook removal tools",
      "Tell someone your exact spot and expected return time"
    ]
  },
  cycling: {
    tips: [
      "Wear a properly fitted helmet on every ride",
      "Inflate tires and check brakes before leaving",
      "Carry a spare tube, patch kit, and multi-tool",
      "Use lights and reflectives for dawn/dusk riding",
      "Hydrate more than you think you need to"
    ]
  },
  beach: {
    tips: [
      "Apply reef-safe waterproof SPF 50+ every 80 minutes",
      "Check local rip current flags and swim conditions",
      "Stay hydrated — sun + wind dehydrate quickly",
      "Bring shade/umbrella for UV protection breaks",
      "Avoid swimming alone and watch children near water"
    ]
  },
  photography: {
    tips: [
      "Protect camera gear from sand, dust, and rain with sealed bags",
      "Shoot during golden hours for the best natural light",
      "Bring spare batteries kept warm in a pocket",
      "Use a lens hood and UV filter to protect optics",
      "Scout locations ahead and pack rain covers before storms"
    ]
  },
  traveling: {
    tips: [
      "Pack layers so you can adapt quickly to weather shifts",
      "Keep digital and paper copies of travel documents",
      "Share your itinerary with a trusted contact",
      "Carry a portable charger for devices",
      "Research local weather norms before departure"
    ]
  },
  other: {
    tips: [
      "Check the latest forecast hourly before departing",
      "Share your plan with a person you trust",
      "Carry water, snacks, and a basic first-aid kit",
      "Dress in layers for unexpected temperature changes",
      "Bring sun protection and rain protection"
    ]
  }
};

const factorDescription = (r: { score: number; risk: string; label: string; value: number | null; description?: string; subType?: string }) => {
  const labelText = r.label === "UV Index" ? "UV exposure" : r.subType === "cold" ? "Cold temperatures" : r.label;
  return `${labelText} is **${r.risk}** (${r.value ?? "—"}${r.label === "Rain" ? "% prob." : r.label === "Visibility" ? " km" : r.label === "UV Index" ? "" : r.label === "Wind" ? " km/h" : "°C"}). ${r.description ?? ""}`;
};

export const generateFallbackExplanation = (result: AnalysisResult): AIExplanation => {
  const { risk, weather, input } = result;
  const safest = risk.safestWindow;
  const activity = input.activity;
  const placeName = input.location.placeName ?? `${input.location.latitude.toFixed(4)}, ${input.location.longitude.toFixed(4)}`;

  const factors = risk.factors;
  const worstFactors = [factors.temperature, factors.rain, factors.wind, factors.visibility, factors.uv].sort(
    (a, b) => b.score - a.score
  );
  const topWorries = worstFactors.slice(0, 3).filter((f) => f.score > 33);

  const summaryParts: string[] = [];
  summaryParts.push(
    `On ${input.date} at ${placeName}, the overall risk for ${ACTIVITY_LABEL[activity]} is **${risk.overallRisk}** (${risk.score}/100).`
  );
  if (topWorries.length) {
    summaryParts.push(
      `The main concern${topWorries.length > 1 ? "s are" : " is"} ${topWorries
        .map((f: any) =>
          f.subType === "cold" ? "cold" : f.subType === "heat" ? "heat" : f.label.toLowerCase()
        )
        .join(", ")}.`
    );
  } else {
    summaryParts.push("Conditions look largely manageable with no dominant hazards.");
  }

  const riskBreakdown = worstFactors.slice(0, 4).map((f) => factorDescription(f as any));

  let windowReasoning = `The **safest window** is ${safest.startTime}–${safest.endTime}. `;
  const bestHour = risk.hourly.find((h) => h.hour >= safest.startHour && h.hour <= safest.endHour);
  if (bestHour) {
    const lowFactors: string[] = [];
    if (bestHour.factors.rain.score < 34) lowFactors.push("minimal rain risk");
    if (bestHour.factors.wind.score < 34) lowFactors.push("manageable wind");
    if (bestHour.factors.heat.score < 34 && bestHour.factors.cold.score < 34)
      lowFactors.push("comfortable temperature");
    if (bestHour.factors.visibility.score < 34) lowFactors.push("good visibility");
    windowReasoning += lowFactors.length
      ? `This period offers ${lowFactors.join(", ")}, resulting in an average risk of ${safest.risk} (${safest.averageScore}/100).`
      : `Risk scores are lowest across the board during this period.`;
  }

  const dynamicRecs: string[] = [];
  if (factors.rain.score > 33) dynamicRecs.push("Carry waterproof outer layers and pack essentials in dry bags.");
  if (factors.wind.score > 33) dynamicRecs.push("Secure loose gear and avoid exposed ridges/coastal routes in strong wind.");
  if (factors.temperature.subType === "heat" && factors.temperature.score > 33)
    dynamicRecs.push("Start early, take shaded breaks, and drink electrolytes to avoid heat illness.");
  if (factors.temperature.subType === "cold" && factors.temperature.score > 33)
    dynamicRecs.push("Dress in synthetic/wool layers and avoid cotton next to skin.");
  if (factors.uv.score > 33) dynamicRecs.push("Use SPF 50+ sunscreen, a wide-brim hat, and UV-blocking eyewear.");
  if (factors.visibility.score > 33) dynamicRecs.push("Reduce pace and carry navigation aids since visibility is reduced.");

  const baseTips = activityAdvice[activity].tips;
  const recommendations = [...dynamicRecs, ...baseTips].slice(0, 6);

  return {
    summary: summaryParts.join(" "),
    riskBreakdown,
    windowReasoning,
    recommendations
  };
};

export const answerFollowUpFallback = (
  question: string,
  context: AnalysisResult
): string => {
  const q = question.toLowerCase();
  const { risk } = context;

  const findRef = (words: string[]) => words.some((w) => q.includes(w));

  if (findRef(["afternoon", "12", "noon", "15", "3 pm", "3pm", "14", "13"])) {
    const h15 = risk.hourly.find((h) => h.hour === 15) ?? risk.hourly.find((h) => h.hour === 12);
    if (h15) {
      const top = [h15.factors.heat, h15.factors.rain, h15.factors.wind, h15.factors.uv]
        .sort((a, b) => b.score - a.score)[0];
      return `The 12:00–16:00 period is typically risky because of ${top.label.toLowerCase()} (${top.risk}, score ${top.score}/100). ${top.description ?? ""} Staying hydrated and avoiding exposed terrain during these hours will reduce risk.`;
    }
  }
  if (findRef(["morning", "early", "7", "07", "08", "09", "8", "9", "best", "why morning"])) {
    const safe = risk.safestWindow;
    return `Morning (${safe.startTime}–${safe.endTime}) is recommended because it consistently scores lowest on heat, rain, and wind — combined average risk is ${safe.risk} (${safe.averageScore}/100). UV and temperature are also milder, making planning more comfortable and safer overall.`;
  }
  if (findRef(["still", "reasonable", "ok", "safe to", "can i", "possible", "should"])) {
    if (risk.overallRisk === "LOW") return "Yes — conditions are generally favorable. Just follow the standard precautions and enjoy.";
    if (risk.overallRisk === "MEDIUM")
      return "It can still work if you time your outing to the recommended window and take extra precautions. Avoid the worst hours and monitor weather updates.";
    return "It is not recommended as planned. Consider rescheduling, or drastically shorten the activity and only go if you are experienced with mitigation gear.";
  }
  if (findRef(["biggest", "worst", "main problem", "main risk", "factor"])) {
    const arr = [risk.factors.temperature, risk.factors.rain, risk.factors.wind, risk.factors.visibility, risk.factors.uv];
    const top: any = [...arr].sort((a, b) => b.score - a.score)[0];
    const isTemp = top.label === risk.factors.temperature.label;
    const factorLabel = isTemp
      ? top.subType === "cold"
        ? "cold"
        : "heat"
      : top.label.toLowerCase();
    return `The biggest risk factor is ${factorLabel} at ${top.risk} (${top.score}/100). ${top.description ?? ""}`;
  }
  if (findRef(["wind"])) {
    return `Wind risk is ${risk.factors.wind.risk} with a score of ${risk.factors.wind.score}/100. ${risk.factors.wind.description ?? ""}`;
  }
  if (findRef(["rain", "wet", "storm", "precip"])) {
    return `Rain risk is ${risk.factors.rain.risk} with a score of ${risk.factors.rain.score}/100. ${risk.factors.rain.description ?? ""}`;
  }
  if (findRef(["temperature", "hot", "heat", "cold", "warm", "warm"])) {
    return `Temperature risk is ${risk.factors.temperature.risk} (${risk.factors.temperature.subType}, score ${risk.factors.temperature.score}/100). ${risk.factors.temperature.description ?? ""}`;
  }
  if (findRef(["uv", "sun", "sunburn"])) {
    return `UV index risk is ${risk.factors.uv.risk} (score ${risk.factors.uv.score}/100). ${risk.factors.uv.description ?? ""}`;
  }

  const summary = generateFallbackExplanation(context);
  return summary.summary + " " + summary.windowReasoning;
};
