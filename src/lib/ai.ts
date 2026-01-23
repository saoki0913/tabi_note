import type { Trip } from "../types/trip";

export const generateAiContent = (trip: Trip) => {
  const destinations = trip.destination.split(",").map((item) => item.trim());
  const primaryDestination = destinations[0] || trip.destination;

  const coverCopies = [
    `${primaryDestination}で過ごす、忘れられない${getDays(trip)}日間`,
    `心に残る旅へ - ${primaryDestination}の冒険`,
    `${primaryDestination}で創る、特別な思い出`,
    `さぁ、${primaryDestination}へ出かけよう！`,
  ];

  const overviewTexts = {
    polite: `この度は${primaryDestination}への旅行をお楽しみください。${trip.members.length}名での素敵な旅になることを願っています。${
      trip.transportText ? `移動は${trip.transportText}を利用します。` : ""
    }楽しい時間をお過ごしください。`,
    casual: `${primaryDestination}への旅、楽しみだね！${trip.members.length}人で最高の思い出作ろう！${
      trip.transportText
        ? `${trip.transportText}での移動も旅の一部だよ。`
        : ""
    }わくわくが止まらない！`,
  };

  const daySummaries: Record<number, string> = {};
  trip.dayPlans.forEach((plan) => {
    if (plan.activities.length === 0) return;
    const tone =
      trip.aiTone === "polite"
        ? `${plan.activities.length}つのアクティビティを予定しています。素敵な一日になりますように。`
        : `${plan.activities.length}つのスポットを回る予定！楽しい一日になりそう！`;
    daySummaries[plan.day] = tone;
  });

  const cautionsTexts = {
    polite:
      "・現地の気候に合わせた服装をご準備ください\n・貴重品の管理にはご注意ください\n・集合時間を厳守いただきますようお願いします\n・緊急連絡先を共有しておきましょう",
    casual:
      "・天気チェックして服装決めよう\n・貴重品はしっかり管理してね\n・集合時間は守ろう！\n・緊急連絡先は共有しておこう",
  };

  const packingSuggestions = [
    "着替え（日数分+予備1組）",
    "洗面用具・タオル",
    "常備薬・保険証",
    "スマートフォン充電器",
    "雨具（折りたたみ傘）",
    "カメラ・モバイルバッテリー",
    "日焼け止め",
    "エコバッグ",
  ];

  return {
    coverCopy: coverCopies[Math.floor(Math.random() * coverCopies.length)],
    overviewText: overviewTexts[trip.aiTone],
    daySummaries,
    cautionsText: cautionsTexts[trip.aiTone],
    packingSuggestions,
  };
};

const getDays = (trip: Trip): number => {
  if (!trip.startDate || !trip.endDate) {
    return 1;
  }
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
};

export const regenerateAiContent = (trip: Trip) => {
  return generateAiContent(trip);
};
