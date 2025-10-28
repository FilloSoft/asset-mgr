"use client";

import { useState } from "react";
import CaseList from "@/components/case/CaseList";

export default function AssetsCasesPage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>();

  return (
    <CaseList
      selectedCaseId={selectedCaseId}
      onCaseSelect={(caseRecord) => setSelectedCaseId(caseRecord.id)}
    />
  );
}
