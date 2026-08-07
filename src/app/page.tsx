import SearchBar from "./_components/layout/SearchBar";
import { HomeHero } from "./_components/home/HomeHero";
import HomeFeed from "./_components/home/HomeFeed.client";
import { HomeMotionRuntime } from "./_components/home/HomeMotionRuntime.client";
import { LatestPetMarquee } from "./_components/home/LatestPetMarquee";
import { NearbyDiscovery } from "./_components/home/NearbyDiscovery";
import { PageShell } from "@/components/layout/PageShell";
import { toAbandonmentSeed, toLostSeed, toMarqueeItems } from "@/lib/homeFeed";
import { getHomeFeedSnapshot } from "@/lib/homeFeed.server";

export default async function Home() {
  const snapshot = await getHomeFeedSnapshot();
  const marqueeItems = toMarqueeItems(snapshot);
  const heroPhotoItems = marqueeItems.filter((item) => item.key.startsWith("abandoned:"));
  const heroLostPhotoItems = marqueeItems.filter((item) => item.key.startsWith("lost:"));
  const lostSeed = toLostSeed(snapshot.lost);
  const abandonmentSeed = toAbandonmentSeed(snapshot.abandonment);

  return (
    <PageShell data-home-motion-root surface="paper">
      <HomeMotionRuntime />
      <div data-home-motion="hero">
        <HomeHero photoItems={heroPhotoItems} lostPhotoItems={heroLostPhotoItems}>
          <SearchBar variant="hero" />
        </HomeHero>
      </div>
      <div data-home-motion="latest">
        <LatestPetMarquee items={marqueeItems} />
      </div>
      <div data-home-motion="nearby">
        <NearbyDiscovery />
      </div>
      <div data-home-motion="feed" className="mx-auto w-full max-w-page px-4 py-14 md:px-6">
        <HomeFeed lostSeed={lostSeed} abandonmentSeed={abandonmentSeed} />
      </div>
    </PageShell>
  );
}
