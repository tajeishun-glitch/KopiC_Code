import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "..", "public", "seed_materials");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const images = [
  {
    code: "BLK-005",
    name: "Autoclaved Aerated Concrete (AAC) Lightweight Blocks",
    url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRak1IxDCjdsVygr0A8LILURzuWUeR60YkmJ9qW1VcXp5qQQQ-CTR1JuR9f&s=10",
    file: "aac_blocks.jpg"
  },
  {
    code: "CEM-001",
    name: "Portland Cement (Ordinary Portland CEM I 52.5N)",
    url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpqFfV8j6N1kYqppEvZ4pJCa4sxs4hB8HbfLpXvx3mHQ&s=10",
    file: "portland_cement.jpg"
  },
  {
    code: "CON-004",
    name: "Ready-Mix Concrete Grade C40/50 (Waterproof Tremie Mix)",
    url: "https://cdn1.npcdn.net/images/200b7ef268c297cb1bdd90ace1cc441e_1732508785.webp?md5id=24ed200dcfcc1b04fad9d6e361e41ac9&new_width=1000&new_height=1000&w=-62170008925&from=jpeg&type=9",
    file: "readymix_concrete.webp"
  },
  {
    code: "STL-002",
    name: "High-Tensile Deformed Steel Rebar T16 (Grade B500B)",
    url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqTBoWmla5xBYmlZCm3QpGcBH-CFt-IyWggQ1fagcQtf654jZM9J-ziBk&s=10",
    file: "steel_rebar.jpg"
  },
  {
    code: "TIL-003",
    name: "Heavy-Duty Homogeneous Porcelain Floor Tiles (600x600mm)",
    url: "https://spcdn.shortpixel.ai/spio/ret_img+q_cdnize+to_webp+s_webp/jubincantik.com/wp-content/uploads/2025/04/LEIGHTON-DARK-GREY-600X600-5.jpg",
    file: "porcelain_tiles.jpg"
  }
];

function download(item) {
  return new Promise((resolve) => {
    const fetchUrl = (u) => {
      const client = u.startsWith("https") ? https : http;
      client.get(u, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchUrl(res.headers.location);
          return;
        }
        const filePath = path.join(dir, item.file);
        const stream = fs.createWriteStream(filePath);
        res.pipe(stream);
        stream.on("finish", () => {
          const buf = fs.readFileSync(filePath);
          const hash = crypto.createHash("md5").update(buf).digest("hex");
          console.log(`[OK] ${item.code} -> ${item.file} | Size: ${buf.length} bytes | MD5: ${hash}`);
          resolve({ ...item, size: buf.length, md5: hash });
        });
      }).on("error", (e) => {
        console.error(`[ERR] ${item.code}:`, e.message);
        resolve(null);
      });
    };
    fetchUrl(item.url);
  });
}

const results = [];
for (const item of images) {
  const res = await download(item);
  if (res) results.push(res);
}

fs.writeFileSync(path.join(dir, "signatures.json"), JSON.stringify(results, null, 2));
console.log("Finished caching images and signatures!");
