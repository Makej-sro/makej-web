// Makej Employer — responzivní vrstva
//
// POZNÁMKA: dřívější verze tohohle souboru přepisovala tokeny T přes Object.assign,
// aby byl dashboard světlý. To už je zbytečné — app.jsx má vlastní THEME_LIGHT/THEME_DARK
// a přepínač window.toggleMakejTheme(). Kdyby se tu tokeny přepisovaly znovu, přepnutí
// do tmavého a zpět by je zahodilo (toggle dělá Object.assign(T, THEME_LIGHT)).
// Zůstává proto jen hook na mobilní režim.

// Breakpoint pro přepnutí sidebaru do výsuvného drawer režimu.
const MOBILE_BP = 820;

function useIsMobile(bp = MOBILE_BP) {
  const [m, setM] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth <= bp : false
  );
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp}px)`);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on); };
  }, [bp]);
  return m;
}

Object.assign(window, { MOBILE_BP, useIsMobile });
