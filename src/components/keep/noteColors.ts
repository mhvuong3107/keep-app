export const noteColors: { name: string; value: string; class: string }[] = [
  { name: "Mặc định", value: "default", class: "bg-note" },
  { name: "San hô", value: "coral", class: "bg-note-coral" },
  { name: "Đào", value: "peach", class: "bg-note-peach" },
  { name: "Cát", value: "sand", class: "bg-note-sand" },
  { name: "Bạc hà", value: "mint", class: "bg-note-mint" },
  { name: "Xanh xám", value: "sage", class: "bg-note-sage" },
  { name: "Sương mù", value: "fog", class: "bg-note-fog" },
  { name: "Bão", value: "storm", class: "bg-note-storm" },
  { name: "Hoàng hôn", value: "dusk", class: "bg-note-dusk" },
  { name: "Hoa", value: "blossom", class: "bg-note-blossom" },
  { name: "Đất sét", value: "clay", class: "bg-note-clay" },
  { name: "Phấn", value: "chalk", class: "bg-note-chalk" },
];

export const getColorClass = (color: string) => {
  const found = noteColors.find((c) => c.value === color);
  return found ? found.class : "bg-note";
};
