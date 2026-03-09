import type { Influencer } from "../backend.d";

const NICHE_KEYWORDS: Record<string, string[]> = {
  DeFi: [
    "defi",
    "yield",
    "liquidity",
    "dex",
    "amm",
    "protocol",
    "finance",
    "swap",
    "pool",
    "vault",
  ],
  Memes: [
    "meme",
    "degen",
    "ape",
    "moon",
    "fud",
    "wagmi",
    "ngmi",
    "pepe",
    "shib",
    "wif",
  ],
  "AI Crypto": [
    "ai",
    "agent",
    "llm",
    "neural",
    "gpt",
    "machine",
    "intelligence",
    "automated",
  ],
  GameFi: [
    "game",
    "play",
    "nft",
    "metaverse",
    "guild",
    "guild",
    "quest",
    "earn",
    "p2e",
  ],
  NFTs: [
    "nft",
    "art",
    "collection",
    "mint",
    "pfp",
    "holder",
    "floor",
    "opensea",
  ],
  L2: [
    "layer2",
    "l2",
    "rollup",
    "scaling",
    "base",
    "arbitrum",
    "optimism",
    "zk",
    "zkp",
  ],
  Web3: [
    "web3",
    "dao",
    "governance",
    "decentralized",
    "onchain",
    "blockchain",
    "wallet",
  ],
};

const HANDLE_PREFIXES = [
  "sol_",
  "eth_",
  "crypto_",
  "defi_",
  "nft_",
  "web3_",
  "chain_",
  "token_",
  "the_",
  "real_",
  "based_",
  "alpha_",
  "gm_",
  "wagmi_",
];

const HANDLE_SUFFIXES = [
  "degen",
  "whale",
  "maxi",
  "bull",
  "bear",
  "king",
  "queen",
  "ape",
  "frog",
  "alpha",
  "analyst",
  "trader",
  "builder",
  "dev",
  "founder",
  "anon",
  "max",
  "chad",
  "gigabrain",
  "captain",
  "wizard",
  "lord",
  "god",
  "elite",
];

// BIO_TEMPLATES reserved for future bio generation feature
const _BIO_TEMPLATES = [
  "Building on {chain} | {niche} enthusiast | NFA DYOR",
  "{niche} researcher & trader | {followers_k}K strong community | Alpha leaks daily",
  "Founder @{project} | {niche} dev | ex-{corp} | ship or die",
  "On-chain analyst | {niche} | Posting alpha since {year} | Views own",
  "{niche} maximalist | {followers_k}K degens follow me for a reason | DMs open",
  "Crypto native since {year} | {niche} & {niche2} | Building the future one block at a time",
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pickRandom<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function detectNiche(
  descriptions: string[],
  selectedNiches: string[],
): string[] {
  if (selectedNiches.length > 0) return selectedNiches;

  const combined = descriptions.join(" ").toLowerCase();
  const detected: string[] = [];

  for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS)) {
    if (keywords.some((kw) => combined.includes(kw))) {
      detected.push(niche);
    }
  }

  return detected.length > 0 ? detected : ["DeFi", "Web3"];
}

function generateHandle(rand: () => number, niches: string[]): string {
  const niche = pickRandom(niches, rand);
  const keywords = NICHE_KEYWORDS[niche] || NICHE_KEYWORDS.Web3;
  const keyword = pickRandom(keywords, rand);
  const suffix = pickRandom(HANDLE_SUFFIXES, rand);
  const prefix = pickRandom(HANDLE_PREFIXES, rand);

  const variant = Math.floor(rand() * 3);
  if (variant === 0) return `${keyword}_${suffix}`;
  if (variant === 1) return `${prefix}${keyword}`;
  return `${keyword}${Math.floor(rand() * 900 + 100)}`;
}

function generateTweetUrls(handle: string, rand: () => number): string[] {
  const count = Math.floor(rand() * 2) + 2;
  return Array.from({ length: count }, () => {
    const id = BigInt(Math.floor(rand() * 9e14 + 1e15)).toString();
    return `https://twitter.com/${handle}/status/${id}`;
  });
}

export function generateMockInfluencers(
  projectDescriptions: string[],
  selectedNiches: string[],
  minFollowers: number,
  minEngagement: number,
  count = 10,
): Influencer[] {
  const niches = detectNiche(projectDescriptions, selectedNiches);
  const seed = projectDescriptions
    .join("")
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from({ length: count }, (_, i) => {
    const rand_i = seededRandom((seed || 42) + i * 31337);
    const r = () => rand_i();

    const niche = pickRandom(niches, r);
    const handle = generateHandle(r, [niche]);

    // Followers: spread from minFollowers to 500k
    const followerBase =
      minFollowers + Math.floor(r() * (500000 - minFollowers));
    const followers = BigInt(followerBase);

    // Engagement: from minEngagement to 8%
    const engagement = minEngagement + r() * (8 - minEngagement);
    const avgEngagement = Math.round(engagement * 100) / 100;

    // Alignment: keyword overlap drives score
    const keywordsInDescriptions = niches.flatMap(
      (n) => NICHE_KEYWORDS[n] || [],
    );
    const descLower = projectDescriptions.join(" ").toLowerCase();
    const overlap = keywordsInDescriptions.filter((kw) =>
      descLower.includes(kw),
    ).length;
    const baseScore = Math.min(100, 30 + overlap * 8 + Math.floor(r() * 35));
    const alignmentScore = BigInt(Math.max(10, Math.min(100, baseScore)));

    const exampleTweetUrls = generateTweetUrls(handle, r);

    return {
      id: `mock_${handle}_${i}`,
      handle: `@${handle}`,
      followers,
      avgEngagement,
      alignmentScore,
      niche,
      exampleTweetUrls,
      savedAt: BigInt(0),
    };
  }).sort((a, b) => Number(b.alignmentScore) - Number(a.alignmentScore));
}
