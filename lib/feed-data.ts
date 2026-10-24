export type PostKind = "achievement" | "activity" | "announcement";

export type Post = {
  id: string;
  kind: PostKind;
  // Rendered as "Mateo" | "Anuncio general".
  authorLabel: string;
  // Rendered as "14:20 · publicado por vos".
  timeLabel: string;
  // Rendered as "Para: familia de Mateo" | "Para: toda la sala".
  audienceLabel: string;
  body: string;
  // Rendered as "Foto · pintando con témperas" (activity only).
  photoCaption?: string;
  likes: number;
  comments: number;
};

// Mock feed content mirroring the reference comp (references/pantallas/feed.dc.html).
// Internal code in English; user-facing strings stay in Spanish, as in the comps.
export const feedPosts: Post[] = [
  {
    id: "potty-training-milestone",
    kind: "achievement",
    authorLabel: "Mateo",
    timeLabel: "14:20 · publicado por vos",
    audienceLabel: "Para: familia de Mateo",
    body: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "tempera-painting",
    kind: "activity",
    authorLabel: "Mateo",
    timeLabel: "09:40 · publicado por vos",
    audienceLabel: "Para: familia de Mateo",
    body: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photoCaption: "Foto · pintando con témperas",
    likes: 5,
    comments: 2,
  },
  {
    id: "park-outing-reminder",
    kind: "announcement",
    authorLabel: "Anuncio general",
    timeLabel: "07:50 · publicado por vos",
    audienceLabel: "Para: toda la sala",
    body: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];
