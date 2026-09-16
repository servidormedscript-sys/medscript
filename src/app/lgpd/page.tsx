import Footer from "@/components/Footer";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import { legalDocuments } from "@/lib/legal/documents";
import type { Metadata } from "next";

const document = legalDocuments.lgpd;

export const metadata: Metadata = {
  title: `${document.title} — MEDScript`,
  description: document.description,
};

export default function LgpdPage() {
  return (
    <>
      <LegalPageLayout document={document} />
      <Footer />
    </>
  );
}
