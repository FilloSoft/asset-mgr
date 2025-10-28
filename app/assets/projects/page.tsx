"use client";

import { useState } from "react";
import ProjectList from "@/components/project/ProjectList";

export default function AssetsProjectsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >(undefined);

  return (
    <ProjectList
      selectedProjectId={selectedProjectId}
      onProjectSelect={(project) => setSelectedProjectId(project.id)}
    />
  );
}
