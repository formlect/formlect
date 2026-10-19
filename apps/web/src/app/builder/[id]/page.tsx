import { BuilderLoader } from "@/components/builder/builder-loader";
import { TAB_IDS } from "@/components/builder/model";

export default async function BuilderPage({ params, searchParams }: PageProps<"/builder/[id]">) {
  const { id } = await params;
  const { tab } = await searchParams;
  return <BuilderLoader id={id} tab={TAB_IDS.find((t) => t === tab) ?? "build"} />;
}
