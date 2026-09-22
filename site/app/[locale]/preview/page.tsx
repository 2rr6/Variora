import { Suspense } from "react";
import { Preview } from "@/components/preview";
import { messages, type Locale } from "@/lib/i18n";

export const metadata = {
  // The query-dependent title is rendered by Preview or its loading fallback.
  title: null,
  robots: { index: false, follow: true },
};
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return (
    <main id="content" className="wrap preview-page">
      <Suspense
        fallback={
          <>
            <title>{`${messages[locale].previewTitle} - Variora`}</title>
            <p className="preview-loading" role="status">
              {messages[locale].loading}
            </p>
          </>
        }
      >
        <Preview locale={locale} />
      </Suspense>
    </main>
  );
}
