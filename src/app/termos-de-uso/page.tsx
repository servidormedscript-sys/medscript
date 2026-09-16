import Footer from "@/components/Footer";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import { legalDocuments } from "@/lib/legal/documents";
import type { Metadata } from "next";

const document = legalDocuments["termos-de-uso"];

export const metadata: Metadata = {
  title: `${document.title} — MEDScript`,
  description: document.description,
};

export default function TermosDeUsoPage() {
  return (
    <>
      <LegalPageLayout document={document} />
      <Footer />
    </>
  );
}
