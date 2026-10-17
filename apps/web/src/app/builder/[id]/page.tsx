import { BuilderLoader } from "@/components/builder/builder-loader";

export default async function BuilderPage({ params }: PageProps<"/builder/[id]">) {
  const { id } = await params;
  return <BuilderLoader id={id} />;
}
