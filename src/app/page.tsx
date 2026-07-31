import SearchBar from "./_components/layout/SearchBar";
import { HomeHero } from "./_components/home/HomeHero";
import HomeFeed from "./_components/home/HomeFeed.client";
import { LatestPetMarquee } from "./_components/home/LatestPetMarquee";
import { NearbyDiscovery } from "./_components/home/NearbyDiscovery";
import { PageShell } from "@/components/layout/PageShell";
import { toAbandonmentSeed, toLostSeed, toMarqueeItems } from "@/lib/homeFeed";
import { getHomeFeedSnapshot } from "@/lib/homeFeed.server";

export default async function Home() {
  const snapshot = await getHomeFeedSnapshot();
  const marqueeItems = toMarqueeItems(snapshot);
  const lostSeed = toLostSeed(snapshot.lost);
  const abandonmentSeed = toAbandonmentSeed(snapshot.abandonment);

  return (
    <PageShell surface="paper" className="overflow-hidden rounded-3xl">
      <HomeHero />
      <section aria-label="통합 검색" data-native-scroll className="px-4 pb-10 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <SearchBar variant="hero" />
        </div>
      </section>
      <LatestPetMarquee items={marqueeItems} />
      <NearbyDiscovery />
      <div className="px-4 py-12 lg:px-8">
        <HomeFeed lostSeed={lostSeed} abandonmentSeed={abandonmentSeed} />
      </div>
    </PageShell>
  );
}
