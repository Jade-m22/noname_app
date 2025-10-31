import React, {useEffect} from 'react';
import Head from '@docusaurus/Head';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function Home() {
  const cssHref = useBaseUrl('/landing/styles.css');
  const jsSrc   = useBaseUrl('/landing/script.js');
  const baseUrl = useBaseUrl('/'); // e.g. "/noname_app/"

  useEffect(() => {
    if (window.__DBMARKET_SCRIPT_APPENDED) return;
    const s = document.createElement('script');
    s.src = jsSrc;
    s.defer = true;             // mieux que async ici
    document.body.appendChild(s);
    window.__DBMARKET_SCRIPT_APPENDED = true;
  }, [jsSrc]);

  return (
    <Layout>
      <Head>
        <title>From Noise to Trust</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* pour que script.js sache le baseUrl si besoin */}
        <meta name="docusaurus:baseUrl" content={baseUrl} />
        <link rel="stylesheet" href={cssHref} />
        {/* masquer la navbar en douceur */}
        <style>{`
          .navbar, .navbar--fixed-top { display: none !important; }
          .main-wrapper { padding-top: 0 !important; }
          html, body { background: #05060a; }
        `}</style>
      </Head>

      {/* Landing */}
      <canvas id="scene"></canvas>

      <div className="overlay" aria-live="polite">
        <p className="kicker" id="kicker">Prologue</p>
        <h1 id="title" className="line title-prologue">
          The world overflows with information.
        </h1>
        <p id="line1" className="line">
          Billions of voices speak at once, each certain, none aligned.
        </p>
        <p id="line2" className="line">
          Trust thins. Meaning blurs. Noise reigns.
        </p>
      </div>

      <div id="scroll-spacer" aria-hidden="true"></div>
    </Layout>
  );
}
