export type ParentStatus = "active" | "pending";

export type Parent = {
  id: string;
  // Initials rendered inside the avatar circle ("L", "D").
  initials: string;
  avatarBg: string;
  // Spanish UI label: "Lucía Fernández".
  name: string;
  // Spanish UI label: "Mamá · activa" | "Papá · invitación enviada".
  relationLabel: string;
  status: ParentStatus;
};

export type Kid = {
  // Slug used as the URL segment: "mateo-fernandez" → /kids/mateo-fernandez.
  id: string;
  firstName: string;
  lastName: string;
  // Spanish UI label: "3 años".
  ageLabel: string;
  // Spanish UI label: "2 padres vinculados" | "sin padres vinculados".
  parentsLinkedLabel: string;
  avatarBg: string;
  avatarFg: string;
  // Spanish UI label rendered as the pill badge: "MANÍ" | "LACTOSA".
  allergyTag?: string;
  // Renders the VINCULAR pill instead of the chevron in the list card.
  needsLinking?: boolean;
  // Spanish UI label: "12 mar 2022".
  birthDateLabel: string;
  // Spanish UI label: "Soles".
  roomLabel: string;
  // Spanish UI label: "feb 2025".
  enrolledLabel: string;
  // Spanish UI text of the red "Alergias y notas" banner. Omitted when absent.
  allergyNotice?: string;
  parents: Parent[];
};

// Mock kids content mirroring the reference comps
// (references/pantallas/ninos.dc.html and perfil-nino.dc.html).
// Internal code in English; user-facing strings stay in Spanish, as in the comps.
// Mateo's data is copied verbatim from perfil-nino.dc.html; the rest is plausible
// mock data in the exact same fields.
export const kids: Kid[] = [
  {
    id: "mateo-fernandez",
    firstName: "Mateo",
    lastName: "Fernández",
    ageLabel: "3 años",
    parentsLinkedLabel: "2 padres vinculados",
    avatarBg: "#A9D9E8",
    avatarFg: "#1F7A93",
    allergyTag: "MANÍ",
    birthDateLabel: "12 mar 2022",
    roomLabel: "Soles",
    enrolledLabel: "feb 2025",
    allergyNotice: "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    parents: [
      {
        id: "lucia-fernandez",
        initials: "L",
        avatarBg: "#C9B6E8",
        name: "Lucía Fernández",
        relationLabel: "Mamá · activa",
        status: "active",
      },
      {
        id: "diego-fernandez",
        initials: "D",
        avatarBg: "#A9C7E8",
        name: "Diego Fernández",
        relationLabel: "Papá · invitación enviada",
        status: "pending",
      },
    ],
  },
  {
    id: "sofia-mendez",
    firstName: "Sofía",
    lastName: "Méndez",
    ageLabel: "2 años",
    parentsLinkedLabel: "1 padre vinculado",
    avatarBg: "#F4B8CC",
    avatarFg: "#C44A7A",
    birthDateLabel: "3 sep 2023",
    roomLabel: "Soles",
    enrolledLabel: "feb 2025",
    parents: [
      {
        id: "valeria-mendez",
        initials: "V",
        avatarBg: "#C9B6E8",
        name: "Valeria Méndez",
        relationLabel: "Mamá · activa",
        status: "active",
      },
    ],
  },
  {
    id: "benjamin-ruiz",
    firstName: "Benjamín",
    lastName: "Ruiz",
    ageLabel: "3 años",
    parentsLinkedLabel: "2 padres vinculados",
    avatarBg: "#B9DEC4",
    avatarFg: "#3E8B62",
    birthDateLabel: "28 jul 2022",
    roomLabel: "Soles",
    enrolledLabel: "jul 2024",
    parents: [
      {
        id: "pablo-ruiz",
        initials: "P",
        avatarBg: "#A9C7E8",
        name: "Pablo Ruiz",
        relationLabel: "Papá · activa",
        status: "active",
      },
      {
        id: "marta-ruiz",
        initials: "M",
        avatarBg: "#F4B8CC",
        name: "Marta Ruiz",
        relationLabel: "Mamá · activa",
        status: "active",
      },
    ],
  },
  {
    id: "valentina-soto",
    firstName: "Valentina",
    lastName: "Soto",
    ageLabel: "2 años",
    parentsLinkedLabel: "sin padres vinculados",
    avatarBg: "#F4DC8E",
    avatarFg: "#9A7B1E",
    needsLinking: true,
    birthDateLabel: "9 nov 2023",
    roomLabel: "Soles",
    enrolledLabel: "mar 2025",
    parents: [],
  },
  {
    id: "tomas-diaz",
    firstName: "Tomás",
    lastName: "Díaz",
    ageLabel: "3 años",
    parentsLinkedLabel: "1 padre vinculado",
    avatarBg: "#C9B6E8",
    avatarFg: "#7B5FC0",
    allergyTag: "LACTOSA",
    birthDateLabel: "15 jun 2022",
    roomLabel: "Soles",
    enrolledLabel: "feb 2025",
    allergyNotice: "Intolerancia a la lactosa. Evitar lácteos; toma bebida vegetal en el desayuno.",
    parents: [
      {
        id: "jorge-diaz",
        initials: "J",
        avatarBg: "#B9DEC4",
        name: "Jorge Díaz",
        relationLabel: "Papá · activa",
        status: "active",
      },
    ],
  },
  {
    id: "emma-castro",
    firstName: "Emma",
    lastName: "Castro",
    ageLabel: "2 años",
    parentsLinkedLabel: "1 padre vinculado",
    avatarBg: "#F4B8CC",
    avatarFg: "#C44A7A",
    birthDateLabel: "2 oct 2023",
    roomLabel: "Soles",
    enrolledLabel: "feb 2025",
    parents: [
      {
        id: "micaela-castro",
        initials: "M",
        avatarBg: "#F4DC8E",
        name: "Micaela Castro",
        relationLabel: "Mamá · activa",
        status: "active",
      },
    ],
  },
  {
    id: "lucas-romero",
    firstName: "Lucas",
    lastName: "Romero",
    ageLabel: "3 años",
    parentsLinkedLabel: "1 padre vinculado",
    avatarBg: "#A9D9E8",
    avatarFg: "#1F7A93",
    birthDateLabel: "20 nov 2022",
    roomLabel: "Soles",
    enrolledLabel: "jul 2024",
    parents: [
      {
        id: "andres-romero",
        initials: "A",
        avatarBg: "#C9B6E8",
        name: "Andrés Romero",
        relationLabel: "Papá · activa",
        status: "active",
      },
    ],
  },
  {
    id: "olivia-vega",
    firstName: "Olivia",
    lastName: "Vega",
    ageLabel: "2 años",
    parentsLinkedLabel: "1 padre vinculado",
    avatarBg: "#B9DEC4",
    avatarFg: "#3E8B62",
    birthDateLabel: "11 dic 2023",
    roomLabel: "Soles",
    enrolledLabel: "feb 2025",
    parents: [
      {
        id: "carla-vega",
        initials: "C",
        avatarBg: "#A9C7E8",
        name: "Carla Vega",
        relationLabel: "Mamá · activa",
        status: "active",
      },
    ],
  },
];
