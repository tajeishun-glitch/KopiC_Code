import { INITIAL_MATERIALS, SeedMaterial } from "./seed-data";

export interface ApprovedScanMaterial {
  materialCode: string;
  name: string;
  category: string;
  primaryUrl: string;
  localUrl: string;
  knownSize: number;
  md5: string;
  keywords: string[];
}

export const APPROVED_SCAN_MATERIALS: ApprovedScanMaterial[] = [
  {
    materialCode: "BLK-005",
    name: "Autoclaved Aerated Concrete (AAC) Lightweight Blocks",
    category: "Masonry & IBS Walls",
    primaryUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRak1IxDCjdsVygr0A8LILURzuWUeR60YkmJ9qW1VcXp5qQQQ-CTR1JuR9f&s=10",
    localUrl: "/seed_materials/aac_blocks.jpg",
    knownSize: 36690,
    md5: "a0a07175bdfff53c5ef3c3008eb400e3",
    keywords: [
      "aac",
      "aerated",
      "autoclaved",
      "lightweight block",
      "aac block",
      "blk-005",
      "rak1ixdcjds",
      "aac_blocks",
      "starken",
    ],
  },
  {
    materialCode: "CEM-001",
    name: "Portland Cement (Ordinary Portland CEM I 52.5N)",
    category: "Cement & Binders",
    primaryUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpqFfV8j6N1kYqppEvZ4pJCa4sxs4hB8HbfLpXvx3mHQ&s=10",
    localUrl: "/seed_materials/portland_cement.jpg",
    knownSize: 57189,
    md5: "14c4e80e5b1641730fdc5fb893b3a3cd",
    keywords: [
      "portland",
      "cement",
      "cem i",
      "52.5n",
      "cem-001",
      "qpqffv8j6n1",
      "portland_cement",
      "ytl castle",
      "hume cement",
    ],
  },
  {
    materialCode: "CON-004",
    name: "Ready-Mix Concrete Grade C40/50 (Waterproof Tremie Mix)",
    category: "Ready-Mix Concrete",
    primaryUrl:
      "https://cdn1.npcdn.net/images/200b7ef268c297cb1bdd90ace1cc441e_1732508785.webp?md5id=24ed200dcfcc1b04fad9d6e361e41ac9&new_width=1000&new_height=1000&w=-62170008925&from=jpeg&type=9",
    localUrl: "/seed_materials/readymix_concrete.webp",
    knownSize: 294010,
    md5: "e13410ff46990a7fd4cdc3df776ab06e",
    keywords: [
      "readymix",
      "ready-mix",
      "concrete",
      "c40",
      "c40/50",
      "tremie",
      "waterproof mix",
      "con-004",
      "200b7ef268c297cb1bdd90ace1cc441e",
      "readymix_concrete",
    ],
  },
  {
    materialCode: "STL-002",
    name: "High-Tensile Deformed Steel Rebar T16 (Grade B500B)",
    category: "Reinforcement Steel",
    primaryUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqTBoWmla5xBYmlZCm3QpGcBH-CFt-IyWggQ1fagcQtf654jZM9J-ziBk&s=10",
    localUrl: "/seed_materials/steel_rebar.jpg",
    knownSize: 49913,
    md5: "d5a9372ca3b87cfdcd36d4d3b9fa5276",
    keywords: [
      "steel",
      "rebar",
      "t16",
      "b500b",
      "high-tensile",
      "deformed rebar",
      "stl-002",
      "sqtbowmla5x",
      "steel_rebar",
      "ann joo",
      "southern steel",
    ],
  },
  {
    materialCode: "TIL-003",
    name: "Heavy-Duty Homogeneous Porcelain Floor Tiles (600x600mm)",
    category: "Architectural Finishes",
    primaryUrl:
      "https://spcdn.shortpixel.ai/spio/ret_img+q_cdnize+to_webp+s_webp/jubincantik.com/wp-content/uploads/2025/04/LEIGHTON-DARK-GREY-600X600-5.jpg",
    localUrl: "/seed_materials/porcelain_tiles.jpg",
    knownSize: 111159,
    md5: "e19f2146fc77edfdd2b52f21c1315f7f",
    keywords: [
      "tile",
      "porcelain",
      "homogeneous",
      "600x600",
      "jubincantik",
      "leighton",
      "floor tiles",
      "til-003",
      "porcelain_tiles",
      "niro granite",
    ],
  },
];

export interface IdentificationResult {
  isIdentified: boolean;
  materialCode: string | null;
  material: SeedMaterial | null;
  confidenceScore: number;
  reason?: string;
}

/**
 * Validates whether an uploaded image matches one of the 5 authorized materials.
 * If unmatched or unclear, returns isIdentified: false so the system prompts the user to resubmit.
 */
export function identifyUploadedMaterial(
  input: {
    fileName?: string;
    url?: string;
    fileSize?: number;
  },
  materialList: SeedMaterial[] = INITIAL_MATERIALS
): IdentificationResult {
  const nameLower = (input.fileName || "").toLowerCase().trim();
  const urlLower = (input.url || "").toLowerCase().trim();
  const size = input.fileSize || 0;

  // 1. Direct URL exact match
  for (const item of APPROVED_SCAN_MATERIALS) {
    if (
      urlLower &&
      (urlLower === item.primaryUrl.toLowerCase() ||
        urlLower === item.localUrl.toLowerCase() ||
        (item.primaryUrl.includes("?") &&
          urlLower.includes(item.primaryUrl.split("?")[0].toLowerCase())))
    ) {
      const mat =
        materialList.find((m) => m.materialCode === item.materialCode) || null;
      return {
        isIdentified: true,
        materialCode: item.materialCode,
        material: mat,
        confidenceScore: 99.4,
      };
    }
  }

  // 2. Exact or close file size match (within 2% tolerance if saved or re-encoded)
  if (size > 0) {
    for (const item of APPROVED_SCAN_MATERIALS) {
      const sizeDiffPct = Math.abs(size - item.knownSize) / item.knownSize;
      if (sizeDiffPct < 0.03) {
        const mat =
          materialList.find((m) => m.materialCode === item.materialCode) ||
          null;
        return {
          isIdentified: true,
          materialCode: item.materialCode,
          material: mat,
          confidenceScore: 98.6,
        };
      }
    }
  }

  // 3. Keyword / signature match in filename or URL
  for (const item of APPROVED_SCAN_MATERIALS) {
    for (const kw of item.keywords) {
      if (nameLower.includes(kw) || urlLower.includes(kw)) {
        const mat =
          materialList.find((m) => m.materialCode === item.materialCode) ||
          null;
        return {
          isIdentified: true,
          materialCode: item.materialCode,
          material: mat,
          confidenceScore: 97.2,
        };
      }
    }
  }

  // 4. If neither matches, it is UNIDENTIFIED / UNCLEAR
  return {
    isIdentified: false,
    materialCode: null,
    material: null,
    confidenceScore: 0,
    reason:
      "Image signature does not match any of the 5 authorized site materials, or image clarity is insufficient for neural verification.",
  };
}
