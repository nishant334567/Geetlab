"use client";

import { useParams } from "next/navigation";
import WriteWorkspace from "@/app/components/WriteWorkspace";

export default function WriteIdeaPage() {
  const params = useParams();
  const id = params?.id;
  if (!id || typeof id !== "string") {
    return null;
  }
  return <WriteWorkspace ideaId={id} />;
}
