/**
 * Courts — mirrors the `courts` table (PRD §6). Both courts are identical:
 * indoor, Certified Premium Turf, 60-minute sessions (PRD §8.3).
 */
export interface Court {
  id: string;
  name: string;
  indoor: boolean;
  surface: string;
  sessionMinutes: number;
  description: string;
  image: string;
}

export const courts: Court[] = [
  {
    id: "court-1",
    name: "Court 1",
    indoor: true,
    surface: "Certified Premium Turf",
    sessionMinutes: 60,
    description:
      "Indoor court with high-quality turf and great lighting. Ideal for social play and energetic atmosphere.",
    image:
      "https://asset.ayo.co.id/image/venue-field/177285643694664.image_cropper_460E9955-436C-4A6A-A980-A15D2A69AC42-20140-00000840A1F49A4F.jpg.jpeg",
  },
  {
    id: "court-2",
    name: "Court 2",
    indoor: true,
    surface: "Certified Premium Turf",
    sessionMinutes: 60,
    description:
      "Indoor court with high-quality turf and great lighting. Ideal for social play and energetic atmosphere.",
    image:
      "https://asset.ayo.co.id/image/venue-field/177285645762426.image_cropper_676F9290-4550-406B-8CD2-E172D6910F81-20140-00000840C6648E0D.jpg.jpeg",
  },
];
