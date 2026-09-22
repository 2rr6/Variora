const languageScript = `(()=>{let l;try{l=localStorage.getItem('variora-locale')}catch{}const supported=['en','zh','ja','ko'];if(!supported.includes(l))l=navigator.languages.map(x=>x.split('-')[0]).find(x=>supported.includes(x))||'en';location.replace('/'+l+'/'+location.search+location.hash)})()`;
export default function Entry() {
  return (
    <main className="entry-page">
      <h1>Variora</h1>
      <div className="entry-loader" aria-hidden="true">
        <span />
      </div>
      <noscript>
        <meta httpEquiv="refresh" content="0; url=/en/" />
      </noscript>
      <script dangerouslySetInnerHTML={{ __html: languageScript }} />
    </main>
  );
}
